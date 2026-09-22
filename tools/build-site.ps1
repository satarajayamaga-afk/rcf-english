<#
    ===========================================================================
    RCF English - site builder
    ---------------------------------------------------------------------------
    Reads:   _src/config.json      site-wide settings (one place)
             _src/nav.json         the menus
             _src/pages/*.json     one file per page
             data/*.json           resources, papers, classes, quizzes, notices

    Writes:  index.html and one folder + index.html for every page
             sitemap.xml, robots.txt, 404.html
             data/search-index.json
             assets/js/site-config.js

    Run it by double-clicking build.cmd, or from PowerShell:
             powershell -ExecutionPolicy Bypass -File tools\build-site.ps1

    It refuses to finish if any menu item or link points at a page that does
    not exist, so the published site cannot contain a broken internal link.
    ===========================================================================
#>

[CmdletBinding()]
param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$utf8 = New-Object System.Text.UTF8Encoding($false)
$script:Links = New-Object System.Collections.ArrayList
$script:Slugs = New-Object System.Collections.Generic.HashSet[string]
$script:Warnings = New-Object System.Collections.ArrayList
$script:SearchIndex = New-Object System.Collections.ArrayList
$script:Root = ''
$script:PageSlug = ''
$script:FaqEntries = $null

function Say($text, $colour = 'Gray') {
    if (-not $Quiet) { Write-Host $text -ForegroundColor $colour }
}

# ---------------------------------------------------------------- helpers --

function P($obj, $name, $fallback = $null) {
    if ($null -eq $obj) { return $fallback }
    $prop = $obj.PSObject.Properties[$name]
    if ($null -eq $prop -or $null -eq $prop.Value) { return $fallback }
    return $prop.Value
}

# Always hand back a real list, even when it holds a single item.
#
# The leading comma matters. Without it PowerShell unrolls a one-item array on
# the way out of the function, so the caller receives the item itself and
# .Count is empty rather than 1. That silently swallowed any hero button list
# that contained exactly one button.
function AsList($value) {
    if ($null -eq $value) { return @() }
    return , @($value)
}

function E($text) {
    if ($null -eq $text) { return '' }
    $t = [string]$text
    $t = $t.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')
    $t = $t.Replace('"', '&quot;').Replace("'", '&#39;')
    return $t
}

function JsonString($text) {
    if ($null -eq $text) { return '""' }
    return (ConvertTo-Json ([string]$text) -Compress)
}

# ---------------------------------------------------------- RCF Publications
#
# RCF Publications is a separate website. Until it has a real published
# address, PUBLICATIONS_WEBSITE_URL in _src/config.json is left as a
# placeholder - and a placeholder must never become a link, because it would
# lead nowhere.
#
# So while the bookshop is not published, every link to it is turned into an
# ordinary internal link to the page that explains what RCF Publications is,
# marked "Coming soon". The moment a real https:// address is put in the
# config file and the site is rebuilt, all of them become external links to
# the bookshop. Nothing else has to be edited.

function PubIsLive() {
    $v = [string]$script:Config.PUBLICATIONS_WEBSITE_URL
    # Live means "we have somewhere real to send people". That can be an
    # internal section of this website or, one day, an external bookshop.
    # Only the untouched placeholder counts as not-live.
    return ($v -and $v -ne 'PUBLICATIONS_WEBSITE_URL')
}

# True only when the destination is a different website. Internal sections
# must not be given an external-link marker or opened in a new tab.
function PubIsExternal() {
    return (([string]$script:Config.PUBLICATIONS_WEBSITE_URL) -match '^https?://')
}

# Attributes and wording that only make sense for an off-site link.
function PubExtClass() { if (PubIsExternal) { return ' ext' } else { return '' } }
function PubExtAttrs() { if (PubIsExternal) { return ' target="_blank" rel="noopener"' } else { return '' } }
function PubExtNote()  { if (PubIsExternal) { return ' (external website, opens in a new tab)' } else { return '' } }

function IsPub($value) {
    return ([string]$value -eq 'PUBLICATIONS_WEBSITE_URL')
}

# The page that stands in for the bookshop until it is published.
$script:PubFallback = 'about/rcf-publications/'

# Turn a site-root path such as "ol-english/grammar/" into a link that works
# from the page being written, whatever address the site is published at.
function Url($value) {
    if ($null -eq $value) { return '' }
    $v = [string]$value
    if (IsPub $v) {
        # Assign rather than return, so an internal destination goes on to
        # get the usual root prefix and is checked by the link checker.
        # An external https:// address still returns early just below.
        if (PubIsLive) { $v = [string]$script:Config.PUBLICATIONS_WEBSITE_URL }
        else { $v = $script:PubFallback }
    }
    if ($v -match '^(https?:|mailto:|tel:|#)') { return $v }
    $v = $v -replace '^/', ''
    $query = ''
    if ($v -match '^([^?#]*)([?#].*)$') { $query = $Matches[2]; $v = $Matches[1] }
    if ($v -ne '') { [void]$script:Links.Add(@{ Target = $v; From = $script:PageSlug }) }
    $href = $script:Root + $v + $query
    # An empty href would mean "this exact address" and reads badly to screen
    # readers, so the home link on the home page becomes "./" instead.
    if ($href -eq '') { $href = './' }
    return $href
}

function IsExternal($value) {
    $v = [string]$value
    # The bookshop is only an external link when it lives on another site.
    if (IsPub $v) { return (PubIsExternal) }
    return ($v -match '^https?:')
}

# The marker shown beside a bookshop link: "external bookshop" once it is
# published, "Coming soon" until then.
function PubBadge() {
    if (PubIsExternal) { return '<span class="badge-ext">External bookshop</span>' }
    if (PubIsLive) { return '' }
    return '<span class="badge-soon">Coming soon</span>'
}

# Wording used in screen-reader-only notes and button labels.
function PubNote() {
    if (PubIsExternal) { return ' (external bookshop, opens in a new tab)' }
    if (PubIsLive) { return '' }
    # Describes where the link goes. The page itself explains that the
    # bookshop website is not open yet, so the link text need not repeat it.
    return ' (about RCF Publications)'
}

# A very small inline notation so page files stay readable:
#   **bold**   *italic*   `code`   [link text](where/)
# Text is escaped first, so nothing in a page file can inject raw HTML.
function Inline($text) {
    $t = E $text
    $t = [regex]::Replace($t, '\[([^\]]+)\]\(([^)\s]+)\)', {
            param($m)
            $target = $m.Groups[2].Value
            $href = Url $target
            $extra = ''
            if (IsExternal $target) { $extra = ' target="_blank" rel="noopener" class="ext"' }
            '<a href="' + (E $href) + '"' + $extra + '>' + $m.Groups[1].Value + '</a>'
        })
    $t = [regex]::Replace($t, '\*\*([^*]+)\*\*', '<strong>$1</strong>')
    $t = [regex]::Replace($t, '(?<![\*\w])\*([^*\n]+)\*(?!\*)', '<em>$1</em>')
    $t = [regex]::Replace($t, '`([^`]+)`', '<code>$1</code>')
    return $t
}

function Paragraphs($items) {
    $out = ''
    foreach ($p in (AsList $items)) { $out += '<p>' + (Inline $p) + '</p>' }
    return $out
}

function Bullets($items, $ordered = $false, $start = 0) {
    $list = AsList $items
    if ($list.Count -eq 0) { return '' }
    $tag = if ($ordered) { 'ol' } else { 'ul' }
    $out = "<$tag>"
    if ($ordered -and $start -gt 1) { $out = "<ol start=`"$start`">" }
    foreach ($i in $list) { $out += '<li>' + (Inline $i) + '</li>' }
    return $out + "</$tag>"
}

function Slugify($text) {
    $t = ([string]$text).ToLower()
    $t = [regex]::Replace($t, '[^a-z0-9]+', '-')
    return $t.Trim('-')
}

function Depth($slug) {
    if ([string]::IsNullOrEmpty($slug)) { return 0 }
    return ($slug.Trim('/') -split '/').Count
}

function RootFor($slug) {
    $d = Depth $slug
    if ($d -eq 0) { return '' }
    return ('../' * $d)
}

# ------------------------------------------------------------ load inputs --

Say ''
Say '  RCF English - building the site' 'Cyan'
Say '  --------------------------------' 'Cyan'

function ReadJson($path) {
    if (-not (Test-Path $path)) { throw "Missing file: $path" }
    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    try { return ($text | ConvertFrom-Json) }
    catch { throw "$path contains a typing mistake and could not be read. $($_.Exception.Message)" }
}

$script:Config = ReadJson (Join-Path $ProjectRoot '_src\config.json')
$nav = ReadJson (Join-Path $ProjectRoot '_src\nav.json')

$dataDir = Join-Path $ProjectRoot 'data'
$script:Data = @{}
if (Test-Path $dataDir) {
    foreach ($file in Get-ChildItem $dataDir -Filter *.json) {
        if ($file.Name -eq 'search-index.json') { continue }
        $script:Data[$file.BaseName] = ReadJson $file.FullName
    }
}

$pageFiles = @(Get-ChildItem (Join-Path $ProjectRoot '_src\pages') -Filter *.json -Recurse | Sort-Object FullName)
Say "  Page files found: $($pageFiles.Count)"

# A page file may hold one page object, or a list of pages under "pages".
$pages = @()
foreach ($file in $pageFiles) {
    if ($file.Name.StartsWith('_')) { continue }   # _template-*.json files are examples only
    $loaded = ReadJson $file.FullName
    $group = @()
    if ($loaded -is [System.Array]) { $group = $loaded }
    elseif ($null -ne (P $loaded 'pages')) { $group = AsList (P $loaded 'pages') }
    else { $group = @($loaded) }

    foreach ($page in $group) {
        $page | Add-Member -NotePropertyName '_file' -NotePropertyValue $file.Name -Force
        $slug = ([string](P $page 'slug' '')).Trim('/')
        $page | Add-Member -NotePropertyName '_slug' -NotePropertyValue $slug -Force
        if ($script:Slugs.Contains($slug)) { throw "Two pages use the same slug: '$slug' (see $($file.Name))" }
        [void]$script:Slugs.Add($slug)
        $pages += $page
    }
}

# Records used by data-driven blocks
function DataList($name, $property = 'items') {
    if (-not $script:Data.ContainsKey($name)) { return @() }
    $value = $script:Data[$name]
    if ($value -is [System.Array]) { return $value }
    $inner = P $value $property
    if ($null -ne $inner) { return (AsList $inner) }
    return @()
}

$classes = @(DataList 'classes' 'classes')
$courses = @()
if ($script:Data.ContainsKey('classes')) { $courses = AsList (P $script:Data['classes'] 'courses') }
$papers = @(DataList 'papers' 'items')
$resources = @(DataList 'resources' 'items')
$quizzes = @(DataList 'quizzes' 'activities')
$listening = @(DataList 'listening' 'tests')
$premiumProducts = @(DataList 'premium-products' 'products')
# Books and resource collections are two separate catalogues, deliberately.
$publicationBooks = @(DataList 'publications' 'books')
$promoAds = @(DataList 'promotions' 'ads')
$promoPackages = @(DataList 'promotions' 'packages')
# RCF's own offers, kept apart from the third-party ads above because
# they are not paid advertisements and carry no Sponsored label.
$promoOffers = @(DataList 'promotions' 'offers')
# Bank details are read from one file only. Never copy them into a page.
$paymentConfig = $null
if ($script:Data.ContainsKey('payments')) { $paymentConfig = $script:Data['payments'] }
$paymentBank = if ($paymentConfig) { $paymentConfig.bank } else { $null }
$paymentPurposes = @(DataList 'payments' 'purposes')
$literature = @(DataList 'literature' 'texts')
$notices = @(DataList 'notices' 'notices')
$updates = @(DataList 'updates' 'items')

$publishedCourseIds = @()
foreach ($c in $courses) { if ((P $c 'published' $true) -eq $true) { $publishedCourseIds += [string](P $c 'id') } }

# =============================================================== components =

function BrandMarkup($subtitle = $true) {
    $html = '<a class="brand" href="' + (E (Url '')) + '" aria-label="' + (E $script:Config.siteName) + ', home page">'
    $html += '<span class="brand__mark" aria-hidden="true">RCF</span><span class="brand__text">'
    $html += '<span class="brand__name">' + (E $script:Config.siteName) + '</span>'
    if ($subtitle) { $html += '<span class="brand__sub">English learning and teaching</span>' }
    return $html + '</span></a>'
}

function NavItemIsCurrent($item, $slug) {
    $url = [string](P $item 'url' '')
    if ($url -eq 'PUBLICATIONS_WEBSITE_URL') { return $false }
    $target = $url.Trim('/')
    if ($target -eq '') { return ($slug -eq '') }
    return ($slug -eq $target -or $slug.StartsWith("$target/"))
}

function MegaPanel($item, $index, $slug) {
    $groups = AsList (P $item 'groups')
    if ($groups.Count -eq 0) { return '' }
    $panelId = 'mega-' + $index
    $html = '<div class="mega" id="' + $panelId + '" hidden>'
    $summary = P $item 'summary'
    if ($summary) { $html += '<p class="mega__summary">' + (Inline $summary) + '</p>' }
    $html += '<div class="mega__grid">'
    foreach ($group in $groups) {
        $links = @()
        foreach ($link in (AsList (P $group 'links'))) {
            $course = P $link 'course'
            if ($course -and ($publishedCourseIds -notcontains [string]$course)) { continue }
            $links += $link
        }
        if ($links.Count -eq 0) { continue }
        # A menu group label is not a page heading. Using <h3> here put 74
        # phantom headings ahead of the real <h1> in the document outline.
        $html += '<div class="mega__group" role="group" aria-label="' + (E (P $group 'title')) + '"><p class="mega__group-title">' + (E (P $group 'title')) + '</p><ul>'
        foreach ($link in $links) {
            $target = [string](P $link 'url' '')
            $current = ''
            if ($target.Trim('/') -eq $slug) { $current = ' aria-current="page"' }
            $ext = ''
            $soon = ''
            if (IsExternal $target) { $ext = ' target="_blank" rel="noopener" class="ext"' }
            $html += '<li><a href="' + (E (Url $target)) + '"' + $current + $ext + '>' + (E (P $link 'label')) + $soon + '</a></li>'
        }
        $html += '</ul></div>'
    }
    $html += '</div>'
    $html += '<div class="mega__footer"><a class="btn btn--sm btn--outline" href="' + (E (Url (P $item 'url'))) + '">Go to ' + (E (P $item 'label')) + '</a>'
    $html += '<a class="btn btn--sm btn--outline" href="' + (E (Url 'search/')) + '">Search the whole site</a></div>'
    return $html + '</div>'
}

function DesktopNav($slug) {
    $html = '<nav class="main-nav" aria-label="Main"><div class="container"><ul class="main-nav__list">'
    $index = 0
    foreach ($item in $nav.items) {
        $index++
        # Items with headerOnly have their own button in the header bar above,
        # so they are left out of this row. Eleven sections did not fit on one
        # line at ordinary laptop widths; nine fit with room to spare.
        if ((P $item 'headerOnly') -eq $true) { continue }
        $label = [string](P $item 'label')
        $url = [string](P $item 'url' '')
        $groups = AsList (P $item 'groups')
        $current = NavItemIsCurrent $item $slug
        $classAttr = 'main-nav__item'
        if ($current) { $classAttr += ' main-nav__item--current' }
        if ($groups.Count -gt 0) { $classAttr += ' main-nav__item--has-menu' }
        $html += '<li class="' + $classAttr + '">'

        if ($groups.Count -gt 0) {
            $panelId = 'mega-' + $index
            # The label is a link to the section's own page; only the caret beside
            # it opens the dropdown. Clicking the words must never be a dead end.
            $parentCurrent = ''
            if ($url.Trim('/') -eq $slug) { $parentCurrent = ' aria-current="page"' }
            $html += '<a class="main-nav__link" href="' + (E (Url $url)) + '"' + $parentCurrent + '>' + (E $label) + '</a>'
            $html += '<button type="button" class="main-nav__button main-nav__button--caret" aria-expanded="false" aria-controls="' + $panelId + '">'
            $html += '<span class="main-nav__caret" aria-hidden="true"></span>'
            $html += '<span class="visually-hidden">Show ' + (E $label) + ' pages</span></button>'
            $html += MegaPanel $item $index $slug
        }
        else {
            $ext = ''
            $extra = ''
            if (IsExternal $url) {
                $ext = ' target="_blank" rel="noopener"'
                $extra = '<span class="visually-hidden">' + (PubNote) + '</span>'
            }
            elseif (IsPub $url) {
                # The bookshop is not published yet, so this points at the page
                # explaining it, and says so rather than looking like a dead end.
                $extra = '<span class="main-nav__soon">Coming soon</span><span class="visually-hidden">' + (PubNote) + '</span>'
            }
            $currentAttr = ''
            if ($current) { $currentAttr = ' aria-current="page"' }
            $cls = 'main-nav__link'
            if (IsExternal $url) { $cls += ' ext' }
            $html += '<a class="' + $cls + '" href="' + (E (Url $url)) + '"' + $currentAttr + $ext + '>' + (E $label) + $extra + '</a>'
        }
        $html += '</li>'
    }
    return $html + '</ul></div></nav>'
}

function DrawerNav($slug) {
    $html = '<ul class="drawer-nav">'
    $index = 0
    foreach ($item in $nav.items) {
        $index++
        $label = [string](P $item 'label')
        $url = [string](P $item 'url' '')
        $groups = AsList (P $item 'groups')
        $current = NavItemIsCurrent $item $slug
        $currentAttr = ''
        if ($current) { $currentAttr = ' aria-current="true"' }
        if ($url.Trim('/') -eq $slug) { $currentAttr = ' aria-current="page"' }

        $html += '<li><div class="drawer-nav__row">'
        $ext = ''
        $extra = ''
        $cls = 'drawer-nav__link'
        if (IsExternal $url) {
            $ext = ' target="_blank" rel="noopener"'
            $cls += ' ext'
            $extra = '<span class="visually-hidden">' + (PubNote) + '</span>'
        }
        elseif (IsPub $url) {
            # Same as the header button: a real page to go to, so no badge.
            $extra = '<span class="visually-hidden">' + (PubNote) + '</span>'
        }
        $html += '<a class="' + $cls + '" href="' + (E (Url $url)) + '"' + $currentAttr + $ext + '>' + (E $label) + $extra + '</a>'

        if ($groups.Count -gt 0) {
            $panelId = 'drawer-panel-' + $index
            $expanded = 'false'
            $hidden = ' hidden'
            if ($current) { $expanded = 'true'; $hidden = '' }
            $html += '<button type="button" class="drawer-nav__toggle" aria-expanded="' + $expanded + '" aria-controls="' + $panelId + '">'
            $html += '<span class="icon-chevron" aria-hidden="true"></span><span class="visually-hidden">Show ' + (E $label) + ' pages</span></button>'
            $html += '</div><div class="drawer-nav__panel" id="' + $panelId + '"' + $hidden + '>'
            foreach ($group in $groups) {
                $links = @()
                foreach ($link in (AsList (P $group 'links'))) {
                    $course = P $link 'course'
                    if ($course -and ($publishedCourseIds -notcontains [string]$course)) { continue }
                    $links += $link
                }
                if ($links.Count -eq 0) { continue }
                # Same as the desktop mega panel: a label, not a heading.
                $html += '<div class="drawer-nav__group" role="group" aria-label="' + (E (P $group 'title')) + '"><p class="drawer-nav__group-title">' + (E (P $group 'title')) + '</p><ul>'
                foreach ($link in $links) {
                    $target = [string](P $link 'url' '')
                    $c = ''
                    if ($target.Trim('/') -eq $slug) { $c = ' aria-current="page"' }
                    $e = ''
                    if (IsExternal $target) { $e = ' target="_blank" rel="noopener" class="ext"' }
                    $html += '<li><a href="' + (E (Url $target)) + '"' + $c + $e + '>' + (E (P $link 'label')) + '</a></li>'
                }
                $html += '</ul></div>'
            }
            $html += '</div>'
        }
        else {
            $html += '</div>'
        }
        $html += '</li>'
    }
    return $html + '</ul>'
}

function Header($slug) {
    $wa = 'https://wa.me/' + $script:Config.whatsappInternational
    $html = '<header class="site-header"><div class="container header-bar">'
    $html += BrandMarkup $true
    $html += '<form class="header-search" role="search" action="' + (E (Url 'search/')) + '" method="get">'
    $html += '<label class="visually-hidden" for="header-search-input">Search RCF English</label>'
    $html += '<input type="search" id="header-search-input" name="q" placeholder="Search lessons and papers"></form>'
    $html += '<div class="header-actions">'

    # Nav items marked headerOnly get their own button here instead of a place
    # in the section row below, which does not have room for another item at
    # laptop widths. RCF Publications is handled separately just after, because
    # its address depends on whether the bookshop is published yet.
    foreach ($item in $nav.items) {
        if ((P $item 'headerOnly') -ne $true) { continue }
        $itemUrl = [string](P $item 'url' '')
        # RCF Publications is rendered by the block just below, which knows
        # whether the bookshop has a published address yet. Without this test
        # it was drawn twice: once plainly here and once as the gold button.
        if ((P $item 'label') -eq $script:Config.publicationsName) { continue }
        if (IsPub $itemUrl) { continue }
        $style = [string](P $item 'headerStyle' '')
        $cls = 'header-link'
        if ($style) { $cls += ' header-link--' + $style }
        if (NavItemIsCurrent $item $slug) { $cls += ' is-current' }
        $currentAttr = ''
        if ($itemUrl.Trim('/') -eq $slug) { $currentAttr = ' aria-current="page"' }
        $noteText = [string](P $item 'note' '')
        $noteHtml = ''
        if ($noteText) { $noteHtml = '<span class="header-link__note">' + (E $noteText) + '</span>' }
        $html += '<a class="' + $cls + '" href="' + (E (Url $itemUrl)) + '"' + $currentAttr + '>'
        $html += '<span class="header-link__label">' + (E (P $item 'label')) + '</span>' + $noteHtml + '</a>'
    }

    if (PubIsLive) {
        $html += '<a class="header-link header-link--accent' + (PubExtClass) + '" href="' + (E (Url 'PUBLICATIONS_WEBSITE_URL')) + '"' + (PubExtAttrs) + '>' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a>'
    }
    else {
        # The bookshop has no published address yet, so this goes to the page
        # that explains RCF Publications. It is a real destination, so it is
        # not badged "Coming soon" in the header - the page says where things
        # stand. Put a real https:// address in _src/config.json and this
        # becomes an external link to the bookshop on the next build.
        $html += '<a class="header-link header-link--accent" href="' + (E (Url $script:PubFallback)) + '">' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a>'
    }
    # Global search control. It is a real link to the search page, so it works
    # with JavaScript off; nav.js intercepts the click and opens the inline
    # panel instead when it can. Visible at every width - the label is dropped
    # on the narrowest phones but the button itself never disappears.
    $html += '<a class="search-toggle" href="' + (E (Url 'search/')) + '" aria-expanded="false" aria-controls="mobile-search"><span class="search-toggle__icon" aria-hidden="true">&#128269;</span><span class="search-toggle__text">Search</span></a>'
    $html += '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-drawer"><span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="nav-toggle__text">Menu</span></button>'
    $html += '</div></div>'

    $html += '<div class="container"><form class="nav-drawer__search" id="mobile-search" role="search" action="' + (E (Url 'search/')) + '" method="get" hidden>'
    $html += '<div class="field"><label for="mobile-search-input">Search RCF English</label>'
    $html += '<input type="search" id="mobile-search-input" name="q" placeholder="Lesson, paper, class or topic"></div></form></div>'

    $html += DesktopNav $slug
    $html += '</header>'

    # Mobile drawer
    $html += '<div class="nav-drawer" id="nav-drawer" data-open="false">'
    $html += '<button class="nav-drawer__backdrop" type="button" data-close-drawer tabindex="-1" aria-hidden="true"></button>'
    $html += '<div class="nav-drawer__panel" role="dialog" aria-modal="true" aria-label="Site menu">'
    $html += '<div class="nav-drawer__head">' + (BrandMarkup $false)
    $html += '<button type="button" class="nav-drawer__close" data-close-drawer><span aria-hidden="true">&#10005;</span> Close</button></div>'
    $html += '<div class="nav-drawer__body">'
    $html += '<div class="nav-drawer__search"><form role="search" action="' + (E (Url 'search/')) + '" method="get">'
    $html += '<div class="field"><label for="drawer-search-input">Search RCF English</label>'
    $html += '<input type="search" id="drawer-search-input" name="q" placeholder="Lesson, paper, class or topic"></div></form></div>'
    $html += DrawerNav $slug
    $html += '<div class="nav-drawer__extras">'
    $html += '<a class="btn btn--whatsapp btn--block" href="' + (E $wa) + '" target="_blank" rel="noopener">WhatsApp ' + (E $script:Config.whatsappDisplay) + '</a>'
    $html += '<a class="btn btn--outline btn--block" href="' + (E (Url 'how-to-use/')) + '">How to use this site</a>'
    $html += '</div></div></div></div>'
    return $html
}

function Breadcrumbs($page) {
    $slug = $page._slug
    if ($slug -eq '') { return '' }
    $trail = AsList (P $page 'breadcrumbs')
    $html = '<nav class="breadcrumbs" aria-label="Breadcrumb"><div class="container"><ol>'
    $html += '<li><a href="' + (E (Url '')) + '">Home</a></li>'
    foreach ($crumb in $trail) {
        $html += '<li><a href="' + (E (Url (P $crumb 'url'))) + '">' + (E (P $crumb 'label')) + '</a></li>'
    }
    $html += '<li><span aria-current="page">' + (E (P $page 'title')) + '</span></li>'
    return $html + '</ol></div></nav>'
}

function Footer() {
    $year = (Get-Date).Year
    $html = '<footer class="site-footer"><div class="container">'
    $html += '<h2 class="visually-hidden">Site information</h2><div class="footer-grid">'
    $html += '<div class="footer-brand">' + (BrandMarkup $true)
    $html += '<p>' + (E $script:Config.tagline) + '</p>'
    $html += '<p>English lessons, revision resources, teacher support and online classes, brought together in one place.</p>'
    $html += '<p><a href="https://wa.me/' + (E $script:Config.whatsappInternational) + '" target="_blank" rel="noopener">WhatsApp ' + (E $script:Config.whatsappDisplay) + '</a><br>'
    $html += '<a href="mailto:' + (E $script:Config.email) + '">' + (E $script:Config.email) + '</a></p></div>'

    foreach ($col in $nav.footer) {
        $html += '<div class="footer-col"><h3>' + (E (P $col 'title')) + '</h3><ul>'
        foreach ($link in (AsList (P $col 'links'))) {
            $target = [string](P $link 'url' '')
            $e = ''
            if (IsExternal $target) { $e = ' target="_blank" rel="noopener" class="ext"' }
            $html += '<li><a href="' + (E (Url $target)) + '"' + $e + '>' + (E (P $link 'label')) + '</a></li>'
        }
        $html += '</ul></div>'
    }

    $html += '<div class="footer-col"><h3>Bookshop</h3><ul>'
    if (PubIsLive) {
        $html += '<li><a class="' + ((PubExtClass).Trim()) + '" href="' + (E (Url 'PUBLICATIONS_WEBSITE_URL')) + '"' + (PubExtAttrs) + '>' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a></li>'
    }
    else {
        $html += '<li><a href="' + (E (Url $script:PubFallback)) + '">' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a></li>'
    }
    $html += '<li><a href="' + (E (Url 'about/rcf-publications/')) + '">About RCF Publications</a></li>'
    $html += '<li><a href="' + (E (Url 'teacher-resources/rcf-publications-for-teachers/')) + '">Books for teachers</a></li>'
    $html += '</ul></div></div>'

    $html += '<p class="footer-top"><a href="#top">Back to top</a></p>'
    $html += '<div class="footer-bottom"><p>&copy; ' + $year + ' ' + (E $script:Config.siteName) + '. Materials on this site are for educational use.</p>'
    $sep = if (PubIsExternal) { ' is a separate website.' } elseif (PubIsLive) { ' is a separate section of this website.' } else { ' is a separate section of this website, coming soon.' }
    $html += '<p>' + (E $script:Config.publicationsName) + (E $sep) + '</p></div>'
    return $html + '</div></footer>'
}

# ================================================================== blocks ==

# Listening tests use grade 12 for A/L General English, which has its own page
# rather than a grade page.
function ListeningLabel($g) { if ([int]$g -ge 12) { return 'A/L General English' } return 'Grade ' + $g }
function ListeningHome($g, $anchor) { if ([int]$g -ge 12) { return 'general-english/#al-listening' } return "grades/grade-$g/#$anchor" }

function RenderBlocks($blocks) {
    $html = ''
    foreach ($block in (AsList $blocks)) {
        # A block can depend on the visitor statistics setting, so the privacy
        # policy always describes what the site actually does:
        #   false        only when statistics are off
        #   true         when any statistics service is on
        #   "cookieless" or "google"   only for that kind of service
        $when = P $block 'whenAnalytics'
        if ($null -ne $when) {
            if ($when -is [bool]) { if ($when -ne $script:AnalyticsOn) { continue } }
            elseif ([string]$when -ne $script:AnalyticsKind) { continue }
        }
        $html += (RenderBlock $block)
    }
    return $html.Replace('[[analytics-service]]', $script:AnalyticsName)
}

# Visitor statistics. Nothing is added to any page until an ID is set in
# config.json. Cloudflare and GoatCounter are cookieless; Google Analytics
# sets cookies, and the privacy policy says so when it is chosen.
$script:AnalyticsOn = $false
$script:AnalyticsKind = ''
$script:AnalyticsHtml = ''
$script:AnalyticsName = ''
$analyticsCfg = P $script:Config 'analytics'
if ($analyticsCfg) {
    $aProvider = ([string](P $analyticsCfg 'provider' '')).ToLowerInvariant()
    $aId = ([string](P $analyticsCfg 'id' '')).Trim()
    if ($aId -and $aProvider -eq 'google') {
        if ($aId -notmatch '^G-[A-Z0-9]+$') { throw "config.json analytics.id does not look like a Google Analytics measurement ID (G-...)" }
        $script:AnalyticsHtml = '<script async src="https://www.googletagmanager.com/gtag/js?id=' + $aId + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","' + $aId + '");</script>'
        $script:AnalyticsName = 'Google Analytics'
        $script:AnalyticsKind = 'google'
    }
    elseif ($aId -and $aProvider -eq 'cloudflare') {
        if ($aId -notmatch '^[A-Za-z0-9]+$') { throw "config.json analytics.id does not look like a Cloudflare Web Analytics token" }
        $script:AnalyticsHtml = '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=''{"token": "' + $aId + '"}''></script>'
        $script:AnalyticsName = 'Cloudflare Web Analytics'
        $script:AnalyticsKind = 'cookieless'
    }
    elseif ($aId -and $aProvider -eq 'goatcounter') {
        if ($aId -notmatch '^[a-z0-9-]+$') { throw "config.json analytics.id does not look like a GoatCounter site code" }
        $script:AnalyticsHtml = '<script data-goatcounter="https://' + $aId + '.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>'
        $script:AnalyticsName = 'GoatCounter'
        $script:AnalyticsKind = 'cookieless'
    }
    elseif ($aId) { throw "config.json analytics.provider must be google, cloudflare or goatcounter" }
    $script:AnalyticsOn = [bool]$script:AnalyticsKind
}

function AnalyticsTag { return $script:AnalyticsHtml }

function SectionOpen($block, $extraClass = '') {
    $variant = [string](P $block 'variant' '')
    $cls = 'section'
    if ($variant -eq 'tint') { $cls += ' section--tint' }
    if ($variant -eq 'navy') { $cls += ' section--navy' }
    if ($extraClass) { $cls += ' ' + $extraClass }
    $id = P $block 'id'
    $idAttr = ''
    if ($id) { $idAttr = ' id="' + (E $id) + '"' }
    return '<section class="' + $cls + '"' + $idAttr + '><div class="container">'
}

function SectionHead($block) {
    $heading = P $block 'heading'
    if (-not $heading) { return '' }
    $level = [string](P $block 'level' 'h2')
    $html = '<div class="section__head">'
    $eyebrow = P $block 'eyebrow'
    if ($eyebrow) { $html += '<span class="section__eyebrow">' + (E $eyebrow) + '</span>' }
    $html += "<$level>" + (Inline $heading) + "</$level>"
    $intro = P $block 'intro'
    if ($intro) { $html += (Paragraphs $intro) }
    return $html + '</div>'
}

function RenderBlock($block) {
    $type = [string](P $block 'type' 'prose')

    switch ($type) {

        'prose' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="prose">'
            $html += Paragraphs (P $block 'text')
            foreach ($part in (AsList (P $block 'parts'))) {
                $h = P $part 'heading'
                if ($h) {
                    $lvl = [string](P $part 'level' 'h3')
                    $partId = P $part 'id'
                    $idA = ''
                    if ($partId) { $idA = ' id="' + (E $partId) + '"' }
                    $html += "<$lvl$idA>" + (Inline $h) + "</$lvl>"
                }
                $html += Paragraphs (P $part 'text')
                $html += Bullets (P $part 'bullets')
                # Question lists under a heading such as "Questions 8-14" or
                # "Questions 7 to 13" are numbered from that first number.
                $qStart = [int](P $part 'start' 0)
                if (-not $qStart -and ([string]$h) -match '^Questions\s+(\d+)') { $qStart = [int]$Matches[1] }
                $html += Bullets (P $part 'numbered') $true $qStart
            }
            $html += Bullets (P $block 'bullets')
            $html += Bullets (P $block 'numbered') $true
            return $html + '</div></div></section>'
        }

        'lead' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<p class="lead">' + (Inline (P $block 'text')) + '</p>'
            return $html + '</div></section>'
        }

        'steps' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $rowClass = 'steps'
            if ((P $block 'layout') -eq 'row') { $rowClass += ' steps--row' }
            $html += '<ol class="' + $rowClass + '">'
            foreach ($item in (AsList (P $block 'items'))) {
                $html += '<li><h3>' + (Inline (P $item 'title')) + '</h3>'
                $html += Paragraphs (P $item 'text')
                $html += Bullets (P $item 'bullets')
                $html += '</li>'
            }
            return $html + '</ol></div></section>'
        }

        'cards' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $cols = [string](P $block 'columns' '3')
            $html += '<div class="grid grid--' + $cols + '">'
            foreach ($item in (AsList (P $block 'items'))) {
                $target = [string](P $item 'url' '')
                $isExt = IsExternal $target
                $cardCls = 'card'
                if ($target) { $cardCls += ' card--link' }
                # No address yet: the card still shows, but it is plainly
                # not a link and carries no "Open" affordance.
                else { $cardCls += ' card--soon' }
                if (P $item 'accent') { $cardCls += ' card--accent' }
                $html += '<div class="' + $cardCls + '">'
                $icon = P $item 'icon'
                if ($icon) { $html += '<span class="card__icon" aria-hidden="true">' + (E $icon) + '</span>' }
                $title = E (P $item 'title')
                if ($target) {
                    $e = ''
                    $note = ''
                    if ($isExt) {
                        $e = ' target="_blank" rel="noopener" class="ext"'
                        $note = '<span class="visually-hidden">' + (PubExtNote) + '</span>'
                    }
                    $html += '<h3><a href="' + (E (Url $target)) + '"' + $e + '>' + $title + $note + '</a></h3>'
                }
                else { $html += '<h3>' + $title + '</h3>' }
                $html += Paragraphs (P $item 'text')
                $html += Bullets (P $item 'bullets')
                if ($isExt -or (IsPub $target)) { $html += '<p class="mb-0">' + (PubBadge) + '</p>' }
                elseif ($target) { $html += '<span class="card__more" aria-hidden="true">' + (E (P $item 'more' 'Open')) + '</span>' }
                $html += '</div>'
            }
            return $html + '</div></div></section>'
        }

        'callout' {
            $variant = [string](P $block 'style' 'note')
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="callout callout--' + $variant + '">'
            $title = P $block 'title'
            if ($title) { $html += '<p class="callout__title">' + (E $title) + '</p>' }
            $html += Paragraphs (P $block 'text')
            $html += Bullets (P $block 'bullets')
            return $html + '</div></div></section>'
        }

        'checklist' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $text = P $block 'text'
            if ($text) { $html += '<div class="prose mb-0">' + (Paragraphs $text) + '</div>' }
            $html += '<ul class="checklist mt-4">'
            foreach ($item in (AsList (P $block 'items'))) { $html += '<li>' + (Inline $item) + '</li>' }
            return $html + '</ul></div></section>'
        }

        'dialogue' {
            # Spoken-English conversations that play out turn by turn. Every
            # line is written into the page as ordinary readable markup, so
            # the whole dialogue is there with JavaScript switched off; the
            # script hides the lines and adds the controls only once it runs.
            $html = (SectionOpen $block) + (SectionHead $block)
            foreach ($item in (AsList (P $block 'items'))) {
                $speakers = @(AsList (P $item 'speakers'))
                $html += '<div class="dlg" data-dialogue>'
                $html += '<div class="dlg__head"><h3 class="dlg__title">' + (E (P $item 'title' 'Conversation')) + '</h3>'
                $setting = [string](P $item 'setting' '')
                if ($setting) { $html += '<p class="dlg__setting">' + (Inline $setting) + '</p>' }
                $html += '</div>'
                $html += '<ol class="dlg__lines" data-dialogue-lines>'
                foreach ($line in (AsList (P $item 'lines'))) {
                    $who = [string](P $line 'speaker' '')
                    $idx = [array]::IndexOf($speakers, $who)
                    if ($idx -lt 0) { $idx = 0 }
                    $side = if ($idx % 2 -eq 0) { 'a' } else { 'b' }
                    $html += '<li class="dlg__line dlg__line--' + $side + '" data-speaker="' + (E $who) + '">'
                    $html += '<span class="dlg__who">' + (E $who) + '</span>'
                    $html += '<span class="dlg__bubble">' + (Inline ([string](P $line 'text' ''))) + '</span>'
                    $note = [string](P $line 'note' '')
                    if ($note) { $html += '<span class="dlg__note">' + (Inline $note) + '</span>' }
                    $html += '</li>'
                }
                $html += '</ol>'
                $takeaway = AsList (P $item 'notes')
                if ($takeaway.Count -gt 0) {
                    $html += '<div class="dlg__takeaway"><h4>What to notice</h4>' + (Bullets $takeaway) + '</div>'
                }
                $html += '</div>'
            }
            return $html + '</div></section>'
        }

        'dodont' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="do-dont"><div class="do-dont__col do-dont__col--do"><h3>' + (E (P $block 'doTitle' 'Do this')) + '</h3>'
            $html += Bullets (P $block 'do')
            $html += '</div><div class="do-dont__col do-dont__col--dont"><h3>' + (E (P $block 'dontTitle' 'Avoid this')) + '</h3>'
            $html += Bullets (P $block 'dont')
            return $html + '</div></div></div></section>'
        }

        'model' {
            $html = (SectionOpen $block) + (SectionHead $block)
            foreach ($item in (AsList (P $block 'items'))) {
                $html += '<div class="model"><div class="model__head">' + (E (P $item 'label' 'Model answer')) + '</div><div class="model__body">'
                $prompt = P $item 'prompt'
                if ($prompt) { $html += '<p><strong>Question:</strong> ' + (Inline $prompt) + '</p>' }
                $html += '<div class="model__sample">' + (Paragraphs (P $item 'sample')) + '</div>'
                $notes = P $item 'notes'
                if ($notes) {
                    $html += '<div class="model__notes"><p><strong>Why this answer works</strong></p>'
                    $html += Bullets $notes
                    $html += '</div>'
                }
                $html += '</div></div>'
            }
            return $html + '</div></section>'
        }

        'terms' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<dl class="term-list">'
            foreach ($item in (AsList (P $block 'items'))) {
                $html += '<div><dt>' + (Inline (P $item 'term')) + '</dt><dd>' + (Inline (P $item 'definition')) + '</dd>'
                $example = P $item 'example'
                if ($example) { $html += '<dd>Example: ' + (Inline $example) + '</dd>' }
                $html += '</div>'
            }
            return $html + '</dl></div></section>'
        }

        'accordion' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $isFaq = (P $block 'faq') -eq $true
            foreach ($item in (AsList (P $block 'items'))) {
                $q = P $item 'q'
                $a = AsList (P $item 'a')
                if ($isFaq -and $null -ne $script:FaqEntries) {
                    [void]$script:FaqEntries.Add(@{ Q = [string]$q; A = ($a -join ' ') })
                }
                $html += '<details class="accordion"><summary>' + (E $q) + '</summary><div class="accordion__body">'
                $html += Paragraphs $a
                $html += Bullets (P $item 'bullets')
                $html += '</div></details>'
            }
            return $html + '</div></section>'
        }

        'table' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $stacked = ''
            if ((P $block 'stacked' $true) -eq $true) { $stacked = ' stacked' }
            $cols = AsList (P $block 'columns')
            # Optional colour coding, one name per row. The colour only repeats
            # what the row already says in words, so a black-and-white print or
            # a screen reader loses nothing by ignoring it.
            $rowStyles = AsList (P $block 'rowStyles')
            $coded = ''
            if ($rowStyles.Count -gt 0) { $coded = ' coded' }
            # The stacked mobile layout sets display:block on the table elements,
            # which strips the table role from the accessibility tree. Explicit
            # ARIA roles keep the headers and cells related for screen readers.
            $html += '<div class="table-wrap"><table role="table" class="data' + $stacked + $coded + '">'
            $caption = P $block 'caption'
            if ($caption) { $html += '<caption>' + (Inline $caption) + '</caption>' }
            $html += '<thead role="rowgroup"><tr role="row">'
            foreach ($c in $cols) { $html += '<th role="columnheader" scope="col">' + (E $c) + '</th>' }
            $html += '</tr></thead><tbody role="rowgroup">'
            $allowed = @('presentation', 'practice', 'production', 'close')
            $ri = 0
            foreach ($row in (AsList (P $block 'rows'))) {
                $rowClass = ''
                if ($ri -lt $rowStyles.Count) {
                    $rs = [string]$rowStyles[$ri]
                    if ($rs) {
                        if ($allowed -notcontains $rs) {
                            [void]$script:Warnings.Add("Table row style '$rs' on '$($script:PageSlug)' is not one of: $($allowed -join ', ')")
                        }
                        $rowClass = ' class="row--' + (E $rs) + '"'
                    }
                }
                $html += '<tr role="row"' + $rowClass + '>'
                $ri++
                $i = 0
                foreach ($cell in (AsList $row)) {
                    $label = ''
                    if ($i -lt $cols.Count) { $label = ' data-label="' + (E $cols[$i]) + '"' }
                    # The stacked mobile layout makes the td a flex container, so any
                    # inline element in the cell became its own flex item and was pushed
                    # into an unwrappable extra column. Wrapping the value keeps the cell
                    # to exactly two items: the ::before label and this span.
                    $html += '<td role="cell"' + $label + '><span class="td__v">' + (Inline $cell) + '</span></td>'
                    $i++
                }
                $html += '</tr>'
            }
            return $html + '</tbody></table></div></div></section>'
        }

        'plan' {
            # A lesson plan as a card rather than a grid: a banner, an at-a-
            # glance panel, then one panel for each stage in that stage's
            # colour. A teacher glancing down a printed page finds the stage
            # they are in by its colour, and reads it in words to be sure.
            $html = (SectionOpen $block) + '<article class="plan">'
            $html += '<header class="plan__banner">'
            $eyebrow = [string](P $block 'eyebrow' '')
            if ($eyebrow) { $html += '<p class="plan__eyebrow">' + (E $eyebrow) + '</p>' }
            $level = [string](P $block 'level' 'h2')
            $html += "<$level class=""plan__title"">" + (Inline (P $block 'heading')) + "</$level></header>"

            $facts = AsList (P $block 'facts')
            if ($facts.Count) {
                $html += '<div class="plan__panel"><h3 class="plan__label">At a glance</h3><dl class="plan__facts">'
                foreach ($f in $facts) {
                    $pair = AsList $f
                    if ($pair.Count -lt 2) { continue }
                    $html += '<div><dt>' + (E $pair[0]) + '</dt><dd>' + (Inline $pair[1]) + '</dd></div>'
                }
                $html += '</dl></div>'
            }

            # "warmer" is the lead-in that opens an international lesson; it
            # shares the quiet grey of "close", which ends it.
            $allowed = @('warmer', 'presentation', 'practice', 'production', 'close')
            foreach ($stage in (AsList (P $block 'stages'))) {
                $style = [string](P $stage 'style' 'close')
                if ($allowed -notcontains $style) {
                    [void]$script:Warnings.Add("Plan stage style '$style' on '$($script:PageSlug)' is not one of: $($allowed -join ', ')")
                }
                $html += '<section class="plan__stage plan__stage--' + (E $style) + '">'
                $html += '<h3 class="plan__stagehead"><span class="plan__stagename">' + (E (P $stage 'name')) + '</span>'
                $time = [string](P $stage 'time' '')
                if ($time) { $html += '<span class="plan__time">' + (E $time) + '</span>' }
                $html += '</h3><div class="plan__stagebody">' + (Paragraphs (P $stage 'text')) + '</div></section>'
            }

            $homework = P $block 'homework'
            if ($homework) { $html += '<p class="plan__homework"><span>Homework</span> ' + (Inline $homework) + '</p>' }
            $caption = P $block 'caption'
            if ($caption) { $html += '<p class="plan__caption">' + (Inline $caption) + '</p>' }
            return $html + '</article></div></section>'
        }

        'quote' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<blockquote class="quote"><p>' + (Inline (P $block 'text')) + '</p>'
            $cite = P $block 'cite'
            if ($cite) { $html += '<cite>' + (E $cite) + '</cite>' }
            return $html + '</blockquote></div></section>'
        }

        'activities' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<noscript><div class="noscript-note"><p class="mb-0">The interactive activities need JavaScript. Please switch it on in your browser, or use the printed practice questions in the lesson pages instead.</p></div></noscript>'
            foreach ($id in (AsList (P $block 'ids'))) {
                $found = $quizzes | Where-Object { [string](P $_ 'id') -eq [string]$id }
                if (-not $found) { [void]$script:Warnings.Add("Activity '$id' is used on '$($script:PageSlug)' but is not in data/quizzes.json") }
                $html += '<div data-activity="' + (E $id) + '"><p class="text-muted">Loading activity&hellip;</p></div>'
            }
            return $html + '</div></section>'
        }

        'payment-instructions' {
            # Bank details live in exactly one place, data/payments.json, and
            # are read from there by every page that needs them. They are
            # never shown on the homepage, and they stay inside a closed
            # panel until the visitor chooses to open it.
            $wantId = [string](P $block 'purpose' 'premium')
            $purpose = $null
            foreach ($p in $paymentPurposes) { if ([string](P $p 'id') -eq $wantId) { $purpose = $p } }
            if ($null -eq $purpose) { return '' }

            $bank = $paymentBank
            $waNum = [string]$paymentConfig.whatsappInternational
            $waShow = [string]$paymentConfig.whatsappDisplay
            $template = [string](P $purpose 'template')
            $waHref = 'https://wa.me/' + $waNum + '?text=' + [uri]::EscapeDataString($template)

            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<details class="paypanel">'
            $html += '<summary class="paypanel__summary"><span class="paypanel__label">Payment Instructions</span>'
            $html += '<span class="paypanel__hint">' + (E ([string](P $purpose 'title'))) + '</span></summary>'
            $html += '<div class="paypanel__body">'

            $html += '<dl class="paybank">'
            $html += '<div class="paybank__row"><dt>Account holder</dt><dd><strong>' + (E ([string]$bank.accountHolder)) + '</strong></dd></div>'
            $html += '<div class="paybank__row"><dt>Bank</dt><dd>' + (E ([string]$bank.bankName)) + '</dd></div>'
            $html += '<div class="paybank__row"><dt>Branch</dt><dd>' + (E ([string]$bank.branch)) + '</dd></div>'
            $html += '<div class="paybank__row"><dt>Account number</dt><dd>' + (E ([string]$bank.accountNumber)) + '</dd></div>'
            $html += '<div class="paybank__row"><dt>Amount</dt><dd>' + (E ([string](P $purpose 'amountLabel'))) + '</dd></div>'
            $html += '<div class="paybank__row"><dt>Reference</dt><dd>' + (E ([string](P $purpose 'referenceLabel'))) + '</dd></div>'
            $html += '</dl>'

            $html += '<div class="callout callout--warn paypanel__notice"><p class="mb-0">' + (E ([string]$paymentConfig.notice)) + '</p></div>'

            $sendWith = AsList (P $purpose 'sendWith')
            if ($sendWith.Count) {
                $html += '<h3 class="paypanel__h">Send these with your receipt</h3><ul class="paylist">'
                foreach ($s in $sendWith) { $html += '<li>' + (E ([string]$s)) + '</li>' }
                $html += '</ul>'
            }
            $note = [string](P $purpose 'note')
            if ($note) { $html += '<p class="paypanel__note">' + (E $note) + '</p>' }

            $html += '<p class="paypanel__go"><a class="btn btn--whatsapp" href="' + (E $waHref) + '" target="_blank" rel="noopener">'
            $html += 'Send payment receipt through WhatsApp<span class="visually-hidden"> on ' + (E $waShow) + '</span></a></p>'
            $html += '<p class="paypanel__small">The button opens WhatsApp on ' + (E $waShow) + ' with the details already written out. Attach your receipt as a picture in the same conversation.</p>'

            $html += '<p class="paypanel__small">This website cannot check a bank transfer by itself, so every payment is confirmed by a person. Never send an online banking password, PIN, one-time code or card number to anyone, including us.</p>'
            $html += '</div></details>'
            return $html + '</div></section>'
        }

        'adslot' {
            # A reserved, clearly labelled advertising space. It carries no
            # advertising code of any kind: it is an empty styled box, and it
            # is deliberately unlike a learning card - dashed, uncoloured, not
            # clickable - so it can never be mistaken for a resource or a
            # navigation button. Sits between major sections, never inside a
            # card grid and never beside a download button.
            $place = [string](P $block 'placement' 'between')
            $html = '<div class="adslot adslot--' + (E $place) + '" role="complementary" aria-label="Advertisement space">'
            $html += '<span class="adslot__label">Advertisement</span>'
            $html += '</div>'
            return $html
        }

        'countdown' {
            # The pre-launch countdown band that sits above the homepage hero.
            # The four numbers are written by assets/js/countdown.js from the
            # visitor's own clock, so the page stays correct without a server
            # and without anything being sent anywhere.
            #
            # Accessibility: the digits change every second, which would make a
            # screen reader talk over itself, so the clock itself is hidden from
            # assistive technology and a quieter live region carries the same
            # information in words, updated once a minute.
            $target = [string](P $block 'target')
            $units = @(
                @{ key = 'days'; label = 'Days' },
                @{ key = 'hours'; label = 'Hours' },
                @{ key = 'minutes'; label = 'Minutes' },
                @{ key = 'seconds'; label = 'Seconds' }
            )
            $html = '<section class="countdown" aria-labelledby="countdown-title">'
            $html += '<div class="container countdown__inner">'

            $eyebrow = P $block 'eyebrow'
            if ($eyebrow) { $html += '<p class="countdown__eyebrow">' + (E $eyebrow) + '</p>' }
            $brand = P $block 'brand'
            if ($brand) { $html += '<p class="countdown__brand">' + (E $brand) + '</p>' }
            $tagline = P $block 'tagline'
            if ($tagline) { $html += '<p class="countdown__tagline" id="countdown-title">' + (Inline $tagline) + '</p>' }

            $html += '<div class="countdown__clock" data-countdown="' + (E $target) + '" aria-hidden="true">'
            foreach ($u in $units) {
                $html += '<div class="cdu">'
                $html += '<span class="cdu__num" data-cd="' + $u.key + '">--</span>'
                $html += '<span class="cdu__label">' + $u.label + '</span>'
                $html += '</div>'
            }
            $html += '</div>'
            $html += '<p class="sr-only" data-cd-status role="status"></p>'

            foreach ($line in (AsList (P $block 'lines'))) {
                $html += '<p class="countdown__line">' + (Inline $line) + '</p>'
            }
            $when = P $block 'launchLabel'
            if ($when) {
                $iso = [string](P $block 'launchDate' '')
                $timeAttr = ''
                if ($iso) { $timeAttr = ' datetime="' + (E $iso) + '"' }
                $html += '<p class="countdown__date"><time' + $timeAttr + '>' + (E $when) + '</time></p>'
            }

            return $html + '</div></section>'
        }

        'game-zone' {
            # Mounts the Primary Game Zone. The build writes an empty, themed
            # container; assets/js/game-zone.js fills it from data/games/*.json.
            # Everything a child sees is drawn from those data files, so new
            # games are added by writing JSON, never by editing a page.
            $mode = [string](P $block 'mode' 'hub')
            $grade = [string](P $block 'grade' '')
            $pack = [string](P $block 'pack' '')
            $theme = [string](P $block 'theme' 'sunshine')
            $gradeAttr = ''
            if ($grade) { $gradeAttr = ' data-grade="' + (E $grade) + '"' }
            if ($pack) { $gradeAttr += ' data-pack="' + (E $pack) + '"' }

            $html = '<section class="gz-page" data-theme="' + (E $theme) + '"><div class="container">'
            $html += '<div data-game-zone="' + (E $mode) + '"' + $gradeAttr + '>'
            $html += '<p class="gz-loading">Loading the games&hellip;</p>'
            $html += '</div>'
            $html += '<noscript><p class="gz-error">These games need JavaScript switched on. '
            $html += 'Everything else on RCF English works without it.</p></noscript>'
            return $html + '</div></section>'
        }

        'destinations' {
            # Two large homepage cards. The whole card is clickable, but the
            # link lives on the title only, so keyboard users get one tab
            # stop per card rather than two.
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<ul class="dcards">'
            foreach ($d in (AsList (P $block 'items'))) {
                $style = [string](P $d 'style' 'premium')
                $hasImg = [bool]([string](P $d 'image'))
                $html += '<li class="dcard dcard--' + (E $style) + $(if ($hasImg) { ' dcard--photo' } else { '' }) + '">'
                # A photograph if one has been supplied for this card,
                # otherwise a short letter mark in the style used elsewhere.
                # The image is decorative beside the title it sits with, so
                # an empty alt keeps it out of the screen-reader's way unless
                # a real description is given in the page file.
                $img = [string](P $d 'image')
                $icon = [string](P $d 'icon')
                if ($img) {
                    $w = [string](P $d 'imageWidth')
                    $h = [string](P $d 'imageHeight')
                    $dim = ''
                    if ($w -and $h) { $dim = ' width="' + (E $w) + '" height="' + (E $h) + '"' }
                    $html += '<span class="dcard__media"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $d 'imageAlt'))) + '"' + $dim + ' loading="lazy" decoding="async"></span>'
                }
                elseif ($icon) { $html += '<span class="dcard__icon" aria-hidden="true">' + (E $icon) + '</span>' }
                $html += '<h3 class="dcard__title"><a href="' + (E (Url ([string](P $d 'url')))) + '">' + (E ([string](P $d 'title'))) + '</a></h3>'
                $html += '<p class="dcard__text">' + (E ([string](P $d 'text'))) + '</p>'
                $html += '<p class="dcard__more" aria-hidden="true">' + (E ([string](P $d 'more' 'Open'))) + ' &rarr;</p>'
                $html += '</li>'
            }
            return $html + '</ul></div></section>'
        }

        'alphabet-writer' {
            # Grade 1 letter formation. The markup is the complete alphabet as
            # a plain list, each letter with a word for it, so the page is
            # useful with JavaScript off and when printed. The script builds the
            # writing board from this list; the stroke shapes live in the script.
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="abc" data-abc><ul class="abc__list">'
            foreach ($it in (AsList (P $block 'letters'))) {
                $L = [string](P $it 'letter')
                $em = [string](P $it 'emoji')
                $wd = [string](P $it 'word')
                $html += '<li class="abc__item" data-letter="' + (E $L) + '" data-name="' + (E ([string](P $it 'name'))) + '" data-word="' + (E $wd) + '" data-emoji="' + (E $em) + '">'
                $html += '<span class="abc__pair">' + (E $L.ToUpper()) + (E $L.ToLower()) + '</span>'
                if ($em) { $html += '<span aria-hidden="true">' + (E $em) + '</span>' }
                $html += '<span class="abc__word">' + (E $wd) + '</span></li>'
            }
            $html += '</ul></div>'
            return $html + '</div></section>'
        }

        'songs' {
            # Songs with the words set out line by line. Each line is written as
            # space-separated tokens of the form  text:note:beats  so the page
            # carries the melody as well as the words. A token ending in "-"
            # joins the next syllable of the same word (the hyphen is dropped);
            # one ending in "=" joins it and keeps a visible hyphen, for things
            # like E-I-E-I-O. The words are readable without the script.
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="songs">'
            $html += '<button type="button" class="songs__sound" data-songs-sound hidden></button>'
            foreach ($s in (AsList (P $block 'items'))) {
                $id = [string](P $s 'id')
                $html += '<article class="song" data-song id="song-' + (E $id) + '" data-tempo="' + (E ([string](P $s 'tempo' '100'))) + '">'
                $html += '<header class="song__head"><span class="song__stage" aria-hidden="true"><span class="song__emoji">' + (E ([string](P $s 'emoji'))) + '</span></span><div>'
                $html += '<h3 class="song__title">' + (E ([string](P $s 'title'))) + '</h3>'
                $meta = @()
                foreach ($k in @('theme', 'tune', 'words')) {
                    $v = [string](P $s $k)
                    if ($v) { $meta += (Inline $v) }
                }
                if ($meta.Count) { $html += '<p class="song__meta">' + ($meta -join ' <span aria-hidden="true">&middot;</span> ') + '</p>' }
                $html += '</div></header><div class="song__verses">'
                foreach ($v in (AsList (P $s 'verses'))) {
                    $html += '<div class="song__verse" data-emoji="' + (E ([string](P $v 'emoji'))) + '">'
                    foreach ($ln in (AsList (P $v 'lines'))) {
                        $tokens = @(([string]$ln).Trim() -split '\s+' | Where-Object { $_ })
                        $html += '<p class="song__line">'
                        for ($i = 0; $i -lt $tokens.Count; $i++) {
                            $parts = $tokens[$i] -split ':'
                            if ($parts.Count -ne 3) {
                                [void]$script:Warnings.Add("Song '$id' on page '$($script:PageSlug)' has a malformed token '$($tokens[$i])' - expected text:note:beats")
                                continue
                            }
                            $txt = $parts[0]
                            $join = $false
                            if ($txt.EndsWith('-')) { $txt = $txt.Substring(0, $txt.Length - 1); $join = $true }
                            elseif ($txt.EndsWith('=')) { $txt = $txt.Substring(0, $txt.Length - 1) + '-'; $join = $true }
                            $html += '<span class="syl" data-n="' + (E $parts[1]) + '" data-b="' + (E $parts[2]) + '">' + (E $txt) + '</span>'
                            if (-not $join -and $i -lt $tokens.Count - 1) { $html += ' ' }
                        }
                        $html += '</p>'
                    }
                    $html += '</div>'
                }
                $html += '</div></article>'
            }
            $html += '</div>'
            return $html + '</div></section>'
        }

        'chart' { return RenderChart $block }

        'banner' {
            # A full-width promotional image. Unlike the advert poster this is
            # the site's own material, so it carries no "Sponsored" label.
            #
            # A banner of this kind usually has its selling points set INTO the
            # artwork, where they cannot be read by a screen reader, searched,
            # translated or selected. The rule here is that the page must still
            # make sense with the image switched off: put the facts in prose
            # blocks around it and let this carry the picture. The alt text
            # describes the image; it is not the place to re-type the offer.
            $img = [string](P $block 'image')
            if (-not $img) { return '' }
            $html = (SectionOpen $block) + (SectionHead $block)
            $wAttr = [string](P $block 'width'); $hAttr = [string](P $block 'height')
            # A standing poster - the shape made for WhatsApp - is capped and
            # centred. At the full width of the page it would be taller than
            # the screen and push the course details out of sight.
            $shape = ''
            if ($wAttr -and $hAttr -and ([int]$hAttr -gt [int]$wAttr)) { $shape = ' banner--portrait' }
            $html += '<figure class="banner' + $shape + '">'
            $dims = ''
            if ($wAttr -and $hAttr) { $dims = ' width="' + (E $wAttr) + '" height="' + (E $hAttr) + '"' }
            $html += '<img class="banner__img" src="' + (E (Url $img)) + '" alt="' + (E ([string](P $block 'alt'))) + '"' + $dims + ' loading="lazy" decoding="async">'
            $cap = [string](P $block 'caption')
            if ($cap) { $html += '<figcaption class="banner__caption">' + (Inline $cap) + '</figcaption>' }
            $html += '</figure>'
            return $html + '</div></section>'
        }

        'print' {
            # A print button. nav.js prints any [data-print] on every page, and
            # .print-page hides itself on paper, along with the site's header,
            # footer and advertisement slots, so what prints is the material.
            $label = [string](P $block 'label' 'Print this page')
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<p class="print-page"><button type="button" class="btn btn--primary" data-print>' + (E $label) + '</button>'
            $note = [string](P $block 'note' '')
            if ($note) { $html += ' <span class="text-small text-muted">' + (Inline $note) + '</span>' }
            return $html + '</p></div></section>'
        }

        'planFinder' {
            # Lesson plans as a grid of small cards, grouped by grade, like the
            # thumbnails in a Drive folder. Each card is a miniature of the plan
            # itself - the navy banner and the four stage colours - over its
            # number, unit, title and focus. The whole list is in the page, so it
            # works and is searchable without JavaScript; plan-finder.js adds the
            # grade choice and the search box on top.
            $groups = AsList (P $block 'groups')
            $many = $groups.Count -gt 1
            $total = 0
            foreach ($g in $groups) { $total += (AsList (P $g 'items')).Count }
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="planfind" data-planfind data-total="' + $total + '">'
            foreach ($g in $groups) {
                $items = AsList (P $g 'items')
                $html += '<div class="planfind__group" data-group="' + (E (P $g 'key')) + '" data-label="' + (E (P $g 'label')) + '">'
                if ($many) {
                    $html += '<h3 class="planfind__grade"><a href="' + (E (Url (P $g 'url'))) + '">' + (E (P $g 'label')) + '</a>'
                    $html += ' <span class="planfind__count">' + $items.Count + ' plans</span></h3>'
                }
                $html += '<ul class="planfind__grid">'
                foreach ($it in $items) {
                    $html += '<li class="pthumb" data-search="' + (E (P $it 'search')) + '">'
                    $html += '<a class="pthumb__link" href="' + (E (Url (P $it 'url'))) + '">'
                    $html += '<span class="pthumb__sheet" aria-hidden="true"><span class="pthumb__band"></span>'
                    $html += '<span class="pthumb__s pthumb__s--p"></span><span class="pthumb__s pthumb__s--pr"></span><span class="pthumb__s pthumb__s--pd"></span><span class="pthumb__s pthumb__s--c"></span></span>'
                    $html += '<span class="pthumb__meta">Plan ' + (E (P $it 'n')) + ' &middot; Unit ' + (E (P $it 'unit')) + '</span>'
                    $html += '<span class="pthumb__title">' + (E (P $it 'title')) + '</span>'
                    $html += '<span class="pthumb__focus">' + (E (P $it 'focus')) + '</span>'
                    $html += '</a></li>'
                }
                $html += '</ul></div>'
            }
            $html += '<p class="planfind__empty" hidden>No plan matches that. Try a shorter word, or choose All grades.</p>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'share' {
            # Plain links to each network's own share page. No buttons from
            # the networks themselves: those load their scripts on every visit,
            # slow the page and follow the reader around the web.
            $slug = ([string]$script:PageSlug).Trim('/')
            $pageUrl = $script:Config.siteUrl.TrimEnd('/') + '/' + $(if ($slug) { $slug + '/' } else { '' })
            $text = [string](P $block 'text' '')
            $tagWords = @(); foreach ($t in (AsList (P $block 'hashtags'))) { $tagWords += ([string]$t).TrimStart('#') }
            $hashLine = ($tagWords | ForEach-Object { '#' + $_ }) -join ' '
            $u = [uri]::EscapeDataString($pageUrl)
            $withTags = $text + $(if ($hashLine) { ' ' + $hashLine } else { '' })
            $links = @(
                @('WhatsApp', 'https://wa.me/?text=' + [uri]::EscapeDataString($withTags + ' ' + $pageUrl)),
                @('Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + $u),
                @('X', 'https://twitter.com/intent/tweet?text=' + [uri]::EscapeDataString($text) + '&url=' + $u + $(if ($tagWords.Count) { '&hashtags=' + [uri]::EscapeDataString($tagWords -join ',') } else { '' })),
                @('LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + $u),
                @('Telegram', 'https://t.me/share/url?url=' + $u + '&text=' + [uri]::EscapeDataString($withTags))
            )
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="share"><ul class="share__links">'
            foreach ($l in $links) {
                $html += '<li><a class="btn btn--sm btn--outline" href="' + (E $l[1]) + '" target="_blank" rel="noopener">' + (E $l[0]) + '<span class="visually-hidden"> (opens in a new tab)</span></a></li>'
            }
            $html += '</ul>'
            if ($hashLine) { $html += '<p class="share__tags"><span>Hashtags</span> ' + (E $hashLine) + '</p>' }
            return $html + '</div></div></section>'
        }

        'pdfReader' {
            # Someone else's article, read on this page but served from its
            # publisher. Nothing is copied: the file stays on their server,
            # credited to them, and they can take it down whenever they like.
            # A phone cannot show a PDF inside a page, so there the reader is
            # swapped for one button that opens the phone's own PDF viewer.
            $src = [string](P $block 'src')
            if (-not $src) { return '' }
            $title = [string](P $block 'title' 'Article')
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="reader">'
            $html += '<div class="reader__bar"><p class="reader__src">' + (Inline (P $block 'credit' '')) + '</p>'
            $html += '<a class="btn btn--sm btn--primary" href="' + (E $src) + '" target="_blank" rel="noopener">Open the article<span class="visually-hidden">: ' + (E $title) + ' (PDF, opens in a new tab)</span></a></div>'
            $html += '<iframe class="reader__frame" src="' + (E ($src + '#view=FitH')) + '" title="' + (E ($title + ' (PDF)')) + '" loading="lazy"></iframe>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'portrait' {
            # A photograph beside a short introduction. Two columns on a
            # desktop, stacked and centred on a phone. The image keeps its
            # natural proportions and is never cropped by CSS.
            $img = [string](P $block 'image')
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="portrait">'
            if ($img) {
                $wAttr = [string](P $block 'width'); $hAttr = [string](P $block 'height')
                $dims = ''
                if ($wAttr -and $hAttr) { $dims = ' width="' + (E $wAttr) + '" height="' + (E $hAttr) + '"' }
                $html += '<figure class="portrait__figure">'
                $html += '<img class="portrait__img" src="' + (E (Url $img)) + '" alt="' + (E ([string](P $block 'alt'))) + '"' + $dims + ' loading="eager" decoding="async">'
                $cap = [string](P $block 'caption')
                if ($cap) { $html += '<figcaption class="portrait__caption">' + (E $cap) + '</figcaption>' }
                $html += '</figure>'
            }
            $html += '<div class="portrait__body">'
            $nm = [string](P $block 'name')
            if ($nm) { $html += '<p class="portrait__name">' + (E $nm) + '</p>' }
            $role = [string](P $block 'role')
            if ($role) { $html += '<p class="portrait__role">' + (E $role) + '</p>' }
            $html += Paragraphs (P $block 'text')
            foreach ($b in (AsList (P $block 'buttons'))) {
                $html += '<p class="portrait__go"><a class="btn btn--sm btn--outline" href="' + (E (Url ([string](P $b 'url')))) + '">' + (E ([string](P $b 'label'))) + '</a></p>'
            }
            $html += '</div></div>'
            return $html + '</div></section>'
        }

        'publications-catalogue' {
            # Complete books and ebooks from data/publications.json. This is
            # a different section from Premium Resources and reads a
            # different file: books here, resource collections there.
            # bookCategory lets one page show several labelled shelves.
            $wantCat = [string](P $block 'bookCategory')
            $wantChan = [string](P $block 'bookChannel')
            $books = @()
            foreach ($b in $publicationBooks) {
                if ((P $b 'published' $true) -ne $true) { continue }
                if ($wantCat -and ([string](P $b 'category')) -ne $wantCat) { continue }
                if ($wantChan -and ([string](P $b 'channel' 'pdf')) -ne $wantChan) { continue }
                $books += $b
            }

            $html = (SectionOpen $block) + (SectionHead $block)
            if ($books.Count -eq 0) {
                $html += '<div class="callout callout--note"><p class="callout__title">Titles are being prepared</p>'
                $html += '<p>The catalogue is being prepared. Titles, sample pages and prices will be published here as each book is ready.</p>'
                $html += '<p class="mb-0">In the meantime, <a href="' + (E (Url 'about/rcf-publications/')) + '">About RCF Publications</a> explains what we publish, and you are welcome to <a href="' + (E (Url 'contact/')) + '">ask us about a particular title</a>.</p></div>'
                return $html + '</div></section>'
            }

            $html += '<ul class="pcards pcards--books">'
            foreach ($b in $books) {
                $html += '<li class="pcard pcard--book">'
                $img = [string](P $b 'image')
                if ($img) {
                    $html += '<div class="pcard__cover"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $b 'imageAlt'))) + '" loading="lazy" decoding="async"></div>'
                }
                else {
                    # No cover supplied yet. A labelled placeholder, never a
                    # substitute image: an unrelated picture would misrepresent
                    # the book.
                    $html += '<div class="pcard__cover pcard__cover--placeholder" role="img" aria-label="Cover image for ' + (E ([string](P $b 'title'))) + ' has not been supplied yet">'
                    $html += '<span class="pcard__coverlabel">Cover to follow</span></div>'
                }
                $html += '<div class="pcard__body">'
                $badge = [string](P $b 'badge')
                if ($badge) { $html += '<p class="pcard__badge">' + (E $badge) + '</p>' }
                $html += '<h3 class="pcard__title">' + (E ([string](P $b 'title'))) + '</h3>'
                $auth = [string](P $b 'author'); if ($auth) { $html += '<p class="pcard__author">by ' + (E $auth) + '</p>' }
                $cat = [string](P $b 'category')
                if ($cat) { $html += '<p class="pcard__tags"><span class="pcard__tag">' + (E $cat) + '</span></p>' }
                $meta = @()
                $aud = [string](P $b 'audience'); if ($aud) { $meta += (E $aud) }
                $fmt = [string](P $b 'format');   if ($fmt) { $meta += (E $fmt) }
                if ($meta.Count) { $html += '<p class="pcard__meta">' + ($meta -join ' &middot; ') + '</p>' }
                $d = [string](P $b 'description'); if ($d) { $html += '<p class="pcard__text">' + (E $d) + '</p>' }
                $cn = [string](P $b 'coverNote')
                if ($cn) { $html += '<p class="pcard__covernote">' + (E $cn) + '</p>' }
                $code = [string](P $b 'code')
                if ($code) { $html += '<p class="pcard__code">Product code: <strong>' + (E $code) + '</strong></p>' }
                # ---- availability and purchase -------------------------------
                # A title is only offered for sale when availability says so.
                # Anything else shows a plain 'in preparation' marker and NO
                # button, so an unfinished book can never look purchasable.
                $avail   = [string](P $b 'availability' 'in-preparation')
                $channel = [string](P $b 'channel' 'pdf')
                $amazon  = [string](P $b 'amazonUrl')
                if ($avail -eq 'available') {
                    if ($channel -eq 'kindle' -or $channel -eq 'paperback') {
                        # Never a local price for a Kindle or paperback edition:
                        # it is sold by the retailer, not by us.
                        if ($amazon -match '^https?://') {
                            $html += '</div><p class="pcard__go"><a class="btn btn--sm btn--accent ext" href="' + (E $amazon) + '" target="_blank" rel="noopener noreferrer">View on Amazon<span class="visually-hidden">, ' + (E ([string](P $b 'title'))) + ', opens in a new tab</span></a></p>'
                        }
                        else {
                            $html += '<p class="pcard__note">Available on Amazon. <strong>The purchase link is still to be supplied</strong>, so no button is shown yet.</p></div>'
                        }
                    }
                    else {
                        $price = [string](P $b 'price')
                        if ($price) { $html += '<p class="pcard__price">' + (E $price) + '</p>' }
                        $html += '<p class="pcard__note">Instant delivery after payment confirmation.</p></div>'
                        $wa = 'https://wa.me/' + [string]($script:Config.whatsappInternational)
                        # A message naming this exact book, its code and its
                        # price, so a buyer never has to explain what they want
                        # and payments can be reconciled to a title.
                        $code2 = [string](P $b 'code')
                        $msg = 'Hello, I would like to purchase the ' + [string](P $b 'title')
                        if ($code2) { $msg += ' (' + $code2 + ')' }
                        if ($price) { $msg += '. ' + $price }
                        $msg += '. Please send me the payment instructions.'
                        $html += '<p class="pcard__go"><a class="btn btn--sm btn--whatsapp" href="' + (E ($wa + '?text=' + [uri]::EscapeDataString($msg))) + '" target="_blank" rel="noopener noreferrer">Buy on WhatsApp ' + (E $script:Config.whatsappDisplay) + '<span class="visually-hidden">, ' + (E ([string](P $b 'title'))) + ', opens in a new tab</span></a></p>'
                    }
                }
                else {
                    $html += '<p class="pcard__note pcard__note--soon">In preparation. Not yet available for purchase.</p></div>'
                }
                $html += '</li>'
            }
            return $html + '</ul></div></section>'
        }

        'premium-products' {
            # Paid resources from data/premium-products.json. Nothing is
            # invented: when the list is empty the section says so plainly
            # instead of showing pretend products.
            # 'category' limits the list to student or teacher resources.
            # Leave it out to show every published resource.
            $wantCat = [string](P $block 'category')
            $items = @()
            foreach ($p in $premiumProducts) {
                if ((P $p 'published' $true) -ne $true) { continue }
                if ($wantCat -and ([string](P $p 'category') -ne $wantCat)) { continue }
                $items += $p
            }

            $html = (SectionOpen $block) + (SectionHead $block)
            if ($items.Count -eq 0) {
                $html += '<div class="callout callout--note"><p class="callout__title">Resources are being prepared</p>'
                $html += '<p>These resource collections are being prepared. Each one will be listed here with a full description and its price as it becomes available.</p>'
                $html += '<p class="mb-0">For current rates, or to ask about a particular resource, please <a href="' + (E (Url 'contact/')) + '">contact us</a>. Everything in the free sections of this website stays free and is unaffected.</p></div>'
                return $html + '</div></section>'
            }

            $html += '<ul class="pcards">'
            foreach ($p in $items) {
                $badge = [string](P $p 'badge')
                $html += '<li class="pcard">'
                $img = [string](P $p 'image')
                if ($img) {
                    $html += '<div class="pcard__cover"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $p 'imageAlt'))) + '" loading="lazy" decoding="async"></div>'
                }
                $html += '<div class="pcard__body">'
                if ($badge) { $html += '<p class="pcard__badge">' + (E $badge) + '</p>' }
                $html += '<h3 class="pcard__title">' + (E ([string](P $p 'title'))) + '</h3>'
                # Grade, skill and type are the things a buyer scans for.
                $tags = @()
                foreach ($f in @('grade','skill','resourceType','purpose')) {
                    $v = [string](P $p $f); if ($v) { $tags += '<span class="pcard__tag">' + (E $v) + '</span>' }
                }
                if ($tags.Count) { $html += '<p class="pcard__tags">' + ($tags -join '') + '</p>' }
                $meta = @()
                $qty = [string](P $p 'quantity'); if ($qty) { $meta += (E $qty) }
                $aud = [string](P $p 'audience'); if ($aud) { $meta += (E $aud) }
                $fmt = [string](P $p 'format');   if ($fmt) { $meta += (E $fmt) }
                if ($meta.Count) { $html += '<p class="pcard__meta">' + ($meta -join ' &middot; ') + '</p>' }
                # The product code is what identifies a purchase in WhatsApp.
                $code = [string](P $p 'code')
                if ($code) { $html += '<p class="pcard__code">Product code: <strong>' + (E $code) + '</strong></p>' }
                $desc = [string](P $p 'description'); if ($desc) { $html += '<p class="pcard__text">' + (E $desc) + '</p>' }
                $src = [string](P $p 'source'); if ($src) { $html += '<p class="pcard__source">Sold by ' + (E $src) + '</p>' }
                if ((P $p 'affiliate') -eq $true) {
                    $html += '<p class="pcard__note">RCF English may earn a commission on this product.</p>'
                }
                $price = [string](P $p 'price'); if ($price) { $html += '<p class="pcard__price">' + (E $price) + '</p>' }
                $html += '</div>'
                $u = [string](P $p 'url')
                if ($u) {
                    $label = [string](P $p 'buttonLabel' 'View details')
                    $html += '<p class="pcard__go"><a class="btn btn--sm btn--accent" href="' + (E (Url $u)) + '">' + (E $label) + '<span class="visually-hidden">, ' + (E ([string](P $p 'title'))) + '</span></a></p>'
                }
                $html += '</li>'
            }
            return $html + '</ul></div></section>'
        }

        'promo-packages' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<ul class="ppacks">'
            foreach ($k in $promoPackages) {
                $html += '<li class="ppack"><h3 class="ppack__name">' + (E ([string](P $k 'name'))) + '</h3>'
                $html += '<p class="ppack__duration">' + (E ([string](P $k 'duration'))) + '</p>'
                $html += '<p class="ppack__price">' + (E ([string](P $k 'price'))) + '</p>'
                $html += '<p class="ppack__summary">' + (E ([string](P $k 'summary'))) + '</p></li>'
            }
            return $html + '</ul></div></section>'
        }

        'offers' {
            # RCF's own offers on its own products, filtered by category.
            # These are not paid advertisements, so no Sponsored label is
            # shown. Same date and status rules as the advertisements, so an
            # offer can be scheduled ahead and expires on its own.
            $wantCat = [string](P $block 'category')
            $today = [datetime]::Today
            $live = @()
            foreach ($o in $promoOffers) {
                if ([string](P $o 'status') -ne 'active') { continue }
                if ($wantCat -and ([string](P $o 'category') -ne $wantCat)) { continue }
                $sd = $null; $ed = $null
                $sdRaw = [string](P $o 'startDate')
                $edRaw = [string](P $o 'expiryDate')
                if ($sdRaw) { try { $sd = [datetime]::ParseExact($sdRaw, 'yyyy-MM-dd', $null) } catch { $sd = $null } }
                if ($edRaw) { try { $ed = [datetime]::ParseExact($edRaw, 'yyyy-MM-dd', $null) } catch { $ed = $null } }
                if ($null -ne $sd -and $today -lt $sd) { continue }
                if ($null -ne $ed -and $today -gt $ed) { continue }
                $live += $o
            }
            $ordered = @($live | Where-Object { (P $_ 'featured') -eq $true }) + @($live | Where-Object { (P $_ 'featured') -ne $true })

            $html = (SectionOpen $block) + (SectionHead $block)
            if ($ordered.Count -eq 0) {
                $t = [string](P $block 'emptyTitle' 'No offers at the moment')
                $x = [string](P $block 'emptyText' 'There is nothing running just now. Any offer will be published here, with its own dates and conditions.')
                $html += '<div class="callout callout--note"><p class="callout__title">' + (E $t) + '</p>'
                $html += '<p' + $(if (P $block 'emptyLinkUrl') { '' } else { ' class="mb-0"' }) + '>' + (E $x) + '</p>'
                $lu = [string](P $block 'emptyLinkUrl')
                if ($lu) {
                    $ll = [string](P $block 'emptyLinkLabel' 'Find out more')
                    $html += '<p class="mb-0"><a class="btn btn--sm btn--outline" href="' + (E (Url $lu)) + '">' + (E $ll) + '</a></p>'
                }
                $html += '</div>'
                return $html + '</div></section>'
            }

            $html += '<ul class="ads" data-offers>'
            foreach ($o in $ordered) {
                $feat = ((P $o 'featured') -eq $true)
                $ed = [string](P $o 'expiryDate')
                $html += '<li class="ad ad--offer' + $(if ($feat) { ' ad--featured' } else { '' }) + '" data-offer-expiry="' + (E $ed) + '">'
                $html += '<div class="ad__body"><p class="ad__labels">'
                $html += '<span class="ad__offer">RCF offer</span>'
                if ($feat) { $html += '<span class="ad__featured">Featured</span>' }
                $html += '</p>'
                $html += '<h3 class="ad__title">' + (E ([string](P $o 'title'))) + '</h3>'
                $d = [string](P $o 'description'); if ($d) { $html += '<p class="ad__text">' + (E $d) + '</p>' }
                $rows = @()
                foreach ($pair in @(@('terms','Conditions'), @('expiryDate','Ends'))) {
                    $v = [string](P $o $pair[0])
                    if ($v) { $rows += '<div class="ad__row"><dt>' + $pair[1] + '</dt><dd>' + (E $v) + '</dd></div>' }
                }
                if ($rows.Count) { $html += '<dl class="ad__facts">' + ($rows -join '') + '</dl>' }
                $html += '</div>'
                $lk = [string](P $o 'url')
                if ($lk) {
                    $ll = [string](P $o 'linkLabel' 'See the offer')
                    $html += '<p class="ad__go"><a class="btn btn--sm btn--accent" href="' + (E (Url $lk)) + '">' + (E $ll) + '<span class="visually-hidden">: ' + (E ([string](P $o 'title'))) + '</span></a></p>'
                }
                $html += '</li>'
            }
            return $html + '</ul></div></section>'
        }

        'promotions' {
            # Advertisements from data/promotions.json. An advertisement is
            # shown only when status is 'active' AND today is inside its
            # start and expiry dates. The expiry date is also written into
            # the page so the visitor's own browser can hide a listing that
            # has run out since the site was last built.
            $today = [datetime]::Today
            $live = @()
            foreach ($a in $promoAds) {
                if ([string](P $a 'status') -ne 'active') { continue }
                $sd = $null; $ed = $null
                $sdRaw = [string](P $a 'startDate')
                $edRaw = [string](P $a 'expiryDate')
                if ($sdRaw) { try { $sd = [datetime]::ParseExact($sdRaw, 'yyyy-MM-dd', $null) } catch { $sd = $null } }
                if ($edRaw) { try { $ed = [datetime]::ParseExact($edRaw, 'yyyy-MM-dd', $null) } catch { $ed = $null } }
                if ($null -ne $sd -and $today -lt $sd) { continue }
                if ($null -ne $ed -and $today -gt $ed) { continue }
                $live += $a
            }
            # Featured first, otherwise the order in the file is kept.
            $ordered = @($live | Where-Object { (P $_ 'featured') -eq $true }) + @($live | Where-Object { (P $_ 'featured') -ne $true })

            $html = (SectionOpen $block) + (SectionHead $block)
            if ($ordered.Count -eq 0) {
                $html += '<div class="callout callout--note"><p class="callout__title">No listings at the moment</p>'
                $html += '<p>There are no advertisements running just now. When teachers and institutes book a listing it will appear here.</p>'
                $html += '<p class="mb-0">If you teach, you are welcome to advertise. The packages and the steps are further down this page.</p></div>'
                return $html + '</div></section>'
            }

            $html += '<ul class="ads" data-ads>'
            foreach ($a in $ordered) {
                $feat = ((P $a 'featured') -eq $true)
                $ed = [string](P $a 'expiryDate')
                $html += '<li class="ad' + $(if ($feat) { ' ad--featured' } else { '' }) + '" data-ad-expiry="' + (E $ed) + '">'
                $img = [string](P $a 'image')
                if ($img) {
                    $html += '<div class="ad__poster"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $a 'imageAlt'))) + '" loading="lazy" decoding="async"></div>'
                }
                $html += '<div class="ad__body"><p class="ad__labels">'
                $html += '<span class="ad__sponsored">Sponsored<span class="visually-hidden"> listing, this is a paid advertisement</span></span>'
                if ($feat) { $html += '<span class="ad__featured">Featured</span>' }
                $html += '</p>'
                $html += '<h3 class="ad__title">' + (E ([string](P $a 'courseTitle'))) + '</h3>'
                $html += '<p class="ad__by">' + (E ([string](P $a 'advertiser'))) + '</p>'
                $rows = @()
                foreach ($pair in @(@('audience','For'), @('mode','Class'), @('location','Where'), @('schedule','When'))) {
                    $v = [string](P $a $pair[0])
                    if ($v) { $rows += '<div class="ad__row"><dt>' + $pair[1] + '</dt><dd>' + (E $v) + '</dd></div>' }
                }
                if ($rows.Count) { $html += '<dl class="ad__facts">' + ($rows -join '') + '</dl>' }
                $d = [string](P $a 'description'); if ($d) { $html += '<p class="ad__text">' + (E $d) + '</p>' }
                $html += '</div><p class="ad__go">'
                $wa = [string](P $a 'whatsapp')
                if ($wa) { $html += '<a class="btn btn--sm btn--accent" href="https://wa.me/' + (E $wa) + '" rel="noopener">WhatsApp<span class="visually-hidden"> ' + (E ([string](P $a 'advertiser'))) + '</span></a>' }
                $ph = [string](P $a 'phone')
                if ($ph) { $html += '<a class="btn btn--sm btn--outline" href="tel:' + (E ($ph -replace '\s','')) + '">' + (E $ph) + '</a>' }
                $lk = [string](P $a 'link')
                if ($lk) { $html += '<a class="btn btn--sm btn--outline" href="' + (E (Url $lk)) + '" rel="noopener">View details<span class="visually-hidden">, ' + (E ([string](P $a 'courseTitle'))) + '</span></a>' }
                $html += '</p></li>'
            }
            $html += '</ul>'
            $html += '<p class="ads-empty" data-ads-empty hidden>All current listings have now run out. New advertisements will appear here when they are booked.</p>'
            return $html + '</div></section>'
        }

        'grade-resources' {
            # Reads data/resources.json and shows only entries that are published,
            # match this page's filters, and have passed the signed-out access check.
            # Filters are ANDed; any may be omitted. "grade" is kept as the original
            # name for the level filter so the Grades 6-11 pages need no edit.
            $wantLevel   = [string](P $block 'grade')
            $wantSubject = [string](P $block 'subject')
            $wantExam    = [string](P $block 'examination')
            $wantType    = [string](P $block 'resourceType')
            $wantSub     = [string](P $block 'subcategory')
            $found = @()
            foreach ($r in $resources) {
                if ((P $r 'published' $false) -ne $true) { continue }
                if ([string](P $r 'anonymousAccess') -ne 'verified') { continue }
                if ($wantLevel   -and [string](P $r 'level')       -ne $wantLevel)   { continue }
                if ($wantSubject -and [string](P $r 'subject')     -ne $wantSubject) { continue }
                if ($wantExam    -and [string](P $r 'examination') -ne $wantExam)    { continue }
                if ($wantType    -and [string](P $r 'type')        -ne $wantType)    { continue }
                if ($wantSub     -and [string](P $r 'subcategory') -ne $wantSub)     { continue }
                $found += $r
            }
            if ($found.Count -eq 0) { return '' }

            $labels = @{
                'textbook' = "Pupil's Book"; 'teachers-guide' = "Teacher's Guide"
                'study-pack' = 'Study pack'; 'scheme-of-work' = 'Scheme of work'
                'marking-scheme' = 'Marking scheme'; 'model-paper' = 'Model paper'
                'syllabus' = 'Syllabus'; 'resource-book' = 'Resource book'
                'worksheet' = 'Worksheet'; 'lesson-plan' = 'Lesson plan'
                'anthology' = 'Anthology'; 'seminar' = 'Seminar handout'
                'practice-paper' = 'Practice papers'; 'past-paper' = 'Past paper'
            }
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<ul class="gres">'
            foreach ($r in $found) {
                $t = [string](P $r 'type')
                $typeLabel = if ($labels.ContainsKey($t)) { $labels[$t] } else { $t }
                $html += '<li class="gres__item">'
                $html += '<div class="gres__main"><h3 class="gres__title">' + (E ([string](P $r 'title'))) + '</h3>'
                $meta = @()
                if ($typeLabel) { $meta += (E $typeLabel) }
                # The card must name the level and the subject, not just the type,
                # because these lists now appear on subject pages as well as grade pages.
                $lvl = [string](P $r 'level'); if ($lvl) { $meta += (E $lvl) }
                # Year and term are shown only when the data actually carries them.
                $yr = [string](P $r 'year'); $tm = [string](P $r 'term')
                if ($yr -and $tm) { $meta += (E ($tm.Substring(0,1).ToUpper() + $tm.Substring(1) + ' term ' + $yr)) }
                elseif ($yr) { $meta += (E $yr) }
                if ($meta.Count) { $html += '<p class="gres__meta">' + ($meta -join ' &middot; ') + '</p>' }
                $src = [string](P $r 'author')
                if ($src) { $html += '<p class="gres__source">' + (E $src) + '</p>' }
                # Every card states where the material came from and on what terms.
                $rights = [string](P $r 'copyright')
                if ($rights) { $html += '<p class="gres__rights">' + (E $rights) + '</p>' }
                $url = [string](P $r 'url')
                # A handful of official government PDFs are served over plain HTTP
                # because the department publishes no HTTPS endpoint at all. The link
                # is kept because it works and the source is official, but the reader
                # is told plainly that the connection is not encrypted.
                if ($url -match '^http://') {
                    $html += '<p class="gres__warn"><span class="tag tag--http" title="This official government site is served over plain HTTP, not HTTPS. The link still works; the connection to that site is not encrypted.">Official site, no HTTPS</span></p>'
                }
                $html += '</div>'
                if ($url) {
                    # Opens in a new tab so the reader keeps their place on the site.
                    # noopener/noreferrer: never hand the destination a referrer or a
                    # handle back to this window, least of all over plain HTTP.
                    $extraLabel = '<span class="sr-only"> (opens in a new tab)</span>'
                    if ($url -match '^http://') { $extraLabel = '<span class="sr-only"> (opens in a new tab; connection not encrypted)</span>' }
                    $html += '<p class="gres__go"><a class="btn btn--sm btn--outline" href="' + (E (Url $url)) + '" target="_blank" rel="noopener noreferrer">View or download' + $extraLabel + '</a></p>'
                }
                $html += '</li>'
            }
            return $html + '</ul></div></section>'
        }

        'listening' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<noscript><div class="noscript-note"><p class="mb-0">The listening tests need JavaScript, because the passage is read aloud by the browser itself. Please switch JavaScript on, or ask your teacher for the printed transcript.</p></div></noscript>'
            foreach ($id in (AsList (P $block 'ids'))) {
                $found = $listening | Where-Object { [string](P $_ 'id') -eq [string]$id }
                if (-not $found) { [void]$script:Warnings.Add("Listening test '$id' is used on '$($script:PageSlug)' but is not in data/listening.json") }
                $html += '<div data-listening="' + (E $id) + '"><p class="text-muted">Loading listening test&hellip;</p></div>'
            }
            return $html + '</div></section>'
        }

        'browse' {
            $source = [string](P $block 'source' 'resources')
            $fixed = P $block 'fixed'
            $fixedJson = '{}'
            if ($fixed) { $fixedJson = (ConvertTo-Json $fixed -Compress) }
            $filters = (AsList (P $block 'filters')) -join ','
            $html = (SectionOpen $block) + (SectionHead $block)
            $limit = [int](P $block 'limit' 0)
            $html += '<div class="browse" data-source="' + (E $source) + '" data-fixed="' + (E $fixedJson) + '" data-filters="' + (E $filters) + '" data-limit="' + $limit + '">'
            $html += '<div class="toolbar" data-controls><p class="text-muted mb-0">Filters load in a moment&hellip;</p></div>'
            $html += '<div class="results-bar"><p class="results-count" data-count>&nbsp;</p>'
            $html += '<p class="text-small text-muted mb-0">' + (E (P $block 'note' 'Only resources that RCF English is permitted to publish or link to are listed here.')) + '</p></div>'
            $html += '<p class="visually-hidden" role="status" aria-live="polite" data-live></p>'
            $html += StaticList $source $fixed $limit
            $allUrl = [string](P $block 'allUrl')
            if ($allUrl) {
                $allLabel = [string](P $block 'allLabel' 'View all resources')
                $html += '<p class="browse__all" data-all><a class="btn btn--outline" href="' + (E (Url $allUrl)) + '">' + (E $allLabel) + '</a></p>'
            }
            return $html + '</div></div></section>'
        }

        'exam-countdown' {
            # Counts down only to a date the Department of Examinations has
            # announced (data/exams.json). Until then it says so, and lets the
            # student count down to a date of their own, kept on their device.
            $examId = [string](P $block 'exam')
            $exam = @(DataList 'exams' 'exams') | Where-Object { [string](P $_ 'id') -eq $examId } | Select-Object -First 1
            if (-not $exam) { [void]$script:Warnings.Add("exam-countdown on '$($script:PageSlug)' names exam '$examId', which is not in data/exams.json"); return '' }
            $date = [string](P $exam 'date' '')
            $source = [string](P $exam 'source' '')
            if ($date -and -not $source) {
                [void]$script:Warnings.Add("data/exams.json: '$examId' has a date but no source, so the date is not shown")
                $date = ''
            }
            $name = [string](P $exam 'name')
            $html = (SectionOpen $block 'exam-count') + (SectionHead $block)
            $html += '<div class="xcount" data-xcount data-exam="' + (E $examId) + '" data-date="' + (E $date) + '" data-name="' + (E $name) + '">'
            if ($date) {
                $html += '<p class="xcount__lead">The <strong>' + (E $name) + '</strong> begins on <strong data-xcount-date>' + (E $date) + '</strong>.</p>'
                $html += '<p class="xcount__big" data-xcount-out aria-live="polite"></p>'
                $html += '<p class="text-small text-muted">Date from the <a href="' + (E (Url $source)) + '" target="_blank" rel="noopener" class="ext">official announcement</a>. Always confirm with your school or the Department of Examinations.</p>'
            }
            else {
                $html += '<p class="xcount__lead">The date of the next <strong>' + (E $name) + '</strong> has not been announced here yet. It will appear once the Department of Examinations publishes it. Until then, enter the date you have been given and count down to that.</p>'
                $html += '<div class="xcount__own" data-xcount-own hidden><div class="field"><label for="xcount-' + (E $examId) + '">My examination date</label><input type="date" id="xcount-' + (E $examId) + '" data-xcount-input></div></div>'
                $html += '<p class="xcount__big" data-xcount-out aria-live="polite"></p>'
            }
            $html += '</div>'
            return $html + '</div></section>'
        }

        'app' {
            # A mount point for an interactive tool whose script builds the
            # interface: "mount" names the data- attribute the script looks
            # for, and "noscript" says what to do without JavaScript.
            $mount = [string](P $block 'mount')
            if ($mount -notmatch '^[a-z][a-z0-9-]*$') { [void]$script:Warnings.Add("app block on '$($script:PageSlug)' has an invalid mount name"); return '' }
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="app app--' + $mount + '" data-' + $mount + '>'
            $html += '<noscript><div class="noscript-note"><p class="mb-0">' + (Inline (P $block 'noscript' 'This tool needs JavaScript. Please switch it on to use it.')) + '</p></div></noscript>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'site-status' {
            # Counted from the pages the build is making right now, so the
            # numbers are never out of date.
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="table-wrap"><table class="data"><caption>Pages in each section of RCF English, counted when the site was last built.</caption><thead><tr><th scope="col">Section</th><th scope="col">Pages</th></tr></thead><tbody>'
            $total = 0
            foreach ($item in (AsList (P $nav 'items'))) {
                $u = ([string](P $item 'url' '')).Trim('/')
                if (-not $u) { continue }
                $n = @($pages | Where-Object { $_._slug -eq $u -or $_._slug.StartsWith($u + '/') }).Count
                if ($n -eq 0) { continue }
                $total += $n
                $html += '<tr><th scope="row"><a href="' + (E (Url ($u + '/'))) + '">' + (E (P $item 'label')) + '</a></th><td>' + $n + '</td></tr>'
            }
            $html += '</tbody><tfoot><tr><th scope="row">All pages on the site</th><td>' + @($pages).Count + '</td></tr></tfoot></table></div>'
            $counts = @(
                @('Listening tests', @($listening).Count),
                @('Interactive activities', @(DataList 'quizzes' 'activities').Count),
                @('Past, model and term-test papers', @($papers | Where-Object { (P $_ 'published' $true) -ne $false }).Count),
                @('Question of the Week questions', @(DataList 'question-of-the-week' 'questions').Count)
            )
            $html += '<ul class="status-counts">'
            foreach ($c in $counts) { $html += '<li><span class="status-counts__n">' + $c[1] + '</span> ' + (E $c[0]) + '</li>' }
            $html += '</ul>'
            $html += '<p class="text-small text-muted">Last built on ' + (Get-Date).ToString('d MMMM yyyy', [Globalization.CultureInfo]::InvariantCulture) + '.</p>'
            return $html + '</div></section>'
        }

        'exam-timer' {
            $html = (SectionOpen $block 'exam-timer') + (SectionHead $block)
            $html += '<div class="xtimer" data-xtimer><noscript><p>The timer needs JavaScript. A watch or a phone alarm set to the time printed on the paper works just as well.</p></noscript></div>'
            return $html + '</div></section>'
        }

        'study-timetable' {
            $subjects = AsList (P $block 'subjects')
            $html = (SectionOpen $block 'study-timetable') + (SectionHead $block)
            $html += '<div class="xplan" data-xplan data-subjects="' + (E (($subjects | ForEach-Object { [string]$_ }) -join '|')) + '"><noscript><p>The timetable maker needs JavaScript. On paper: list your subjects, give the weakest two an extra session each week, and never study one subject for more than two sessions in a row.</p></noscript></div>'
            return $html + '</div></section>'
        }

        'question-week' {
            # Every question for this level is written into the page. Without
            # JavaScript the newest one that has started is shown; the script
            # picks the current week on the visitor's own date.
            $level = [string](P $block 'level')
            $today = (Get-Date).ToString('yyyy-MM-dd')
            $all = @(DataList 'question-of-the-week' 'questions' | Where-Object { [string](P $_ 'level') -eq $level } | Sort-Object { [string](P $_ 'week') } -Descending)
            if ($all.Count -eq 0) { return '' }
            $current = @($all | Where-Object { [string](P $_ 'week') -le $today }) | Select-Object -First 1
            if (-not $current) { $current = $all[-1] }
            $html = (SectionOpen $block 'qweek') + (SectionHead $block)
            $html += '<div class="qweek" data-qweek>'
            $i = 0
            foreach ($q in $all) {
                $week = [string](P $q 'week')
                $isCurrent = [object]::ReferenceEquals($q, $current)
                $weekLabel = $week
                $wd = [datetime]::MinValue
                if ([datetime]::TryParse($week, [ref]$wd)) { $weekLabel = $wd.ToString('d MMMM yyyy', [Globalization.CultureInfo]::InvariantCulture) }
                $html += '<article class="qweek__item" data-week="' + (E $week) + '"' + $(if (-not $isCurrent) { ' hidden' } else { '' }) + ' aria-labelledby="qw-' + $level + '-' + $i + '">'
                $html += '<div class="tag-row"><span class="tag tag--level">' + (E (P $q 'subject')) + '</span><span class="tag">' + (E (P $q 'skill')) + '</span><span class="tag tag--year">Week of ' + (E $weekLabel) + '</span></div>'
                $html += '<h3 class="qweek__title" id="qw-' + $level + '-' + $i + '">' + (E (P $q 'title')) + '</h3>'
                $passage = AsList (P $q 'passage')
                if ($passage.Count) {
                    $html += '<div class="qweek__passage">'
                    foreach ($line in $passage) { if ([string]$line) { $html += '<p>' + (Inline $line) + '</p>' } else { $html += '<p class="qweek__gap" aria-hidden="true"></p>' } }
                    $html += '</div>'
                }
                $html += '<div class="qweek__question">' + (Paragraphs (P $q 'question')) + '</div>'
                $html += '<details class="qweek__reveal"><summary>Show the model answer</summary><div class="qweek__answer">' + (Paragraphs (P $q 'answer')) + '</div></details>'
                $html += '<details class="qweek__reveal"><summary>How it would be marked</summary><div class="qweek__notes">' + (Paragraphs (P $q 'notes')) + '<p class="text-small text-muted">Marking notes written by RCF English to explain what earns credit. They are not an official marking scheme.</p></div></details>'
                $html += '</article>'
                $i++
            }
            if ($all.Count -gt 1) {
                $html += '<div class="qweek__archive" data-qweek-archive hidden><h3 class="qweek__archive-title">Earlier questions</h3><ul data-qweek-list></ul></div>'
            }
            $html += '<p class="text-small text-muted">Try the question before opening the answer. Every question, passage and poem here was written by RCF English.</p>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'flashcards' {
            # A printable flashcard maker. The sets are written into the page
            # as plain tables, so without JavaScript a teacher can still copy
            # the words; the script turns them into cards ready to cut out.
            # Sets come from the block itself and, when asked, from the
            # vocabulary lists of the listening tests.
            $sets = New-Object System.Collections.ArrayList
            foreach ($s in (AsList (P $block 'sets'))) {
                $pairs = @()
                foreach ($it in (AsList (P $s 'items'))) {
                    $parts = ([string]$it).Split('=', 2)
                    $pairs += , @($parts[0].Trim(), $(if ($parts.Count -gt 1) { $parts[1].Trim() } else { '' }))
                }
                [void]$sets.Add(@{ id = [string](P $s 'id'); group = [string](P $s 'group' 'Ready-made sets'); label = [string](P $s 'label'); pairs = $pairs })
            }
            if ([bool](P $block 'listeningSets' $false)) {
                foreach ($t in @($listening | Sort-Object { [int](P $_ 'grade' 0) }, { [string](P $_ 'id') })) {
                    $v = AsList (P $t 'vocabulary')
                    if ($v.Count -eq 0) { continue }
                    $pairs = @()
                    foreach ($w in $v) { $pairs += , @([string](P $w 'word'), [string](P $w 'meaning')) }
                    [void]$sets.Add(@{ id = [string](P $t 'id'); group = 'Listening Laboratory words'; label = (ListeningLabel (P $t 'grade')) + ': ' + [string](P $t 'title'); pairs = $pairs })
                }
            }

            $html = (SectionOpen $block 'flashcards') + (SectionHead $block)
            $html += '<div class="flash" data-flash>'
            $html += '<div class="flash__app" data-flash-app hidden></div>'
            $html += '<div class="flash__sets" data-flash-sets>'
            foreach ($s in $sets) {
                $html += '<details class="flash__set" data-set="' + (E $s.id) + '" data-group="' + (E $s.group) + '" data-label="' + (E $s.label) + '">'
                $html += '<summary>' + (E $s.label) + ' <span class="text-muted">(' + $s.pairs.Count + ' cards)</span></summary>'
                $html += '<table class="flash__table"><tbody>'
                foreach ($p in $s.pairs) { $html += '<tr><th scope="row">' + (E $p[0]) + '</th><td>' + (E $p[1]) + '</td></tr>' }
                $html += '</tbody></table></details>'
            }
            $html += '</div></div>'
            return $html + '</div></section>'
        }

        'pathways' {
            # "Start here": a few big, plain routes for visitors who would
            # rather not open a large menu, especially on a phone. Each route
            # is a <details> so a phone shows four tiles and opens only the one
            # tapped; on a wide screen nav.js opens them all.
            $html = (SectionOpen $block 'pathways') + (SectionHead $block)
            $html += '<ul class="pathways__grid">'
            foreach ($r in (AsList (P $block 'items'))) {
                $style = [string](P $r 'style' '')
                $html += '<li><details class="pathway' + $(if ($style) { ' pathway--' + (E $style) } else { '' }) + '" data-pathway>'
                $html += '<summary class="pathway__summary">'
                if (P $r 'icon') { $html += '<span class="pathway__icon" aria-hidden="true">' + (E (P $r 'icon')) + '</span>' }
                $html += '<span class="pathway__text"><span class="pathway__title">' + (E (P $r 'title')) + '</span>'
                if (P $r 'sub') { $html += '<span class="pathway__sub">' + (E (P $r 'sub')) + '</span>' }
                $html += '</span><span class="pathway__chev" aria-hidden="true"></span></summary>'
                $html += '<div class="pathway__body"><ul class="pathway__links">'
                foreach ($l in (AsList (P $r 'links'))) {
                    $html += '<li><a href="' + (E (Url (P $l 'url'))) + '">' + (E (P $l 'label')) + '</a>'
                    if (P $l 'note') { $html += '<span class="pathway__note">' + (E (P $l 'note')) + '</span>' }
                    $html += '</li>'
                }
                $html += '</ul>'
                if (P $r 'url') { $html += '<a class="btn btn--sm btn--accent pathway__main" href="' + (E (Url (P $r 'url'))) + '">' + (E (P $r 'more' 'Start here')) + '</a>' }
                $html += '</div></details></li>'
            }
            $html += '</ul>'
            return $html + '</div></section>'
        }

        'listening-lab' {
            # Every listening test in one place, chosen by grade or level and
            # opened on this page. Without JavaScript each card links to the
            # grade page, where the same test lives.
            $tests = @($listening | Sort-Object { [int](P $_ 'grade' 0) }, { if ([string](P $_ 'source') -eq 'textbook') { 1 } else { 0 } }, { [string](P $_ 'id') })
            $html = (SectionOpen $block 'listening-lab') + (SectionHead $block)
            $html += '<div class="lab" data-listening-lab>'
            $html += '<div class="lab__filters" data-lab-filters hidden>'
            $html += '<div class="lab__chips" role="group" aria-label="Show tests for"><button type="button" class="lab__chip is-on" aria-pressed="true" data-lab-grade="">All grades</button>'
            foreach ($g in @($tests | ForEach-Object { [int](P $_ 'grade' 0) } | Sort-Object -Unique)) {
                $html += '<button type="button" class="lab__chip" aria-pressed="false" data-lab-grade="' + $g + '">' + (E (ListeningLabel $g)) + '</button>'
            }
            $html += '</div>'
            $html += '<p class="lab__count" role="status" aria-live="polite" data-lab-count></p></div>'
            # Two groups, as on the grade pages: the Pupil's Book activities first,
            # then the extra tests written by RCF English.
            $groups = @(
                @{ key = 'textbook'; heading = "Pupil's Book Listening Tests"; note = 'The listening activities from the Grade 6 to 11 Pupil&#39;s Books and Workbooks. Each test names the unit and activity in the book.'; anchor = 'textbook-listening' },
                @{ key = 'rcf'; heading = 'Extra Listening Tests'; note = 'More listening practice beyond the textbook, written by RCF English, each with words to learn before you listen, including tests for A/L General English.'; anchor = 'listening' }
            )
            $html += '<div class="lab__groups" data-lab-groups>'
            foreach ($grp in $groups) {
            $inGroup = @($tests | Where-Object { $(if ([string](P $_ 'source') -eq 'textbook') { 'textbook' } else { 'rcf' }) -eq $grp.key })
            if ($inGroup.Count -eq 0) { continue }
            $html += '<section class="lab__group" data-lab-group="' + $grp.key + '" aria-labelledby="lab-group-' + $grp.key + '">'
            $html += '<h3 class="lab__group-title" id="lab-group-' + $grp.key + '">' + (E $grp.heading) + ' <span class="lab__group-count" data-lab-group-count>' + $inGroup.Count + '</span></h3>'
            $html += '<p class="lab__group-note">' + $grp.note + '</p>'
            $html += '<ul class="lab__list">'
            foreach ($t in $inGroup) {
                $g = [int](P $t 'grade' 0)
                $lv = $(if ($g -le 7) { @(1, 'Level 1 &middot; Foundation') } elseif ($g -le 9) { @(2, 'Level 2 &middot; Intermediate') } else { @(3, 'Level 3 &middot; Advanced') })
                $id = [string](P $t 'id')
                $speakers = @((AsList (P $t 'script')) | ForEach-Object { [string](P $_ 'speaker') } | Where-Object { $_ -ne 'Narrator' } | Sort-Object -Unique).Count
                $qs = (AsList (P $t 'questions')).Count
                $words = (AsList (P $t 'vocabulary')).Count
                $src = $(if ([string](P $t 'source') -eq 'textbook') { 'textbook' } else { 'rcf' })
                $html += '<li class="lab__card" data-lab-card data-grade="' + $g + '" data-source="' + $src + '">'
                $html += '<div class="tag-row"><span class="tag tag--level">' + (E (ListeningLabel $g)) + '</span><span class="tag listening__level listening__level--' + $lv[0] + '">' + $lv[1] + '</span></div>'
                $html += '<h4 class="lab__title">' + (E (P $t 'title')) + '</h4>'
                $meta = @("$qs questions")
                if ($speakers) { $meta += $(if ($speakers -eq 1) { '1 speaker' } else { "$speakers speakers" }) }
                if ($words) { $meta += "$words words to learn first" }
                $html += '<p class="lab__meta">' + ($meta -join ' &middot; ') + '</p>'
                $html += '<a class="btn btn--sm btn--accent" data-lab-open="' + (E $id) + '" href="' + (E (Url (ListeningHome $g $grp.anchor))) + '">Take this test<span class="visually-hidden">: ' + (E (P $t 'title')) + '</span></a>'
                $html += '</li>'
            }
            $html += '</ul>'
            $html += '</section>'
            }
            $html += '</div>'
            $html += '<div class="lab__stage" id="lab-test" tabindex="-1" data-lab-stage hidden>'
            $html += '<p class="lab__back"><button type="button" class="btn btn--sm btn--outline" data-lab-close>&larr; Back to all tests</button></p>'
            $html += '<div data-lab-slot></div></div>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'grade-dashboard' {
            # Everything a grade has, counted, at the top of the grade page. The
            # counts come from the same records as the resource finder, so the
            # number on a tile is exactly the number the tile's link shows. A
            # tile with nothing behind it is left out rather than shown as a
            # dead end, and no count is ever estimated.
            $g = [int](P $block 'grade' 0)
            if ($g -lt 1) { return '' }
            $mine = @(FinderRecords | Where-Object { @($_.grades) -contains $g })
            $count = { param($pred) @($mine | Where-Object $pred).Count }

            # Things that live on this page rather than in the catalogue.
            $grammar = 0
            $grammarId = ''
            $listeningBook = 0
            $listeningExtra = 0
            $bookId = ''
            $extraId = ''
            foreach ($b in (AsList $script:PageBlocks)) {
                $bt = [string](P $b 'type')
                if ($bt -eq 'activities') { $grammar += (AsList (P $b 'ids')).Count; if (-not $grammarId) { $grammarId = [string](P $b 'id') } }
                if ($bt -eq 'listening') {
                    $ids = @(); foreach ($x in (AsList (P $b 'ids'))) { $ids += [string]$x }
                    $inBlock = @($listening | Where-Object { $ids -contains [string](P $_ 'id') })
                    if (@($inBlock | Where-Object { [string](P $_ 'source') -eq 'textbook' }).Count) { $listeningBook += $inBlock.Count; if (-not $bookId) { $bookId = [string](P $b 'id') } }
                    else { $listeningExtra += $inBlock.Count; if (-not $extraId) { $extraId = [string](P $b 'id') } }
                }
            }

            $finder = "resources/?grade=$g"
            $tiles = @(
                @{ label = 'Textbooks'; n = (& $count { $_.group -eq 'textbooks' }); href = "$finder&type=textbooks" },
                @{ label = "Teacher's guides and plans"; n = (& $count { $_.group -eq 'guides' }); href = "$finder&type=guides" },
                @{ label = 'First term'; n = (& $count { $_.term -eq 'first' }); href = "$finder&term=first" },
                @{ label = 'Second term'; n = (& $count { $_.term -eq 'second' }); href = "$finder&term=second" },
                @{ label = 'Third term'; n = (& $count { $_.term -eq 'third' }); href = "$finder&term=third" },
                @{ label = 'Past and model papers'; n = (& $count { $_.group -eq 'papers' }); href = "$finder&type=papers" },
                @{ label = 'Marking schemes and answers'; n = (& $count { $_.group -eq 'answers' }); href = "$finder&type=answers" },
                @{ label = 'Study packs'; n = (& $count { $_.group -eq 'study-packs' }); href = "$finder&type=study-packs" },
                @{ label = 'Practice activities'; n = $grammar; href = $(if ($grammarId) { "#$grammarId" } else { '' }); unit = 'activity' },
                @{ label = "Pupil's Book listening tests"; n = $listeningBook; href = $(if ($bookId) { "#$bookId" } else { '' }); unit = 'test' },
                @{ label = 'Extra listening tests'; n = $listeningExtra; href = $(if ($extraId) { "#$extraId" } else { '' }); unit = 'test' },
                @{ label = 'RCF Publications'; n = (& $count { $_.access -eq 'premium' }); href = "$finder&access=premium"; unit = 'book' }
            )

            $html = (SectionOpen $block 'grade-dash') + '<div class="grade-dash__head">'
            $html += '<div><span class="section__eyebrow">Grade ' + $g + ' at a glance</span>'
            $html += '<h2 class="grade-dash__total"><span class="grade-dash__num">' + $mine.Count + '</span> resources available</h2></div>'
            if ($mine.Count) { $html += '<a class="btn btn--accent" href="' + (E (Url $finder)) + '">See them all in the resource finder</a>' }
            $html += '</div><ul class="grade-dash__tiles">'
            foreach ($t in $tiles) {
                if ($t.n -lt 1 -or -not $t.href) { continue }
                $unit = 'resource'
                if ($t.unit) { $unit = $t.unit }
                $plural = $unit + 's'
                if ($unit -eq 'activity') { $plural = 'activities' }
                $noun = $(if ($t.n -eq 1) { $unit } else { $plural })
                $href = $t.href
                if ($href -notmatch '^#') { $href = Url $href }
                $html += '<li><a class="grade-dash__tile" href="' + (E $href) + '"><span class="grade-dash__n">' + $t.n + '</span><span class="grade-dash__label">' + (E $t.label) + '</span><span class="visually-hidden">: ' + $t.n + ' ' + $noun + '</span></a></li>'
            }
            $html += '</ul>'
            return $html + '</div></section>'
        }

        'finder' {
            return (RenderFinder $block)
        }

        'paperLibrary' {
            return (RenderPaperLibrary $block)
        }

        'classes' {
            return (RenderClasses $block)
        }

        'updates' {
            return (RenderUpdates $block)
        }

        'timetable' {
            return (RenderTimetable $block)
        }

        'notices' {
            return (RenderNotices $block)
        }

        'whatsapp' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="whatsapp-panel"><h3>' + (E (P $block 'title' 'Ask on WhatsApp')) + '</h3>'
            $html += Paragraphs (P $block 'text')
            $html += '<p class="whatsapp-number">' + (E ([string](P $block 'whatsappDisplay' $script:Config.whatsappDisplay))) + '</p>'
            $html += '<div class="btn-row">'
            foreach ($b in (AsList (P $block 'buttons'))) {
                $msg = [string](P $b 'message')
                # A course page may name the teacher who takes that course, so
                # enquiries reach them rather than the office.
                $waNumber = [string](P $block 'whatsappInternational' $script:Config.whatsappInternational)
                $href = 'https://wa.me/' + $waNumber + '?text=' + [uri]::EscapeDataString($msg)
                $html += '<a class="btn btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">' + (E (P $b 'label')) + '</a>'
            }
            $html += '</div><p class="text-small text-muted mt-4">WhatsApp opens with the message already written. Read it and press send yourself. Nothing is sent from this website.</p>'
            return $html + '</div></div></section>'
        }

        'publications' {
            $onFallbackPage = ($script:PageSlug -eq $script:PubFallback.Trim('/'))
            $html = (SectionOpen $block) + '<div class="promo"><div>'
            if (PubIsLive) { $html += '<span class="section__eyebrow">' + $(if (PubIsExternal) { 'Separate bookshop website' } else { 'Books and ebooks' }) + '</span>' }
            else { $html += '<span class="section__eyebrow">Separate bookshop website &mdash; coming soon</span>' }
            $html += '<h2>' + (E (P $block 'heading' 'RCF Publications')) + '</h2>'
            $html += Paragraphs (P $block 'text')
            $html += '<div class="btn-row">'
            if (PubIsLive) {
                $html += '<a class="btn btn--accent' + (PubExtClass) + '" href="' + (E (Url 'PUBLICATIONS_WEBSITE_URL')) + '"' + (PubExtAttrs) + '>Visit ' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubExtNote) + '</span></a>'
                if (-not $onFallbackPage) {
                    $html += '<a class="btn btn--ghost-light" href="' + (E (Url $script:PubFallback)) + '">What ' + (E $script:Config.publicationsName) + ' produces</a>'
                }
            }
            else {
                # No address yet, so no link. A plain marker instead of a button
                # that would lead nowhere.
                $html += '<span class="btn btn--soon" aria-disabled="true">' + (E $script:Config.publicationsName) + ' &mdash; coming soon</span>'
                if (-not $onFallbackPage) {
                    $html += '<a class="btn btn--ghost-light" href="' + (E (Url $script:PubFallback)) + '">What ' + (E $script:Config.publicationsName) + ' will offer</a>'
                }
            }
            $html += '</div></div>'
            $html += '<div class="promo__aside"><h3>You will find</h3><ul>'
            foreach ($i in (AsList (P $block 'items'))) { $html += '<li>' + (E $i) + '</li>' }
            $html += '</ul><p class="text-small mb-0">'
            if (PubIsExternal) {
                $html += (E $script:Config.publicationsName) + ' is a separate website with its own ordering arrangements. This link opens it in a new tab.'
            }
            elseif (PubIsLive) {
                $html += (E $script:Config.publicationsName) + ' is a separate section of this website, with its own ordering arrangements.'
            }
            else {
                $html += (E $script:Config.publicationsName) + ' will be a separate website with its own ordering arrangements. It has not been published yet, so there is nothing to link to at the moment.'
            }
            $html += '</p></div>'
            return $html + '</div></div></section>'
        }

        'publicationsStatus' {
            # Shown only while the bookshop has no published address. Once a
            # real URL is put in _src/config.json, this block writes nothing
            # at all and every bookshop link becomes a normal external link.
            if (PubIsLive) { return '' }
            $html = (SectionOpen $block)
            $html += '<div class="callout callout--warn">'
            $html += '<p class="callout__title">' + (E $script:Config.publicationsName) + ' is not open yet</p>'
            $html += '<p>The bookshop has its own separate website, and that website has not been published. '
            $html += 'Until it is, there is nothing to link to, so this site says <strong>Coming soon</strong> '
            $html += 'wherever the bookshop would otherwise appear rather than offering a link that leads nowhere.</p>'
            $html += '<p class="mb-0">Everything on RCF English is free to read and is unaffected. '
            $html += 'To ask about books in the meantime, please <a href="' + (E (Url 'contact/')) + '">get in touch</a>.</p>'
            $html += '</div>'
            return $html + '</div></section>'
        }

        'relatedBooks' {
            $html = (SectionOpen $block)
            $html += '<div class="related-books"><h3>' + (E (P $block 'heading' 'Find related books')) + '</h3>'
            $html += Paragraphs (P $block 'text')
            # An optional list of book ids from data/publications.json. Named
            # titles are shown as compact cards so a reader sees WHICH book is
            # meant. Covers and availability come from that one file, so a
            # cover added there appears on every page that names the book.
            $picked = @()
            foreach ($id in (AsList (P $block 'books'))) {
                    foreach ($b in $publicationBooks) {
                        if (([string](P $b 'id')) -eq ([string]$id) -and (P $b 'published' $true) -eq $true) { $picked += $b }
                    }
            }
            if ($picked.Count) {
                    $html += '<ul class="minibooks">'
                    foreach ($b in $picked) {
                        $html += '<li class="minibook">'
                        $bimg = [string](P $b 'image')
                        if ($bimg) {
                            $html += '<img class="minibook__cover" src="' + (E (Url $bimg)) + '" alt="' + (E ([string](P $b 'imageAlt'))) + '" loading="lazy" decoding="async">'
                        }
                        else {
                            $html += '<span class="minibook__cover minibook__cover--placeholder" aria-hidden="true"></span>'
                        }
                        $html += '<span class="minibook__body">'
                        $html += '<span class="minibook__title">' + (E ([string](P $b 'title'))) + '</span>'
                        $why = [string](P $b 'audience')
                        if ($why) { $html += '<span class="minibook__meta">' + (E $why) + '</span>' }
                        if (([string](P $b 'availability' 'in-preparation')) -eq 'available') {
                            $html += '<a class="minibook__link" href="' + (E (Url 'rcf-publications/')) + '">See it in RCF Publications</a>'
                        }
                        else {
                            $html += '<span class="minibook__soon">In preparation</span>'
                        }
                        $html += '</span></li>'
                    }
                $html += '</ul>'
            }
            if (PubIsLive) {
                $html += '<p class="mb-0"><a class="btn btn--sm btn--outline' + (PubExtClass) + '" href="' + (E (Url 'PUBLICATIONS_WEBSITE_URL')) + '"' + (PubExtAttrs) + '>Browse ' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubExtNote) + '</span></a></p>'
            }
            else {
                $html += '<p class="mb-0"><span class="badge-soon">Coming soon</span> '
                $html += '<span class="text-small">' + (E $script:Config.publicationsName) + ' has not been published yet. '
                if ($script:PageSlug -ne $script:PubFallback.Trim('/')) {
                    $html += '<a href="' + (E (Url $script:PubFallback)) + '">See what it will offer</a>.'
                }
                $html += '</span></p>'
            }
            return $html + '</div></div></section>'
        }

        'related' {
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="grid grid--3">'
            foreach ($item in (AsList (P $block 'items'))) {
                $target = [string](P $item 'url' '')
                $html += '<div class="card card--link card--flat"><h3><a href="' + (E (Url $target)) + '">' + (E (P $item 'title')) + '</a></h3>'
                $html += Paragraphs (P $item 'text')
                $html += '<span class="card__more" aria-hidden="true">Open</span></div>'
            }
            return $html + '</div></div></section>'
        }

        'contactForm' {
            return (RenderForm $block)
        }

        'search' {
            return (RenderSearchBlock $block)
        }

        'literature' {
            return (RenderLiterature $block)
        }

        default {
            [void]$script:Warnings.Add("Unknown block type '$type' on page '$($script:PageSlug)'")
            return ''
        }
    }
}

# ---------------------------------------------------- data-driven blocks --

function TypeLabel($value) {
    $map = @{
        'past-paper' = 'Past paper'; 'model-paper' = 'Model paper'; 'marking-scheme' = 'Marking scheme';
        'model-answer' = 'Model answer'; 'worksheet' = 'Worksheet'; 'lesson-plan' = 'Lesson plan';
        'revision-paper' = 'Revision paper'; 'question-bank' = 'Question bank'; 'lesson' = 'Lesson';
        'teaching-guide' = 'Teaching guide'; 'guidance' = 'Examination guidance'; 'article' = 'Article';
        'textbook' = 'Textbook'; 'teachers-guide' = 'Teachers'' guide'; 'study-pack' = 'Study pack'
    }
    $key = [string]$value
    if ($map.ContainsKey($key)) { return $map[$key] }
    if (-not $key) { return 'Resource' }
    return ((Get-Culture).TextInfo.ToTitleCase(($key -replace '[-_]', ' ')))
}

# ---------------------------------------------------------------------------
# The resource finder: one list across the resource catalogue, the paper
# catalogue, the listening tests and the RCF Publications ebooks, reduced to a
# single shape so one set of filters works across all of them.
#
# Everything is written into the page as a plain list, so it is complete and
# readable with JavaScript off and visible to search engines. assets/js/
# finder.js adds the filters on top by reading the data- attributes.
#
# A label is shown only where a record actually says it is true. Most papers
# do not record whether answers are included or whether the scan was checked,
# so those papers simply carry no label - the finder never guesses.
# ---------------------------------------------------------------------------

function FinderGrades($record) {
    $out = @()
    $g = [string](P $record 'grade')
    if ($g -match '^\d+$') { $out += [int]$g }
    $lvl = [string](P $record 'level')
    foreach ($m in [regex]::Matches($lvl, '\b(\d{1,2})\b')) {
        $n = [int]$m.Groups[1].Value
        if ($n -ge 1 -and $n -le 13) { $out += $n }
    }
    if ($lvl -match 'O/L|Ordinary') { $out += 11 }
    if ($lvl -match 'A/L|Advanced') { $out += 12; $out += 13 }
    return @($out | Sort-Object -Unique)
}

function FinderArea($subject) {
    $s = ([string]$subject).ToLower()
    if ($s -match 'literature') { return 'literature' }
    if ($s -match 'general') { return 'general' }
    return 'english'
}

function FinderTypeGroup($type) {
    switch -regex ([string]$type) {
        '^(past-paper|model-paper|revision-paper|practice-paper|question-bank)$' { return 'papers' }
        '^(marking-scheme|model-answer)$' { return 'answers' }
        '^(worksheet|resource-book|workbook|vocabulary)$' { return 'worksheets' }
        '^study-pack$' { return 'study-packs' }
        '^textbook$' { return 'textbooks' }
        '^(teachers-guide|scheme-of-work|lesson-plan|syllabus)$' { return 'guides' }
    }
    return 'other'
}

$script:FinderTypeOrder = @('papers', 'answers', 'worksheets', 'study-packs', 'textbooks', 'guides', 'listening', 'ebooks', 'other')

function FinderFileType($target) {
    $t = ([string]$target).ToLower()
    if (-not $t) { return '' }
    if ($t -match 'drive\.google\.com|docs\.google\.com') { return 'Google Drive' }
    if ($t -match '\.pdf($|\?)') { return 'PDF' }
    if ($t -match '\.docx?($|\?)') { return 'Word' }
    if ($t -match '\.pptx?($|\?)') { return 'PowerPoint' }
    if ($t -match '^https?:') { return 'Website' }
    return 'Page'
}

# A local file's real size, read from disk, where the record gives none.
function FinderLocalSize($target) {
    $t = [string]$target
    if (-not $t -or $t -match '^https?:' -or $t -notmatch '\.(pdf|docx?|pptx?)$') { return '' }
    $path = Join-Path $ProjectRoot ($t -replace '/', '\')
    if (-not (Test-Path -LiteralPath $path)) { return '' }
    $bytes = (Get-Item -LiteralPath $path).Length
    if ($bytes -ge 1MB) { return ('{0:0.0} MB' -f ($bytes / 1MB)) }
    return ('{0:0} KB' -f [math]::Max(1, $bytes / 1KB))
}

function FinderRow($fields) {
    return [pscustomobject]$fields
}

$script:FinderCache = $null
function FinderRecords() {
    if ($null -ne $script:FinderCache) { return $script:FinderCache }
    $today = Get-Date
    $rows = New-Object System.Collections.ArrayList

    foreach ($r in @($resources | Where-Object { (P $_ 'published' $true) -ne $false })) {
        $group = FinderTypeGroup (P $r 'type')
        $audience = 'student'
        if ($group -eq 'guides') { $audience = 'teacher' }
        elseif ($group -in @('papers', 'answers', 'study-packs', 'textbooks')) { $audience = 'both' }
        elseif ([string](P $r 'category') -eq 'teacher-resources') { $audience = 'teacher' }
        $labels = @()
        if ([string](P $r 'anonymousAccess') -eq 'verified') { $labels += 'Link checked' }
        $added = [string](P $r 'added')
        $d = [datetime]::MinValue
        if ($added -and [datetime]::TryParse($added, [ref]$d) -and ($today - $d).TotalDays -le 14) { $labels += 'New' }
        $url = [string](P $r 'url')
        $dl = [string](P $r 'download')
        $ftTarget = $url
        if ($dl) { $ftTarget = $dl }
        [void]$rows.Add((FinderRow @{
            title = [string](P $r 'title'); desc = [string](P $r 'description')
            grades = @(FinderGrades $r); area = (FinderArea (P $r 'subject')); term = ''
            group = $group; typeLabel = (TypeLabel (P $r 'type')); audience = $audience; access = 'free'
            year = ''; level = [string](P $r 'level')
            url = $url; download = $dl; fileType = (FinderFileType $ftTarget)
            size = [string](P $r 'fileSize'); source = [string](P $r 'author'); labels = $labels
            words = ((AsList (P $r 'keywords')) -join ' ')
        }))
    }

    foreach ($r in @($papers | Where-Object { (P $_ 'published' $true) -ne $false })) {
        $group = FinderTypeGroup (P $r 'type')
        $url = [string](P $r 'url')
        $dl = [string](P $r 'download')
        $ftTarget = $url
        if ($dl) { $ftTarget = $dl }
        $size = [string](P $r 'fileSize')
        if (-not $size) { $size = FinderLocalSize $ftTarget }
        $labels = @()
        if ((P $r 'answers') -eq 'yes') { $labels += 'Answers included' }
        if ((P $r 'clearScan') -eq 'yes') { $labels += 'Clear scan' }
        if ([string](P $r 'medium') -eq 'english') { $labels += 'English medium' }
        $src = [string](P $r 'province')
        if (-not $src) { $src = [string](P $r 'source') }
        [void]$rows.Add((FinderRow @{
            title = [string](P $r 'title'); desc = [string](P $r 'description')
            grades = @(FinderGrades $r); area = (FinderArea (P $r 'subject')); term = [string](P $r 'term')
            group = $group; typeLabel = (TypeLabel (P $r 'type')); audience = 'both'; access = 'free'
            year = [string](P $r 'year'); level = [string](P $r 'level')
            url = $url; download = $dl; fileType = (FinderFileType $ftTarget)
            size = $size; source = $src; labels = $labels
            words = ([string](P $r 'examination') + ' ' + [string](P $r 'paper'))
        }))
    }

    # Listening: two entries per grade, kept apart as on the grade pages: the
    # Pupil's Book listening tests and the extra tests written by RCF English.
    # Each points at its own section of the grade page.
    $tests = @(DataList 'listening' 'tests')
    foreach ($grp in ($tests | Group-Object { [string](P $_ 'grade') + '|' + $(if ([string](P $_ 'source') -eq 'textbook') { 'a-textbook' } else { 'b-extra' }) } | Sort-Object { [int]($_.Name.Split('|')[0]) }, { $_.Name.Split('|')[1] })) {
        $g = [int]($grp.Name.Split('|')[0])
        $isBook = $grp.Name.EndsWith('textbook')
        $lTitle = $(if ($isBook) { "Grade $g Pupil's Book listening tests" } elseif ($g -ge 12) { 'A/L General English listening tests' } else { "Grade $g extra listening tests" })
        $lDesc = $(if ($isBook) { "$($grp.Count) listening activities from the Grade $g Pupil's Book and Workbook, read aloud on the page, with questions that mark themselves." } else { "$($grp.Count) extra listening tests written by RCF English, read aloud on the page, with words to learn first and questions that mark themselves." })
        $lAnchor = $(if ($isBook) { 'textbook-listening' } else { 'listening' })
        [void]$rows.Add((FinderRow @{
            title = $lTitle; desc = $lDesc
            grades = @($g); area = 'english'; term = ''
            group = 'listening'; typeLabel = 'Listening'; audience = 'student'; access = 'free'
            year = ''; level = (ListeningLabel $g)
            url = (ListeningHome $g $lAnchor); download = ''; fileType = 'Interactive'
            size = ''; source = ''; labels = @()
            words = $(if ($isBook) { 'listening audio pupils book textbook workbook' } else { 'listening audio extra practice' })
        }))
    }

    # Ebooks - the one premium kind of material on the site.
    $books = @()
    $books = $publicationBooks
    foreach ($b in $books) {
        if ((P $b 'published' $true) -eq $false) { continue }
        if ([string](P $b 'availability') -ne 'available') { continue }
        $aud = [string](P $b 'audience')
        $audience = 'student'
        if ($aud -match 'teacher' -and $aud -match 'student|learner') { $audience = 'both' }
        elseif ($aud -match 'teacher') { $audience = 'teacher' }
        $cat = [string](P $b 'category')
        $price = [string](P $b 'price')
        $labels = @()
        if ($price) { $labels += $price }
        [void]$rows.Add((FinderRow @{
            title = [string](P $b 'title'); desc = [string](P $b 'description')
            grades = @(FinderGrades ([pscustomobject]@{ level = $aud })); area = (FinderArea "$cat $aud"); term = ''
            group = 'ebooks'; typeLabel = 'Ebook'; audience = $audience; access = 'premium'
            year = ''; level = $aud
            url = 'rcf-publications/'; download = ''; fileType = [string](P $b 'format' 'Ebook')
            size = ''; source = 'RCF Publications'; labels = $labels
            words = $cat
        }))
    }

    $order = $script:FinderTypeOrder
    $script:FinderCache = @($rows | Sort-Object `
        @{ Expression = { if (@($_.grades).Count) { @($_.grades)[0] } else { 99 } } },
        @{ Expression = { [array]::IndexOf($order, $_.group) } },
        @{ Expression = { $_.year }; Descending = $true },
        @{ Expression = { $_.title } })
    return $script:FinderCache
}

function RenderFinder($block) {
    $rows = @(FinderRecords)
    $html = (SectionOpen $block) + (SectionHead $block)
    $html += '<div class="finder" data-finder data-page-size="' + (E ([string](P $block 'pageSize' '24'))) + '">'
    $html += '<div class="finder__controls" data-finder-controls></div>'
    $html += '<p class="finder__count" data-finder-count>' + $rows.Count + ' resources</p>'
    $html += '<p class="visually-hidden" role="status" aria-live="polite" data-finder-live></p>'
    $html += '<ul class="finder__list" data-finder-list>'
    foreach ($r in $rows) {
        $gradesAttr = ' ' + ((@($r.grades) | ForEach-Object { [string]$_ }) -join ' ') + ' '
        $termText = ''
        if ($r.term) { $termText = "$($r.term) term" }
        $text = (@($r.title, $r.desc, $r.level, $r.source, $r.typeLabel, $r.words, $termText, $r.year) -join ' ')
        $html += '<li class="fres" data-grades="' + (E $gradesAttr) + '" data-area="' + $r.area + '" data-term="' + (E $r.term) + '" data-type="' + $r.group + '" data-audience="' + $r.audience + '" data-access="' + $r.access + '" data-year="' + (E $r.year) + '" data-text="' + (E $text) + '">'
        $html += '<div class="fres__main"><div class="tag-row">'
        $html += '<span class="tag tag--type">' + (E $r.typeLabel) + '</span>'
        if ($r.access -eq 'premium') { $html += '<span class="tag fres__premium">Premium</span>' } else { $html += '<span class="tag fres__free">Free</span>' }
        if ($r.level) { $html += '<span class="tag tag--level">' + (E $r.level) + '</span>' }
        if ($r.term) { $html += '<span class="tag">' + (E ((Get-Culture).TextInfo.ToTitleCase($r.term))) + ' term</span>' }
        if ($r.year) { $html += '<span class="tag tag--year">' + (E $r.year) + '</span>' }
        foreach ($l in @($r.labels)) {
            $cls = 'tag'
            if ($l -eq 'Answers included') { $cls = 'tag tag--answers' }
            elseif ($l -eq 'Clear scan') { $cls = 'tag tag--clear' }
            elseif ($l -eq 'New') { $cls = 'tag fres__new' }
            $html += '<span class="' + $cls + '">' + (E $l) + '</span>'
        }
        $html += '</div>'
        $extAttr = ''
        if ($r.url -match '^https?:') { $extAttr = ' target="_blank" rel="noopener"' }
        $html += '<h3 class="fres__title">'
        if ($r.url) { $html += '<a href="' + (E (Url $r.url)) + '"' + $extAttr + '>' + (E $r.title) + '</a>' } else { $html += (E $r.title) }
        $html += '</h3>'
        $meta = @()
        if ($r.fileType) { $meta += (E $r.fileType) }
        if ($r.size) { $meta += (E $r.size) }
        if ($r.source) { $meta += (E $r.source) }
        if ($meta.Count) { $html += '<p class="fres__meta">' + ($meta -join ' &middot; ') + '</p>' }
        $html += '</div><div class="fres__actions">'
        if ($r.url) {
            $viewLabel = 'View'
            if ($r.group -eq 'listening') { $viewLabel = 'Open' }
            elseif ($r.access -eq 'premium') { $viewLabel = 'See the book' }
            $html += '<a class="btn btn--sm btn--accent" href="' + (E (Url $r.url)) + '"' + $extAttr + '>' + $viewLabel + '<span class="visually-hidden">: ' + (E $r.title) + '</span></a>'
        }
        if ($r.download -and $r.download -ne $r.url) {
            $dlExt = ''
            if ($r.download -match '^https?:') { $dlExt = ' target="_blank" rel="noopener"' }
            $html += '<a class="btn btn--sm btn--outline" href="' + (E (Url $r.download)) + '"' + $dlExt + '>Download<span class="visually-hidden">: ' + (E $r.title) + '</span></a>'
        }
        # A broken link is reported on WhatsApp with the resource already named,
        # so the report arrives with everything needed to find and fix it.
        $report = "Hello, I would like to report a problem with this resource on RCF English: $($r.title) ($([string]$r.url)). The problem is: "
        $html += '<a class="fres__report" href="https://wa.me/' + (E $script:Config.whatsappInternational) + '?text=' + (E ([uri]::EscapeDataString($report))) + '" target="_blank" rel="noopener">Report a problem<span class="visually-hidden"> with ' + (E $r.title) + '</span></a>'
        $html += '</div></li>'
    }
    $html += '</ul>'
    $html += '<p class="finder__empty" data-finder-empty hidden>Nothing matches those choices. Try removing a filter, or <a href="' + (E (Url 'search/')) + '">search the whole site</a>.</p>'
    $html += '<p class="finder__more"><button type="button" class="btn btn--outline" data-finder-more hidden>Show more</button></p>'
    $html += '</div>'
    return $html + '</div></section>'
}

function StaticList($source, $fixed, $limit = 0) {
    $records = @()
    if ($source -eq 'papers') { $records = $papers }
    elseif ($source -eq 'resources') { $records = $resources }
    else { $records = @(DataList $source 'items') }

    if ($fixed) {
        foreach ($prop in $fixed.PSObject.Properties) {
            $key = $prop.Name
            $want = [string]$prop.Value
            $records = @($records | Where-Object { [string](P $_ $key) -eq $want })
        }
    }
    $records = @($records | Where-Object { (P $_ 'published' $true) -ne $false })

    if ($records.Count -eq 0) {
        return '<ul class="result-list" data-results></ul><div class="empty-state"><h3>No resources have been published here yet</h3>' +
        '<p>Approved resources will appear on this page as they are added. You can <a href="' + (E (Url 'search/')) + '">search the whole site</a> or <a href="' + (E (Url 'contact/')) + '">ask for a particular resource</a>.</p></div>'
    }

    # A long list buries everything under it. Where a page asks for a limit,
    # only that many are written into the page and a button offers the rest.
    $shown = $records
    if ($limit -gt 0 -and $records.Count -gt $limit) { $shown = @($records | Select-Object -First $limit) }

    $html = '<ul class="result-list" data-results>'
    foreach ($r in $shown) {
        $target = [string](P $r 'url' (P $r 'file' ''))
        $isExt = $target -match '^https?:'
        $html += '<li class="result"><span class="result__thumb" aria-hidden="true">' + (E (TypeLabel (P $r 'type'))) + '</span><div><div class="tag-row">'
        $html += '<span class="tag tag--type">' + (E (TypeLabel (P $r 'type'))) + '</span>'
        if (P $r 'level') { $html += '<span class="tag tag--level">' + (E (P $r 'level')) + '</span>' }
        if (P $r 'term')  { $html += '<span class="tag">' + (E (P $r 'term')) + ' term</span>' }
        if (P $r 'year')  { $html += '<span class="tag tag--year">' + (E (P $r 'year')) + '</span>' }
        if ((P $r 'answers') -eq 'yes') { $html += '<span class="tag tag--answers">Answers included</span>' }
        # Only set on papers whose first page somebody has actually looked at.
        # edupub.gov.lk serves no HTTPS at all, so the link has to stay
        # http://. Say so plainly rather than leave it looking accidental.
        if ($target -match '^http://') {
            $html += '<span class="tag tag--http" title="This official government site is served over plain HTTP, not HTTPS. The link still works; the connection to that site is not encrypted.">Official site, no HTTPS</span>'
        }
        if ((P $r 'clearScan') -eq 'yes') {
            $html += '<span class="tag tag--clear" title="The first page of this PDF was checked on screen: straight, sharp, complete, and with no student name on it.">Clear scan</span>'
        }
        $html += '</div><h3>'
        if ($target) {
            $e = ''
            if ($isExt) { $e = ' target="_blank" rel="noopener" class="ext"' }
            $html += '<a href="' + (E (Url $target)) + '"' + $e + '>' + (E (P $r 'title')) + '</a>'
        }
        else { $html += (E (P $r 'title')) }
        $html += '</h3>'
        if (P $r 'description') { $html += '<p>' + (E (P $r 'description')) + '</p>' }

        # Where the paper came from, how big it is, and how many pages if counted.
        $meta = @()
        if (P $r 'province')   { $meta += 'Province or zone: ' + (E (P $r 'province')) }
        if (P $r 'sourceType') {
            $setBy = switch ([string](P $r 'sourceType')) {
                'provincial' { 'A provincial department' }
                'zonal'      { 'A zonal or divisional office' }
                'school'     { 'A school' }
                default      { [string](P $r 'sourceType') }
            }
            $meta += 'Set by: ' + (E $setBy)
        }
        if (P $r 'source')   { $meta += 'Printed on the paper: ' + (E (P $r 'source')) }
        if (P $r 'pages')    { $meta += 'Pages: ' + (E (P $r 'pages')) }
        if (P $r 'fileSize') { $meta += 'PDF, ' + (E (P $r 'fileSize')) }
        if ($meta.Count -gt 0) {
            $html += '<div class="result__meta">'
            foreach ($m in $meta) { $html += '<span>' + $m + '</span>' }
            $html += '</div>'
        }

        $actions = @()
        if ($target) {
            $e = ''
            if ($isExt) { $e = ' target="_blank" rel="noopener"' }
            $cls = 'btn btn--sm btn--outline'
            if ($isExt) { $cls += ' ext' }
            $actions += '<a class="' + $cls + '" href="' + (E (Url $target)) + '"' + $e + '>View the paper</a>'
        }
        if (P $r 'download') {
            # Through Url() like every other href. Papers hosted on this site
            # were otherwise linked relative to the current directory, which
            # made "Download PDF" answer 404 on every one of them.
            $d = [string](P $r 'download')
            $dCls = 'btn btn--sm btn--primary'
            $dAttr = ''
            if ($d -match '^https?:') { $dCls += ' ext'; $dAttr = ' target="_blank" rel="noopener"' }
            $actions += '<a class="' + $dCls + '" href="' + (E (Url $d)) + '"' + $dAttr + '>Download PDF</a>'
        }
        if (P $r 'markingScheme') {
            $ms = [string](P $r 'markingScheme')
            $msE = ''
            $msCls = 'btn btn--sm btn--outline'
            if ($ms -match '^https?:') { $msE = ' target="_blank" rel="noopener"'; $msCls += ' ext' }
            $actions += '<a class="' + $msCls + '" href="' + (E (Url $ms)) + '"' + $msE + '>Marking scheme</a>'
        }
        if ($actions.Count -gt 0) {
            $html += '<div class="result__actions">' + ($actions -join '') + '</div>'
        }

        if (P $r 'copyright') { $html += '<p class="text-small text-muted mb-0">Copyright status: ' + (E (P $r 'copyright')) + '</p>' }
        $html += '</div></li>'
    }
    return $html + '</ul>'
}

# ============================================================ Paper library
#
# The old past-paper page handed the visitor one long list and a row of eight
# filters, and answered "No results found" whenever the words they typed did
# not appear in a filename. That is the wrong job for the reader to be doing.
#
# The library below inverts it. Every paper is placed in exactly one visible
# section - Grade 1 to Grade 13, O/L Literature or A/L Literature - the whole
# section is shown as soon as it is chosen, and the only filter inside a
# section is the year. Nothing has to be typed to see papers.

# The script each interactive block needs, loaded automatically on any page
# that uses the block (see the module list in BuildPage).
$script:BlockScripts = @{
    'browse'       = 'browse'
    'finder'       = 'finder'
    'paperLibrary' = 'paper-library'
    'search'       = 'search'
    'activities'   = 'quiz'
    'listening'    = 'listening'
    'planFinder'   = 'plan-finder'
}

$script:PaperSectionOrder = @(
    @{ key = 'grade-1';       label = 'Grade 1';         short = '1' },
    @{ key = 'grade-2';       label = 'Grade 2';         short = '2' },
    @{ key = 'grade-3';       label = 'Grade 3';         short = '3' },
    @{ key = 'grade-4';       label = 'Grade 4';         short = '4' },
    @{ key = 'grade-5';       label = 'Grade 5';         short = '5' },
    @{ key = 'grade-6';       label = 'Grade 6';         short = '6' },
    @{ key = 'grade-7';       label = 'Grade 7';         short = '7' },
    @{ key = 'grade-8';       label = 'Grade 8';         short = '8' },
    @{ key = 'grade-9';       label = 'Grade 9';         short = '9' },
    @{ key = 'grade-10';      label = 'Grade 10';        short = '10' },
    @{ key = 'grade-11';      label = 'Grade 11';        short = '11' },
    @{ key = 'grade-12';      label = 'Grade 12';        short = '12' },
    @{ key = 'grade-13';      label = 'Grade 13';        short = '13' },
    @{ key = 'ol-literature'; label = 'O/L Literature';  short = 'O/L Lit' },
    @{ key = 'al-literature'; label = 'A/L Literature';  short = 'A/L Lit' }
)

# A one-line explanation under each section heading, so a visitor who lands on
# Grade 11 understands why the O/L papers are sitting in it.
$script:PaperSectionNote = @{
    'grade-11'      = 'Grade 11 English term tests together with the G.C.E. O/L English Language papers, model papers and marking schemes, because O/L is sat at the end of Grade 11.'
    'grade-13'      = 'Grade 13 papers together with A/L General English, which is sat at the end of Grade 13.'
    'ol-literature' = 'English Literature papers for Grades 10 and 11 and for the G.C.E. O/L Literature examination.'
    'al-literature' = 'Advanced Level English Literature papers, including the language paper and unseen appreciation.'
}

# Which single section a paper belongs in. A paper is never placed in two
# sections: the literature subjects win over the grade number, because a
# reader looking for a Grade 10 literature paper looks under Literature.
function PaperSectionKey($r) {
    $subject = [string](P $r 'subject' '')
    if ($subject -eq 'al-literature') { return 'al-literature' }
    if ($subject -eq 'ol-literature') { return 'ol-literature' }

    $grade = ([string](P $r 'grade' '')).Trim()
    if ($grade -match '^(1[0-3]|[1-9])$') { return 'grade-' + $grade }

    # No grade recorded. O/L is sat at the end of Grade 11 and A/L General
    # English at the end of Grade 13, so these belong there rather than being
    # dropped for want of a grade field.
    $level = [string](P $r 'level' '')
    $exam = [string](P $r 'examination' '')
    if ($level -eq 'O/L' -or $exam -eq 'ol') { return 'grade-11' }
    if ($level -match 'Advanced' -or $exam -eq 'al' -or $subject -eq 'general-english') { return 'grade-13' }
    return ''
}

# The Google Drive file id, used only to make certain the same PDF is never
# listed twice under two different titles.
function PaperFileKey($r) {
    foreach ($field in @('url', 'download', 'file')) {
        $u = [string](P $r $field '')
        if ($u -match '/d/([A-Za-z0-9_-]{10,})') { return 'drive:' + $Matches[1] }
        if ($u -match '[?&]id=([A-Za-z0-9_-]{10,})') { return 'drive:' + $Matches[1] }
    }
    $u = [string](P $r 'url' (P $r 'file' ''))
    if ($u) { return 'url:' + $u.ToLower() }
    return 'id:' + [string](P $r 'id' '')
}

# Papers are grouped by year, newest first. A paper with no confirmed year is
# still shown - it goes to the end under "Year not specified" - never hidden.
function PaperYearRank($r) {
    $y = ([string](P $r 'year' '')).Trim()
    if ($y -match '^(\d{4})') { return [int]$Matches[1] }
    return -1
}

function PaperYearLabel($r) {
    $y = ([string](P $r 'year' '')).Trim()
    if ($y) { return $y }
    return 'Year not specified'
}

# What the card shows on the "Term or examination" line.
function PaperTermExamLabel($r) {
    $term = [string](P $r 'term' '')
    $exam = [string](P $r 'examination' '')
    $bits = @()
    switch ($term) {
        'first'  { $bits += 'First term' }
        'second' { $bits += 'Second term' }
        'third'  { $bits += 'Third term' }
    }
    switch ($exam) {
        'ol'              { $bits += 'G.C.E. O/L examination' }
        'al'              { $bits += 'G.C.E. A/L examination' }
        'model'           { $bits += 'Model paper' }
        'provincial'      { $bits += 'Provincial examination' }
        'school-term-test' { if ($bits.Count -eq 0) { $bits += 'School term test' } else { $bits += 'test' } }
    }
    if ($bits.Count -eq 0) { return 'Not stated on the paper' }
    if ($bits.Count -eq 2 -and $bits[1] -eq 'test') { return $bits[0] + ' test' }
    return ($bits -join ' &middot; ')
}

# Province, zone or school. Where the paper itself names its source that is
# the more exact answer, so it is preferred over the province field.
function PaperPlaceLabel($r) {
    $source = [string](P $r 'source' '')
    $prov = [string](P $r 'province' '')
    if ($source -and $prov -and ($source -ne $prov)) { return $source }
    if ($source) { return $source }
    if ($prov) { return $prov }
    return 'Not recorded'
}

function PaperSubjectLabel($value) {
    switch ([string]$value) {
        'ol-english'      { return 'English Language' }
        'ol-literature'   { return 'English Literature' }
        'al-literature'   { return 'A/L English Literature' }
        'general-english' { return 'A/L General English' }
        default           { return 'English' }
    }
}

function PaperMediumLabel($value) {
    $v = [string]$value
    if (-not $v) { return 'Not recorded' }
    return ((Get-Culture).TextInfo.ToTitleCase($v.Replace('-', ' ')))
}

# Everything a reader might reasonably type, kept on the card so the internal
# search still finds a paper by its filename - without a filename ever being
# what the visitor has to guess.
function PaperCardSearch($r) {
    $bits = @(
        [string](P $r 'title' ''),
        [string](P $r 'description' ''),
        [string](P $r 'province' ''),
        [string](P $r 'source' ''),
        [string](P $r 'year' ''),
        [string](P $r 'id' '')
    )
    $u = [string](P $r 'url' (P $r 'file' ''))
    if ($u -match '/([^/?#]+\.pdf)') { $bits += $Matches[1].Replace('-', ' ') }

    # The alternative wordings a person actually types. PaperSearchWords does
    # the same job for the site-wide index, but it is defined below the page
    # loop and so is not callable from here.
    $grade = ([string](P $r 'grade' '')).Trim()
    if ($grade) { $bits += "grade $grade"; $bits += "gr $grade"; $bits += "g$grade" }
    $term = [string](P $r 'term' '')
    if ($term) {
        $n = @{ 'first' = '1st'; 'second' = '2nd'; 'third' = '3rd' }
        $bits += "$term term"; $bits += "$($n[$term]) term"
        if ($term -eq 'third') { $bits += 'year end' }
    }
    $exam = [string](P $r 'examination' '')
    $subject = [string](P $r 'subject' '')
    if ($exam -eq 'ol' -or $grade -eq '11') { $bits += 'ol o/l ordinary level' }
    if ($exam -eq 'al' -or $subject -match '^al-' -or $subject -eq 'general-english') { $bits += 'al a/l advanced level' }
    if ($subject -match 'literature') { $bits += 'literature english literature' }

    return (($bits | Where-Object { $_ }) -join ' ').ToLower()
}

# The library's "kind of paper" filter. Marking schemes and model answers sit
# together because a reader looking for one is usually happy with the other.
function PaperKindKey($type) {
    switch -Regex ([string]$type) {
        '^past-paper$' { return 'past' }
        '^model-paper$' { return 'model' }
        '^(marking-scheme|model-answer)$' { return 'answers' }
        '^(revision-paper|question-bank|practice-paper)$' { return 'revision' }
        default { return 'other' }
    }
}

function PaperCard($r) {
    $target = [string](P $r 'url' (P $r 'file' ''))
    $isExt = $target -match '^https?:'
    $year = ([string](P $r 'year' '')).Trim()

    $kind = PaperKindKey (P $r 'type')
    $term = ([string](P $r 'term' '')).Trim().ToLower()
    if ($term -notin @('first', 'second', 'third')) { $term = '' }
    $place = ([string](P $r 'province' '')).Trim()
    $placeType = ([string](P $r 'sourceType' '')).Trim().ToLower()
    $html = '<li class="paper-card" data-paper-card data-year="' + (E $year) + '" data-term="' + (E $term) + '" data-kind="' + (E $kind) + '" data-place="' + (E $place) + '" data-place-type="' + (E $placeType) + '" data-search="' + (E (PaperCardSearch $r)) + '">'

    # Tag row - the year first, because that is what a visitor scans for.
    $html += '<div class="tag-row">'
    if ($year) { $html += '<span class="tag tag--year">' + (E $year) + '</span>' }
    else { $html += '<span class="tag tag--undated">Year not specified</span>' }
    $html += '<span class="tag tag--type">' + (E (TypeLabel (P $r 'type'))) + '</span>'
    if ((P $r 'answers') -eq 'yes') { $html += '<span class="tag tag--answers">Answers included</span>' }
    if ((P $r 'clearScan') -eq 'yes') {
        $html += '<span class="tag tag--clear" title="The first page of this PDF was checked on screen: straight, sharp, complete, and with no student name on it.">Clear scan</span>'
    }
    if ($target -match '^http://') {
        $html += '<span class="tag tag--http" title="This official government site is served over plain HTTP, not HTTPS. The link still works; the connection to that site is not encrypted.">Official site, no HTTPS</span>'
    }
    if ([string](P $r 'medium') -eq 'english') { $html += '<span class="tag">English medium</span>' }
    # Only where the Drive link was actually opened without signing in.
    if ([string](P $r 'sourceChecked') -eq 'drive-link-verified-anonymously') {
        $html += '<span class="tag tag--checked" title="This Google Drive link was opened without signing in and the file was there.">Link checked</span>'
    }
    # "added" is optional. Without a recorded date nothing is called new.
    $added = [string](P $r 'added' '')
    $addedOn = [datetime]::MinValue
    if ($added -and [datetime]::TryParse($added, [ref]$addedOn) -and ((Get-Date) - $addedOn).TotalDays -le 30) {
        $html += '<span class="tag tag--new">Newly added</span>'
    }
    $html += '</div>'

    $html += '<h4 class="paper-card__title">' + (E (P $r 'title' 'Untitled paper')) + '</h4>'

    # The five facts the reader was promised, always in the same order and
    # always present, so the cards line up and nothing looks missing.
    $html += '<dl class="paper-card__facts">'
    $html += '<div><dt>Year</dt><dd>' + (E (PaperYearLabel $r)) + '</dd></div>'
    $html += '<div><dt>Term or examination</dt><dd>' + (PaperTermExamLabel $r) + '</dd></div>'
    $html += '<div><dt>Province, zone or school</dt><dd>' + (E (PaperPlaceLabel $r)) + '</dd></div>'
    $html += '<div><dt>Subject and paper type</dt><dd>' + (E (PaperSubjectLabel (P $r 'subject'))) + ' &mdash; ' + (E (TypeLabel (P $r 'type'))) + '</dd></div>'
    $html += '<div><dt>Medium</dt><dd>' + (E (PaperMediumLabel (P $r 'medium'))) + '</dd></div>'
    $html += '</dl>'

    $html += '<div class="paper-card__actions">'
    if ($target) {
        $e = ''
        $cls = 'btn btn--sm btn--outline'
        if ($isExt) { $e = ' target="_blank" rel="noopener"'; $cls += ' ext' }
        $html += '<a class="' + $cls + '" href="' + (E (Url $target)) + '"' + $e + '>View paper<span class="visually-hidden">: ' + (E (P $r 'title' '')) + '</span></a>'
    }
    # The download link must go through Url() like every other href. Most
    # papers live in Google Drive and are absolute, which hid the fault: the
    # PDFs that are hosted here were being linked relative to the current
    # directory, so "Download PDF" answered 404 on all of them.
    $dl = [string](P $r 'download' '')
    if ($dl) {
        $dlExt = $dl -match '^https?:'
        $dlCls = 'btn btn--sm btn--primary'
        $dlAttr = ' download'
        if ($dlExt) { $dlCls += ' ext'; $dlAttr = ' target="_blank" rel="noopener" download' }
        $html += '<a class="' + $dlCls + '" href="' + (E (Url $dl)) + '"' + $dlAttr + '>Download PDF<span class="visually-hidden">: ' + (E (P $r 'title' '')) + '</span></a>'
    }
    if (P $r 'markingScheme') {
        $ms = [string](P $r 'markingScheme')
        $msE = ''
        $msCls = 'btn btn--sm btn--outline'
        if ($ms -match '^https?:') { $msE = ' target="_blank" rel="noopener"'; $msCls += ' ext' }
        $html += '<a class="' + $msCls + '" href="' + (E (Url $ms)) + '"' + $msE + '>Marking scheme</a>'
    }
    $html += '</div>'

    $fs = [string](P $r 'fileSize' '')
    $foot = @()
    if ($fs) { $foot += 'PDF, ' + (E $fs) }
    if (P $r 'pages') { $foot += (E (P $r 'pages')) + ' pages' }
    if (P $r 'copyright') { $foot += (E (P $r 'copyright')) }
    if ($foot.Count -gt 0) {
        $html += '<p class="paper-card__foot">' + ($foot -join ' &middot; ') + '</p>'
    }

    return $html + '</li>'
}

# ---------------------------------------------------------------------------
# Charts drawn as inline SVG from data in the page file, for IELTS Writing
# Task 1 and anywhere else a chart helps. Kinds:
#   line     categories[] (x axis) + series[{name, values[]}]
#   bar      categories[] + series[{name, values[]}] (grouped bars)
#   pie      pies[{title, slices[{label, value}]}] (one or more pies)
#   process  steps[{title, note}] in order
#   map      panels[{title, items[{label, shape, x, y, w, h, points}]}]
#            on a 100 x 70 grid; shapes: building, green, water, road, bridge
# Every chart is followed by its figures as a table inside <details>, so the
# numbers can be checked and are available to screen readers.
# ---------------------------------------------------------------------------

$script:ChartColours = @('#1f5fa8', '#d9822b', '#2a9d8f', '#8e5ea2', '#c0392b', '#6b7a8f')
$script:ChartMarkers = @('circle', 'square', 'triangle', 'diamond', 'circle', 'square')

function Num($n) { return ([double]$n).ToString('0.##', [Globalization.CultureInfo]::InvariantCulture) }

# Figures a reader sees: 12400 is shown as 12,400.
function Figure($n) { return ([double]$n).ToString('#,0.##', [Globalization.CultureInfo]::InvariantCulture) }

function NiceMax($max) {
    if ($max -le 0) { return 10 }
    $pow = [Math]::Pow(10, [Math]::Floor([Math]::Log10($max)))
    foreach ($m in @(1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10)) {
        if ($m * $pow -ge $max) { return $m * $pow }
    }
    return 10 * $pow
}

function ChartValue($v) {
    return [double](([string]$v) -replace '[^0-9.\-]', '')
}

function SvgText($x, $y, $text, $attrs = '') {
    return '<text x="' + (Num $x) + '" y="' + (Num $y) + '"' + $attrs + '>' + (E $text) + '</text>'
}

function WrapLabel($text, $max) {
    $words = ([string]$text).Split(' ')
    $lines = New-Object System.Collections.ArrayList
    $line = ''
    foreach ($w in $words) {
        if ($line -and ($line.Length + 1 + $w.Length) -gt $max) { [void]$lines.Add($line); $line = $w }
        elseif ($line) { $line += ' ' + $w }
        else { $line = $w }
    }
    if ($line) { [void]$lines.Add($line) }
    return , $lines
}

function Marker($shape, $x, $y, $colour) {
    switch ($shape) {
        'square' { return '<rect x="' + (Num ($x - 4.5)) + '" y="' + (Num ($y - 4.5)) + '" width="9" height="9" fill="' + $colour + '"/>' }
        'triangle' { return '<polygon points="' + (Num $x) + ',' + (Num ($y - 6)) + ' ' + (Num ($x + 5.5)) + ',' + (Num ($y + 4)) + ' ' + (Num ($x - 5.5)) + ',' + (Num ($y + 4)) + '" fill="' + $colour + '"/>' }
        'diamond' { return '<polygon points="' + (Num $x) + ',' + (Num ($y - 6)) + ' ' + (Num ($x + 6)) + ',' + (Num $y) + ' ' + (Num $x) + ',' + (Num ($y + 6)) + ' ' + (Num ($x - 6)) + ',' + (Num $y) + '" fill="' + $colour + '"/>' }
        default { return '<circle cx="' + (Num $x) + '" cy="' + (Num $y) + '" r="4.5" fill="' + $colour + '"/>' }
    }
}

function ChartDataTable($block) {
    $kind = [string](P $block 'kind')
    $unit = [string](P $block 'unit' '')
    $html = '<details class="chart__data"><summary>Show the figures as a table</summary><div class="table-wrap"><table class="data">'
    if ($kind -eq 'line' -or $kind -eq 'bar') {
        $cats = (AsList (P $block 'categories'))
        $series = (AsList (P $block 'series'))
        $html += '<thead><tr><th scope="col">' + (E (P $block 'categoryLabel' '')) + '</th>'
        foreach ($s in $series) { $html += '<th scope="col">' + (E (P $s 'name')) + '</th>' }
        $html += '</tr></thead><tbody>'
        for ($i = 0; $i -lt $cats.Count; $i++) {
            $html += '<tr><th scope="row">' + (E $cats[$i]) + '</th>'
            foreach ($s in $series) { $html += '<td>' + (E ((AsList (P $s 'values'))[$i])) + '</td>' }
            $html += '</tr>'
        }
        $html += '</tbody>'
    }
    elseif ($kind -eq 'pie') {
        $pies = (AsList (P $block 'pies'))
        $labels = New-Object System.Collections.ArrayList
        foreach ($p in $pies) { foreach ($sl in (AsList (P $p 'slices'))) { if (-not $labels.Contains([string](P $sl 'label'))) { [void]$labels.Add([string](P $sl 'label')) } } }
        $html += '<thead><tr><th scope="col">Category</th>'
        foreach ($p in $pies) { $html += '<th scope="col">' + (E (P $p 'title')) + '</th>' }
        $html += '</tr></thead><tbody>'
        foreach ($l in $labels) {
            $html += '<tr><th scope="row">' + (E $l) + '</th>'
            foreach ($p in $pies) {
                $sl = $null
                foreach ($cand in (AsList (P $p 'slices'))) { if ([string](P $cand 'label') -eq $l) { $sl = $cand; break } }
                $html += '<td>' + $(if ($sl) { (E (P $sl 'value')) + $unit } else { '-' }) + '</td>'
            }
            $html += '</tr>'
        }
        $html += '</tbody>'
    }
    elseif ($kind -eq 'process') {
        $html += '<thead><tr><th scope="col">Stage</th><th scope="col">What happens</th></tr></thead><tbody>'
        $n = 1
        foreach ($s in (AsList (P $block 'steps'))) { $html += '<tr><th scope="row">' + $n + '. ' + (E (P $s 'title')) + '</th><td>' + (E (P $s 'note' '')) + '</td></tr>'; $n++ }
        $html += '</tbody>'
    }
    elseif ($kind -eq 'map') {
        $panels = (AsList (P $block 'panels'))
        $html += '<thead><tr>'
        foreach ($p in $panels) { $html += '<th scope="col">' + (E (P $p 'title')) + '</th>' }
        $html += '</tr></thead><tbody><tr>'
        foreach ($p in $panels) {
            $names = New-Object System.Collections.ArrayList
            foreach ($it in (AsList (P $p 'items'))) { if ([string](P $it 'label')) { [void]$names.Add([string](P $it 'label')) } }
            $html += '<td>' + (E ($names -join '; ')) + '</td>'
        }
        $html += '</tr></tbody>'
    }
    return $html + '</table></div></details>'
}

function RenderChartSvg($block) {
    $kind = [string](P $block 'kind')
    $title = [string](P $block 'title' '')
    $unit = [string](P $block 'unit' '')
    $svg = ''

    if ($kind -eq 'line' -or $kind -eq 'bar') {
        $cats = (AsList (P $block 'categories'))
        $series = (AsList (P $block 'series'))
        $W = 660; $H = 400; $L = 64; $R = $(if ($kind -eq 'line') { 130 } else { 20 }); $T = 50; $B = 58
        $max = 0
        foreach ($s in $series) { foreach ($v in (AsList (P $s 'values'))) { $n = ChartValue $v; if ($n -gt $max) { $max = $n } } }
        $yMax = [double](P $block 'yMax' (NiceMax $max))
        if ($yMax -ge 10000) { $L = 84 }
        $plotW = $W - $L - $R; $plotH = $H - $T - $B
        $svg += '<svg class="chart__svg" viewBox="0 0 ' + $W + ' ' + $H + '" role="img" aria-labelledby="{ID}-t">'
        $svg += '<title id="{ID}-t">' + (E $title) + '</title>'
        # grid and y axis
        $ticks = 5
        for ($k = 0; $k -le $ticks; $k++) {
            $val = $yMax * $k / $ticks
            $y = $T + $plotH - ($plotH * $k / $ticks)
            $svg += '<line x1="' + $L + '" x2="' + ($L + $plotW) + '" y1="' + (Num $y) + '" y2="' + (Num $y) + '" class="chart__grid"/>'
            $svg += SvgText ($L - 8) ($y + 4) (Figure $val) ' class="chart__tick" text-anchor="end"'
        }
        if (P $block 'yLabel') { $svg += '<text class="chart__axis-label" transform="translate(16 ' + (Num ($T + $plotH / 2)) + ') rotate(-90)" text-anchor="middle">' + (E (P $block 'yLabel')) + '</text>' }
        $svg += '<line x1="' + $L + '" x2="' + ($L + $plotW) + '" y1="' + ($T + $plotH) + '" y2="' + ($T + $plotH) + '" class="chart__axis"/>'
        $n = $cats.Count
        if ($kind -eq 'line') {
            $step = $(if ($n -gt 1) { $plotW / ($n - 1) } else { 0 })
            for ($i = 0; $i -lt $n; $i++) { $svg += SvgText ($L + $step * $i) ($T + $plotH + 22) $cats[$i] ' class="chart__tick" text-anchor="middle"' }
            $si = 0
            $ends = @()
            foreach ($s in $series) {
                $c = $script:ChartColours[$si % 6]
                $vals = (AsList (P $s 'values'))
                $pts = @()
                for ($i = 0; $i -lt $vals.Count; $i++) { $pts += (Num ($L + $step * $i)) + ',' + (Num ($T + $plotH - $plotH * (ChartValue $vals[$i]) / $yMax)) }
                $dash = $(if ($si % 3 -eq 1) { ' stroke-dasharray="8 5"' } elseif ($si % 3 -eq 2) { ' stroke-dasharray="2 4"' } else { '' })
                $svg += '<polyline points="' + ($pts -join ' ') + '" fill="none" stroke="' + $c + '" stroke-width="3"' + $dash + ' stroke-linejoin="round"/>'
                for ($i = 0; $i -lt $vals.Count; $i++) { $svg += Marker $script:ChartMarkers[$si % 6] ($L + $step * $i) ($T + $plotH - $plotH * (ChartValue $vals[$i]) / $yMax) $c }
                $ends += @{ y = ($T + $plotH - $plotH * (ChartValue $vals[$vals.Count - 1]) / $yMax); name = [string](P $s 'name'); c = $c }
                $si++
            }
            # direct labels at the line ends, nudged apart so they never overlap
            $ends = @($ends | Sort-Object { $_.y })
            for ($i = 1; $i -lt $ends.Count; $i++) { if ($ends[$i].y - $ends[$i - 1].y -lt 16) { $ends[$i].y = $ends[$i - 1].y + 16 } }
            foreach ($e in $ends) { $svg += SvgText ($L + $plotW + 10) ($e.y + 4) $e.name (' class="chart__series-label" fill="' + $e.c + '"') }
        }
        else {
            $groupW = $plotW / [Math]::Max($n, 1)
            $barW = [Math]::Min(34, ($groupW * 0.78) / [Math]::Max($series.Count, 1))
            for ($i = 0; $i -lt $n; $i++) {
                $gx = $L + $groupW * $i + ($groupW - $barW * $series.Count) / 2
                $si = 0
                foreach ($s in $series) {
                    $v = ChartValue ((AsList (P $s 'values'))[$i])
                    $h = $plotH * $v / $yMax
                    $x = $gx + $barW * $si
                    $svg += '<rect x="' + (Num $x) + '" y="' + (Num ($T + $plotH - $h)) + '" width="' + (Num ($barW - 2)) + '" height="' + (Num $h) + '" fill="' + $script:ChartColours[$si % 6] + '"><title>' + (E (P $s 'name')) + ', ' + (E $cats[$i]) + ': ' + (E ((AsList (P $s 'values'))[$i])) + $unit + '</title></rect>'
                    if ($barW -ge 18) { $svg += SvgText ($x + ($barW - 2) / 2) ($T + $plotH - $h - 5) (Figure $v) ' class="chart__value" text-anchor="middle"' }
                    $si++
                }
                $lines = WrapLabel $cats[$i] 14
                $ly = $T + $plotH + 18
                foreach ($ln in $lines) { $svg += SvgText ($L + $groupW * $i + $groupW / 2) $ly $ln ' class="chart__tick" text-anchor="middle"'; $ly += 14 }
            }
            # legend
            $lx = $L
            $si = 0
            foreach ($s in $series) {
                $svg += '<rect x="' + (Num $lx) + '" y="16" width="14" height="14" fill="' + $script:ChartColours[$si % 6] + '"/>'
                $svg += SvgText ($lx + 20) 28 (P $s 'name') ' class="chart__legend"'
                $lx += 34 + ([string](P $s 'name')).Length * 7.5
                $si++
            }
        }
        $svg += '</svg>'
    }
    elseif ($kind -eq 'pie') {
        $pies = (AsList (P $block 'pies'))
        $colourOf = @{}
        $ci = 0
        foreach ($p in $pies) { foreach ($sl in (AsList (P $p 'slices'))) { $lab = [string](P $sl 'label'); if (-not $colourOf.ContainsKey($lab)) { $colourOf[$lab] = $script:ChartColours[$ci % 6]; $ci++ } } }
        $cellW = 320; $W = $cellW * $pies.Count; $H = 420; $r = 110
        $svg += '<svg class="chart__svg" viewBox="0 0 ' + $W + ' ' + $H + '" role="img" aria-labelledby="{ID}-t">'
        $svg += '<title id="{ID}-t">' + (E $title) + '</title>'
        $pi = 0
        foreach ($p in $pies) {
            $cx = $cellW * $pi + $cellW / 2; $cy = 160
            $svg += SvgText $cx 28 (P $p 'title') ' class="chart__pie-title" text-anchor="middle"'
            $slices = (AsList (P $p 'slices'))
            $total = 0; foreach ($sl in $slices) { $total += ChartValue (P $sl 'value') }
            $angle = -[Math]::PI / 2
            foreach ($sl in $slices) {
                $v = ChartValue (P $sl 'value')
                $sweep = 2 * [Math]::PI * $v / $total
                $x1 = $cx + $r * [Math]::Cos($angle); $y1 = $cy + $r * [Math]::Sin($angle)
                $x2 = $cx + $r * [Math]::Cos($angle + $sweep); $y2 = $cy + $r * [Math]::Sin($angle + $sweep)
                $large = $(if ($sweep -gt [Math]::PI) { 1 } else { 0 })
                $lab = [string](P $sl 'label')
                $svg += '<path d="M' + (Num $cx) + ',' + (Num $cy) + ' L' + (Num $x1) + ',' + (Num $y1) + ' A' + $r + ',' + $r + ' 0 ' + $large + ' 1 ' + (Num $x2) + ',' + (Num $y2) + ' Z" fill="' + $colourOf[$lab] + '" stroke="#fff" stroke-width="2"><title>' + (E $lab) + ': ' + (E (P $sl 'value')) + $unit + '</title></path>'
                if ($sweep -gt 0.32) {
                    $mid = $angle + $sweep / 2
                    $svg += SvgText ($cx + $r * 0.64 * [Math]::Cos($mid)) ($cy + $r * 0.64 * [Math]::Sin($mid) + 5) ((Num $v) + $unit) ' class="chart__slice" text-anchor="middle"'
                }
                $angle += $sweep
            }
            # legend under each pie, in slice order
            $ly = $cy + $r + 30
            foreach ($sl in $slices) {
                $lab = [string](P $sl 'label')
                $svg += '<rect x="' + (Num ($cx - 95)) + '" y="' + (Num ($ly - 11)) + '" width="13" height="13" fill="' + $colourOf[$lab] + '"/>'
                $svg += SvgText ($cx - 76) $ly ($lab + '  ' + (Num (ChartValue (P $sl 'value'))) + $unit) ' class="chart__legend"'
                $ly += 19
            }
            $pi++
        }
        $svg += '</svg>'
    }
    elseif ($kind -eq 'process') {
        $steps = (AsList (P $block 'steps'))
        $perRow = [int](P $block 'perRow' 3)
        $boxW = 176; $boxH = 92; $gapX = 44; $gapY = 46; $padX = 20; $padY = 20
        $rows = [Math]::Ceiling($steps.Count / $perRow)
        $W = $padX * 2 + $perRow * $boxW + ($perRow - 1) * $gapX
        $H = $padY * 2 + $rows * $boxH + ($rows - 1) * $gapY
        $svg += '<svg class="chart__svg" viewBox="0 0 ' + $W + ' ' + $H + '" role="img" aria-labelledby="{ID}-t">'
        $svg += '<title id="{ID}-t">' + (E $title) + '</title>'
        $svg += '<defs><marker id="{ID}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0f2647"/></marker></defs>'
        $pos = @()
        for ($i = 0; $i -lt $steps.Count; $i++) {
            $row = [Math]::Floor($i / $perRow)
            $colIdx = $i % $perRow
            # rows run left to right, then right to left, like a snake, so each arrow is short
            if ($row % 2 -eq 1) { $colIdx = $perRow - 1 - $colIdx }
            $x = $padX + $colIdx * ($boxW + $gapX); $y = $padY + $row * ($boxH + $gapY)
            $pos += @{ x = $x; y = $y; row = $row }
            $svg += '<rect x="' + $x + '" y="' + $y + '" width="' + $boxW + '" height="' + $boxH + '" rx="10" class="chart__box"/>'
            $svg += '<circle cx="' + ($x + 18) + '" cy="' + ($y + 18) + '" r="12" class="chart__step-n"/>'
            $svg += SvgText ($x + 18) ($y + 22.5) ($i + 1) ' class="chart__step-num" text-anchor="middle"'
            $svg += SvgText ($x + 38) ($y + 24) (P $steps[$i] 'title') ' class="chart__step-title"'
            $ny = $y + 46
            foreach ($ln in (WrapLabel (P $steps[$i] 'note' '') 24)) { $svg += SvgText ($x + 12) $ny $ln ' class="chart__step-note"'; $ny += 15 }
        }
        for ($i = 0; $i -lt $steps.Count - 1; $i++) {
            $a = $pos[$i]; $b = $pos[$i + 1]
            if ($a.row -eq $b.row) {
                if ($b.x -gt $a.x) { $x1 = $a.x + $boxW; $x2 = $b.x } else { $x1 = $a.x; $x2 = $b.x + $boxW }
                $yy = $a.y + $boxH / 2
                $svg += '<line x1="' + (Num ($x1 + 4)) + '" y1="' + $yy + '" x2="' + (Num ($x2 - 4)) + '" y2="' + $yy + '" class="chart__arrow" marker-end="url(#{ID}-arrow)"/>'
            }
            else {
                $xx = $a.x + $boxW / 2
                $svg += '<line x1="' + $xx + '" y1="' + ($a.y + $boxH + 4) + '" x2="' + $xx + '" y2="' + ($b.y - 4) + '" class="chart__arrow" marker-end="url(#{ID}-arrow)"/>'
            }
        }
        $svg += '</svg>'
    }
    elseif ($kind -eq 'map') {
        $panels = (AsList (P $block 'panels'))
        $cellW = 330; $gridW = 300; $gridH = 210; $scale = 3
        $W = $cellW * $panels.Count; $H = 280
        $svg += '<svg class="chart__svg" viewBox="0 0 ' + $W + ' ' + $H + '" role="img" aria-labelledby="{ID}-t">'
        $svg += '<title id="{ID}-t">' + (E $title) + '</title>'
        $pi = 0
        foreach ($p in $panels) {
            $ox = $cellW * $pi + 15; $oy = 44
            $svg += SvgText ($ox + $gridW / 2) 28 (P $p 'title') ' class="chart__pie-title" text-anchor="middle"'
            $svg += '<rect x="' + $ox + '" y="' + $oy + '" width="' + $gridW + '" height="' + $gridH + '" class="chart__map-bg"/>'
            $items = (AsList (P $p 'items'))
            # draw in layers: water and green first, then roads, then buildings, then labels
            foreach ($layer in @('water', 'green', 'road', 'bridge', 'building')) {
                foreach ($it in $items) {
                    $shape = [string](P $it 'shape' 'building')
                    if ($shape -ne $layer) { continue }
                    $x = $ox + $scale * [double](P $it 'x' 0); $y = $oy + $scale * [double](P $it 'y' 0)
                    $w = $scale * [double](P $it 'w' 10); $h = $scale * [double](P $it 'h' 6)
                    switch ($shape) {
                        'water' { $svg += '<rect x="' + (Num $x) + '" y="' + (Num $y) + '" width="' + (Num $w) + '" height="' + (Num $h) + '" class="chart__map-water"/>' }
                        'green' { $svg += '<rect x="' + (Num $x) + '" y="' + (Num $y) + '" width="' + (Num $w) + '" height="' + (Num $h) + '" rx="6" class="chart__map-green"/>' }
                        'road' { $svg += '<rect x="' + (Num $x) + '" y="' + (Num $y) + '" width="' + (Num $w) + '" height="' + (Num $h) + '" class="chart__map-road"/>' }
                        'bridge' { $svg += '<rect x="' + (Num $x) + '" y="' + (Num $y) + '" width="' + (Num $w) + '" height="' + (Num $h) + '" class="chart__map-bridge"/>' }
                        default { $svg += '<rect x="' + (Num $x) + '" y="' + (Num $y) + '" width="' + (Num $w) + '" height="' + (Num $h) + '" rx="2" class="chart__map-building"/>' }
                    }
                }
            }
            foreach ($it in $items) {
                $lab = [string](P $it 'label' '')
                if (-not $lab) { continue }
                $x = $ox + $scale * [double](P $it 'x' 0); $y = $oy + $scale * [double](P $it 'y' 0)
                $w = $scale * [double](P $it 'w' 10); $h = $scale * [double](P $it 'h' 6)
                $lx = $x + $w / 2
                $lines = WrapLabel $lab 12
                $ly = $y + $h / 2 - (($lines.Count - 1) * 13) / 2 + 4
                $cls = $(if ([string](P $it 'shape' 'building') -eq 'building') { 'chart__map-label chart__map-label--light' } else { 'chart__map-label' })
                foreach ($ln in $lines) { $svg += SvgText $lx $ly $ln (' class="' + $cls + '" text-anchor="middle"'); $ly += 13 }
            }
            # compass
            # sits above the map, level with the panel title, so it never covers a feature
            $nx = $ox + $gridW - 10; $ny = 22
            $svg += '<path d="M' + $nx + ',' + ($ny - 14) + ' L' + ($nx + 7) + ',' + ($ny + 6) + ' L' + $nx + ',' + ($ny + 1) + ' L' + ($nx - 7) + ',' + ($ny + 6) + ' Z" fill="#0f2647"/>'
            $svg += SvgText $nx ($ny + 20) 'N' ' class="chart__tick" text-anchor="middle"'
            $pi++
        }
        $svg += '</svg>'
    }
    return $svg
}

function RenderChart($block) {
    $script:ChartCount = [int]$script:ChartCount + 1
    $id = 'chart-' + $script:ChartCount
    $html = (SectionOpen $block) + (SectionHead $block)
    $html += '<figure class="chart chart--' + (E (P $block 'kind')) + '">'
    if (P $block 'title') { $html += '<figcaption class="chart__title">' + (Inline (P $block 'title')) + '</figcaption>' }
    $html += '<div class="chart__frame">' + ((RenderChartSvg $block) -replace '\{ID\}', $id) + '</div>'
    if (P $block 'caption') { $html += '<p class="chart__caption">' + (Inline (P $block 'caption')) + '</p>' }
    $html += ChartDataTable $block
    $html += '</figure>'
    return $html + '</div></section>'
}

function RenderPaperLibrary($block) {
    $records = @($papers | Where-Object { (P $_ 'published' $true) -ne $false })

    # A sub-page narrows the library to one subject or one kind of paper. The
    # section chooser and the year filter then work exactly as they do on the
    # main page, over the narrower set.
    $fixed = P $block 'fixed'
    if ($fixed) {
        foreach ($prop in $fixed.PSObject.Properties) {
            $key = $prop.Name
            $want = [string]$prop.Value
            $records = @($records | Where-Object { [string](P $_ $key) -eq $want })
        }
    }

    # Same PDF, two titles, one card. Nothing is dropped silently: a duplicate
    # is reported as a build warning so the data file can be tidied.
    $seen = @{}
    $unique = New-Object System.Collections.ArrayList
    foreach ($r in $records) {
        $k = PaperFileKey $r
        if ($seen.ContainsKey($k)) {
            [void]$script:Warnings.Add("Paper '$([string](P $r 'id'))' points at the same file as '$($seen[$k])' and was left out of the library to avoid a duplicate card")
            continue
        }
        $seen[$k] = [string](P $r 'id')
        [void]$unique.Add($r)
    }

    # Every paper must land somewhere. If one does not, say so loudly rather
    # than quietly losing it.
    $buckets = @{}
    foreach ($s in $script:PaperSectionOrder) { $buckets[$s.key] = New-Object System.Collections.ArrayList }
    foreach ($r in $unique) {
        $key = PaperSectionKey $r
        if (-not $key -or -not $buckets.ContainsKey($key)) {
            [void]$script:Warnings.Add("Paper '$([string](P $r 'id'))' could not be placed in any library section and is not shown")
            continue
        }
        [void]$buckets[$key].Add($r)
    }

    $total = 0
    foreach ($s in $script:PaperSectionOrder) { $total += $buckets[$s.key].Count }

    # Which sections this page shows. The main library keeps every grade,
    # including one with nothing in it yet, because a reader looking for
    # Grade 5 deserves to be told rather than left wondering. A narrowed page
    # drops the sections that cannot contain anything: "Model papers: Grade 9,
    # none yet" would be noise, not information.
    $keepEmpty = [bool](P $block 'keepEmpty' (-not $fixed))
    $sections = @($script:PaperSectionOrder | Where-Object { $keepEmpty -or $buckets[$_.key].Count -gt 0 })

    # With one section left there is nothing to choose between, so the chooser
    # is dropped and the papers are listed straight away. A page may also ask
    # for that directly with "chooser": false.
    $wantChooser = [bool](P $block 'chooser' $true)
    $useChooser = $wantChooser -and $sections.Count -gt 1

    $html = (SectionOpen $block 'section--library') + (SectionHead $block)

    if ($total -eq 0) {
        $html += '<div class="empty-state"><h3>Nothing has been published here yet</h3>'
        $html += '<p>A paper appears here only once it may lawfully be linked and its first page has been checked. '
        $html += 'You can <a href="' + (E (Url 'past-papers/')) + '">browse the whole paper library</a> or '
        $html += '<a href="' + (E (Url 'contact/')) + '">ask for a particular paper</a>.</p></div>'
        return $html + '</div></section>'
    }

    $singleAttr = ''
    if (-not $useChooser) { $singleAttr = ' data-single="all"' }
    $html += '<div class="paperlib" data-paperlib data-total="' + $total + '"' + $singleAttr + '>'

    # ---- the section chooser
    if ($useChooser) {
        $html += '<nav class="paperlib__nav" aria-label="Choose a grade or literature section">'
        $html += '<ul class="paperlib__tabs">'
        foreach ($s in $sections) {
            $n = $buckets[$s.key].Count
            $cls = 'paperlib__tab'
            if ($n -eq 0) { $cls += ' paperlib__tab--empty' }
            $countText = if ($n -eq 1) { '1 paper' } elseif ($n -eq 0) { 'None yet' } else { "$n papers" }
            $html += '<li><a class="' + $cls + '" href="#papers-' + (E $s.key) + '" data-section="' + (E $s.key) + '">'
            $html += '<span class="paperlib__tab-name">' + (E $s.label) + '</span>'
            $html += '<span class="paperlib__tab-count">' + (E $countText) + '</span></a></li>'
        }
        $html += '</ul></nav>'
    }

    # ---- the year filter, revealed by the script once a section is chosen
    $html += '<div class="paperlib__filter" data-paperlib-filter hidden>'
    $html += '<div class="paperlib__filter-head"><h3 data-paperlib-heading>All papers</h3>'
    $html += '<p class="paperlib__filter-count" data-paperlib-count>&nbsp;</p></div>'
    $html += '<div class="paperlib__filter-controls">'
    $html += '<div class="field"><label for="paperlib-year">Search by year</label>'
    $html += '<input type="search" id="paperlib-year" data-paperlib-year inputmode="numeric" autocomplete="off" placeholder="For example 2024"></div>'
    $html += '<div class="paperlib__years" data-paperlib-years role="group" aria-label="Jump to a year"></div>'
    $html += '<div class="paperlib__facets" data-paperlib-facets hidden></div>'
    $html += '<button type="button" class="btn btn--sm btn--outline" data-paperlib-clear hidden>Clear filters</button>'
    $html += '</div></div>'
    $html += '<p class="visually-hidden" role="status" aria-live="polite" data-paperlib-live></p>'

    # ---- what each panel holds. With a chooser that is one section each.
    #      Without one there is a single list, and it must hold every paper on
    #      the page, not merely the first section's - otherwise a Grade 10
    #      page would quietly drop its six literature papers.
    $panels = New-Object System.Collections.ArrayList
    if ($useChooser) {
        foreach ($s in $sections) {
            [void]$panels.Add(@{
                    key   = $s.key
                    label = $s.label
                    note  = $(if ($script:PaperSectionNote.ContainsKey($s.key)) { $script:PaperSectionNote[$s.key] } else { '' })
                    items = @($buckets[$s.key])
                })
        }
    }
    else {
        $merged = New-Object System.Collections.ArrayList
        foreach ($s in $sections) { foreach ($r in $buckets[$s.key]) { [void]$merged.Add($r) } }
        # "all", not the first section's key: an id of "papers-grade-1" on the
        # model-papers page would name a section that is not what the panel
        # holds, and would be a misleading anchor to link anyone to.
        [void]$panels.Add(@{
                key   = 'all'
                label = [string](P $block 'sectionLabel' (P $block 'heading' 'All papers'))
                note  = [string](P $block 'sectionNote' '')
                items = @($merged)
            })
    }

    # ---- the sections themselves, written into the page so they work and are
    #      indexed with the script switched off
    $html += '<div class="paperlib__panels" data-paperlib-panels>'
    foreach ($s in $panels) {
        $list = @($s.items)
        $html += '<section class="paperlib__panel" id="papers-' + (E $s.key) + '" data-panel="' + (E $s.key) + '" tabindex="-1">'
        $html += '<h3 class="paperlib__panel-title">' + (E $s.label) + '</h3>'
        if ($s.note) {
            $html += '<p class="paperlib__panel-note">' + (E $s.note) + '</p>'
        }

        if ($list.Count -eq 0) {
            $html += '<div class="empty-state"><h4>No ' + (E $s.label) + ' papers have been published yet</h4>'
            $html += '<p>This section is real and waiting. A paper appears here only once it may lawfully be linked and its first page has been checked. '
            $html += '<a href="' + (E (Url 'contact/')) + '">Ask for a ' + (E $s.label) + ' paper</a> and it moves up the queue.</p></div>'
            $html += '</section>'
            continue
        }

        # Newest year first; undated papers last, but present.
        $sorted = @($list | Sort-Object -Property @{ Expression = { PaperYearRank $_ }; Descending = $true },
                                                  @{ Expression = { [string](P $_ 'term' 'z') }; Descending = $true },
                                                  @{ Expression = { [string](P $_ 'title' '') } })
        $groups = @()
        $order = New-Object System.Collections.ArrayList
        $byYear = @{}
        foreach ($r in $sorted) {
            $y = ([string](P $r 'year' '')).Trim()
            if (-not $byYear.ContainsKey($y)) { $byYear[$y] = New-Object System.Collections.ArrayList; [void]$order.Add($y) }
            [void]$byYear[$y].Add($r)
        }

        foreach ($y in $order) {
            $items = @($byYear[$y])
            $label = if ($y) { $y } else { 'Year not specified' }
            $countText = if ($items.Count -eq 1) { '1 paper' } else { "$($items.Count) papers" }
            $html += '<div class="paperlib__year" data-year-group="' + (E $y) + '">'
            $html += '<h4 class="paperlib__year-head"><span>' + (E $label) + '</span><span class="paperlib__year-count">' + (E $countText) + '</span></h4>'
            $html += '<ul class="paper-cards">'
            foreach ($r in $items) { $html += (PaperCard $r) }
            $html += '</ul></div>'
        }

        # Shown by the script only when a typed year matches nothing here.
        $html += '<div class="empty-state paperlib__noyear" data-paperlib-noyear hidden>'
        $html += '<h4>No paper in ' + (E $s.label) + ' matches those choices</h4>'
        $html += '<p data-paperlib-noyear-text></p>'
        $html += '<p><button type="button" class="btn btn--sm btn--outline" data-paperlib-clear>Show every ' + (E $s.label) + ' paper</button></p></div>'
        $html += '</section>'
    }
    $html += '</div>'

    $html += '</div></div></section>'
    return $html
}

# A class with a real start date close at hand is marked and lifted to the top
# of the list. The date is kept machine-readable, separately from the words
# shown to a visitor, so the mark can expire by itself: an announcement for a
# class that started last month is worse than no announcement at all.
$script:ClassSoonDays = 60
function ClassDaysToStart($c) {
    $raw = [string](P $c 'startsOn' '')
    if (-not $raw) { return $null }
    $d = [datetime]::MinValue
    $ok = [datetime]::TryParseExact($raw, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$d)
    if (-not $ok) {
        [void]$script:Warnings.Add("classes.json: startsOn '$raw' for '$([string](P $c 'title'))' is not a yyyy-MM-dd date, so the class is not marked as starting soon")
        return $null
    }
    return [int]((($d.Date) - (Get-Date).Date).TotalDays)
}
function ClassIsStartingSoon($c) {
    $days = ClassDaysToStart $c
    if ($null -eq $days) { return $false }
    # A date already past, on a class still taking registrations, is a page
    # telling visitors something untrue. Say so at build time.
    if ($days -lt 0 -and [string](P $c 'registration') -eq 'open') {
        [void]$script:Warnings.Add("classes.json: '$([string](P $c 'title'))' started on $([string](P $c 'startsOn')) but registration is still 'open'")
    }
    return ($days -ge 0 -and $days -le $script:ClassSoonDays)
}

function ClassStatus($value) {
    $v = [string]$value
    switch ($v) {
        'open' { return @('open', 'Registration open') }
        'soon' { return @('soon', 'Registration opening soon') }
        'waitlist' { return @('waitlist', 'Waiting list') }
        'closed' { return @('closed', 'Registration closed') }
        default { return @('soon', 'Registration opening soon') }
    }
}

# --- What's New -------------------------------------------------------------
# The newest past-paper card is generated here from data/papers.json rather
# than written by hand, so adding a paper refreshes the home page by itself.
# Unpublished papers and unpublished resources can never reach this list.
function PaperUpdateEntry() {
    $live = @($papers | Where-Object { (P $_ 'published' $true) -ne $false })
    if ($live.Count -eq 0) { return $null }

    $dated = @($live | Where-Object { [string](P $_ 'year') -match '^\d{4}$' })
    if ($dated.Count -eq 0) { return $null }

    # Walk back from the newest year until the card can honestly say "grades",
    # so a year holding a single paper does not produce a thin card.
    $allYears = @($dated | ForEach-Object { [int](P $_ 'year') } | Sort-Object -Unique -Descending)
    $recent = @()
    $usedYears = @()
    foreach ($y in $allYears) {
        $recent += @($dated | Where-Object { [int](P $_ 'year') -eq $y })
        $usedYears += $y
        if ($recent.Count -ge 4 -and (@($recent | ForEach-Object { [string](P $_ 'grade') } | Sort-Object -Unique)).Count -ge 2) { break }
    }

    $grades = @($recent | ForEach-Object { [string](P $_ 'grade') } | Where-Object { $_ } | Sort-Object { [int]$_ } -Unique)
    if ($grades.Count -eq 0) { return $null }

    if ($grades.Count -eq 1) { $gradeText = "Grade $($grades[0])" }
    else {
        $last = $grades[-1]
        $head = $grades[0..($grades.Count - 2)] -join ', '
        $gradeText = "Grades $head and $last"
    }
    $count = $recent.Count
    $paperWord = if ($count -eq 1) { 'paper' } else { 'papers' }
    $newestYear = $usedYears[0]
    $yearText = if ($usedYears.Count -eq 1) { "$newestYear" } else { "$($usedYears[-1]) to $newestYear" }

    return [pscustomobject]@{
        id          = 'latest-papers'
        date        = (Get-Date).ToString('yyyy-MM-dd')
        title       = "New term-test papers, $yearText"
        description = "$count school term-test $paperWord for $gradeText, each linked from its original source and listed with the body that set it."
        url         = 'past-papers/'
        linkLabel   = 'Explore'
        published   = $true
    }
}

function RenderUpdates($block) {
    $limit = [int](P $block 'limit' 6)
    if ($limit -lt 1) { $limit = 6 }

    $list = @($updates | Where-Object { (P $_ 'published' $true) -ne $false })
    $generated = PaperUpdateEntry
    if ($null -ne $generated) { $list = @($generated) + $list }

    $list = @($list | Sort-Object { [string](P $_ 'date') } -Descending)
    if ($list.Count -eq 0) { return '' }

    # "New" means added in the last 90 days in real terms, measured from the
    # build date, so the label fades on its own if the site is left alone.
    $cutoff = (Get-Date).AddDays(-90)

    $shown = @($list | Select-Object -First $limit)

    $html = (SectionOpen $block) + (SectionHead $block)
    $html += '<ul class="updates" role="list">'
    foreach ($u in $shown) {
        $title = [string](P $u 'title')
        $url   = [string](P $u 'url')
        $label = [string](P $u 'linkLabel' 'Explore')
        $date  = [string](P $u 'date')

        $isNew = $true
        if ($null -ne $cutoff) {
            try { $isNew = ([datetime]$date) -ge $cutoff } catch { $isNew = $true }
        }

        $html += '<li class="update-card">'
        if ($isNew) { $html += '<p class="update-card__flag"><span class="update-flag">New</span></p>' }
        $html += '<h3 class="update-card__title"><a href="' + (E (Url $url)) + '">' + (E $title) + '</a></h3>'
        $html += '<p class="update-card__text">' + (Inline (P $u 'description')) + '</p>'
        $html += '<p class="update-card__more"><span class="more-link" aria-hidden="true">' + (E $label) + '</span></p>'
        $html += '</li>'
    }
    $html += '</ul>'

    $allUrl = P $block 'allUrl'
    if ($allUrl) {
        $allLabel = [string](P $block 'allLabel' 'View all updates')
        $html += '<p class="updates__all"><a class="btn btn--ghost" href="' + (E (Url ([string]$allUrl))) + '">' + (E $allLabel) + '</a></p>'
    }
    return $html + '</div></section>'
}

function RenderClasses($block) {
    $filterCourse = P $block 'course'
    $filterCourses = AsList (P $block 'courses')
    $filterFormat = P $block 'format'
    $filterDelivery = P $block 'delivery'
    $featuredOnly = (P $block 'featured') -eq $true
    # "feature" shows each course as its poster followed directly by its
    # details, one course under another, so a visitor can read everything on
    # the page instead of opening each course in turn. The default is the
    # compact grid of cards.
    $feature = ([string](P $block 'layout')) -eq 'feature'

    $list = @($classes | Where-Object { (P $_ 'published' $true) -ne $false })
    if ($filterCourse) { $list = @($list | Where-Object { [string](P $_ 'course') -eq [string]$filterCourse }) }
    if ($filterCourses.Count) {
        # Keep the order the page asks for, not the order of the data file.
        $ordered = @()
        foreach ($id in $filterCourses) { $ordered += @($list | Where-Object { [string](P $_ 'course') -eq [string]$id }) }
        $list = $ordered
    }
    if ($filterFormat) { $list = @($list | Where-Object { [string](P $_ 'groupFormat') -eq [string]$filterFormat }) }
    if ($filterDelivery) { $list = @($list | Where-Object { [string](P $_ 'delivery') -eq [string]$filterDelivery }) }
    if ($featuredOnly) { $list = @($list | Where-Object { (P $_ 'featured') -eq $true }) }

    # "starting" is the highlight at the top of the classes page: only the
    # classes about to begin. When none are, the whole section disappears
    # rather than announcing that there is nothing to announce.
    $startingOnly = (P $block 'starting') -eq $true
    if ($startingOnly) {
        $list = @($list | Where-Object { ClassIsStartingSoon $_ })
        if ($list.Count -eq 0) { return '' }
    }

    # A class about to begin is the one a visitor needs to see, so it comes
    # first, soonest first. A page that names its courses in a deliberate order
    # keeps that order: there the sequence is the point.
    if (-not $filterCourses.Count) {
        $soon = @($list | Where-Object { ClassIsStartingSoon $_ } | Sort-Object { ClassDaysToStart $_ })
        if ($soon.Count) { $list = @($soon) + @($list | Where-Object { -not (ClassIsStartingSoon $_) }) }
    }

    $limit = P $block 'limit'
    if ($limit) { $list = @($list | Select-Object -First ([int]$limit)) }

    $html = (SectionOpen $block) + (SectionHead $block)

    if ($list.Count -eq 0) {
        $html += '<div class="empty-state"><h3>No class of this kind is listed at the moment</h3>'
        $html += '<p>New classes are added to this page as they are arranged. Please ask on WhatsApp what is available.</p>'
        $msg = 'Hello, I would like to know which classes are running at the moment. Please send me the details.'
        $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<p class="mt-4"><a class="btn btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">Ask which classes are running</a></p></div>'
        return $html + '</div></section>'
    }

    $showPosters = (P $block 'posters') -eq $true
    $soonAttr = ''
    if ($startingOnly) { $soonAttr = ' data-starting-soon' }
    if ($feature) { $html += '<div class="class-features"' + $soonAttr + '>' } else { $html += '<div class="grid grid--3"' + $soonAttr + '>' }
    $shownPosters = @{}
    foreach ($c in $list) {
        $title = [string](P $c 'title')
        $status = ClassStatus (P $c 'registration')
        $img = [string](P $c 'image')

        # The start date travels with the card so the browser can retire the
        # mark on the right day. The site is plain files: nothing rebuilds it
        # at midnight, and the deploy only publishes what was built here.
        $startsAttr = ''
        $startsOn = [string](P $c 'startsOn' '')
        if ($startsOn) { $startsAttr = ' data-starts-on="' + (E $startsOn) + '"' }

        if ($feature) {
            $html += '<article class="class-feature"' + $startsAttr + '>'
            # Two courses can share one poster - O/L and A/L Literature do - and
            # the same poster twice in a row reads as a mistake, so it is shown
            # once, above the first course that uses it.
            if ($img -and -not $shownPosters.ContainsKey($img)) {
                $shownPosters[$img] = $true
                # Most posters are 16:9 banners. A standing poster made for
                # WhatsApp is taller than it is wide, and at the full width of
                # the card it would push everything else off the screen, so it
                # is capped and centred instead.
                $imgW = [int](P $c 'imageWidth' 1200)
                $imgH = [int](P $c 'imageHeight' 675)
                $shape = ''
                if ($imgH -gt $imgW) { $shape = ' class-feature__poster--portrait' }
                $html += '<figure class="class-feature__poster' + $shape + '"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $c 'imageAlt'))) + '" width="' + $imgW + '" height="' + $imgH + '" loading="lazy" decoding="async"></figure>'
            }
            $html += '<div class="card class-card class-feature__body">'
        }
        else {
            $html += '<article class="card class-card"' + $startsAttr + '>'
            # A compact card normally carries no artwork. Where a page asks for
            # posters it shows one, because a poster is what the teacher made to
            # be seen - a description of a poster is not the same thing.
            if ($showPosters -and $img) {
                $imgW = [int](P $c 'imageWidth' 1200)
                $imgH = [int](P $c 'imageHeight' 675)
                $shape = ''
                if ($imgH -gt $imgW) { $shape = ' class-card__poster--portrait' }
                $html += '<figure class="class-card__poster' + $shape + '"><img src="' + (E (Url $img)) + '" alt="' + (E ([string](P $c 'imageAlt'))) + '" width="' + $imgW + '" height="' + $imgH + '" loading="lazy" decoding="async"></figure>'
            }
        }

        $html += '<div class="tag-row">'
        if (ClassIsStartingSoon $c) { $html += '<span class="tag tag--new">Starting soon</span>' }
        $html += '<span class="class-card__status" data-status="' + $status[0] + '">' + (E $status[1]) + '</span>'
        if (P $c 'delivery') { $html += '<span class="tag tag--type">' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'delivery')))) + '</span>' }
        if (P $c 'groupFormat') { $html += '<span class="tag">' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'groupFormat')))) + '</span>' }
        $html += '</div><h3>' + (E $title) + '</h3>'
        $html += Paragraphs (P $c 'description')

        # A class may be taught by someone other than R. C. Fernando. Where a
        # qualification is given it follows the name, and where the teacher
        # has their own WhatsApp number that is the one shown for this class.
        $teacherLine = [string](P $c 'teacher')
        $teacherOf = [string](P $c 'teacherQualification' '')
        if ($teacherLine -and $teacherOf) { $teacherLine = $teacherLine + ', ' + $teacherOf }

        $html += '<dl class="class-facts">'
        $facts = @(
            @('Subject', (P $c 'subject')),
            @('Learner level', (P $c 'level')),
            @('Teacher', $teacherLine),
            @('For', (P $c 'audience')),
            @('Day', (P $c 'day')),
            @('Time', (P $c 'time')),
            @('Duration', (P $c 'duration')),
            @('Starts', (P $c 'startDate')),
            @('Location', (P $c 'location')),
            @('Fee', (P $c 'fee')),
            @('Places', (P $c 'places')),
            @('Language of instruction', (P $c 'language')),
            @('You will need', (P $c 'materials'))
        )
        foreach ($f in $facts) {
            if ($f[1]) { $html += '<div><dt>' + (E $f[0]) + '</dt><dd>' + (E $f[1]) + '</dd></div>' }
        }
        $html += '</dl>'

        # Places remaining: shown only when the number has been entered with the
        # date it was counted, and only while that count is recent (30 days).
        # An old number is worse than none, so it quietly disappears.
        $left = [string](P $c 'placesRemaining' '')
        $counted = [string](P $c 'placesUpdated' '')
        if ($left -match '^\d+$' -and $counted) {
            $countedDate = [datetime]::MinValue
            if ([datetime]::TryParseExact($counted, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$countedDate)) {
                $age = ((Get-Date).Date - $countedDate.Date).TotalDays
                if ($age -ge 0 -and $age -le 30) {
                    $n = [int]$left
                    $when = $countedDate.ToString('d MMMM yyyy', [Globalization.CultureInfo]::InvariantCulture)
                    if ($n -eq 0) { $html += '<p class="class-places class-places--full">This batch is full (as of ' + $when + '). Ask on WhatsApp about the next one.</p>' }
                    elseif ($n -le 3) { $html += '<p class="class-places class-places--few">Only ' + $n + ' ' + $(if ($n -eq 1) { 'place' } else { 'places' }) + ' remaining <span>(as of ' + $when + ')</span></p>' }
                    else { $html += '<p class="class-places">' + $n + ' places remaining <span>(as of ' + $when + ')</span></p>' }
                }
                else { [void]$script:Warnings.Add("classes.json: places for '$title' were counted on $counted, more than 30 days ago, so they are not shown") }
            }
        }

        # Testimonials: only real ones, entered in classes.json with the
        # person's permission. Nothing is shown when there are none.
        $quotes = @(); foreach ($tq in (AsList (P $c 'testimonials'))) { if ([string](P $tq 'quote')) { $quotes += $tq } }
        if ($quotes.Count) {
            $html += '<div class="class-quotes">'
            foreach ($q in $quotes) {
                $who = [string](P $q 'name' '')
                $detail = [string](P $q 'detail' '')
                $html += '<blockquote class="class-quote"><p>' + (E (P $q 'quote')) + '</p>'
                if ($who) { $html += '<footer>' + (E $who) + $(if ($detail) { ', ' + (E $detail) } else { '' }) + '</footer>' }
                $html += '</blockquote>'
            }
            $html += '</div>'
        }
        $msg = [string](P $c 'whatsappMessage' ("Hello, I would like information about $title. Please send me the schedule, fees and registration details."))
        # A class taught by another teacher uses that teacher's own number.
        $waNumber = [string](P $c 'whatsappInternational' $script:Config.whatsappInternational)
        $href = 'https://wa.me/' + $waNumber + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<div class="btn-row"><a class="btn btn--sm btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">Ask about this class</a>'
        $page = [string](P $c 'page')
        # The way through to the full details, shown wherever the card is not
        # already standing on that very page - a link to here, from here, is
        # only a dead end for whoever follows it.
        $onOwnPage = $page -and (($page.TrimEnd('/')) -eq ([string]$script:PageSlug).TrimEnd('/'))
        if ($page -and -not $onOwnPage) {
            $html += '<a class="btn btn--sm btn--outline" href="' + (E (Url $page)) + '">Full course page<span class="visually-hidden">: ' + (E $title) + '</span></a>'
        }
        $html += '</div>'
        if ($feature) { $html += '</div></article>' } else { $html += '</article>' }
    }
    $html += '</div>'
    # A single course page can be printed or saved as a PDF, as its brochure.
    if ($filterCourse) {
        $html += '<p class="print-page"><button type="button" class="btn btn--sm btn--outline" data-print>Print or save these course details</button></p>'
    }
    return $html + '</div></section>'
}

function RenderTimetable($block) {
    $list = @($classes | Where-Object { (P $_ 'published' $true) -ne $false })
    $html = (SectionOpen $block) + (SectionHead $block)

    $withTimes = @($list | Where-Object { (P $_ 'day') -or (P $_ 'time') })
    if ($withTimes.Count -eq 0) {
        $html += '<div class="callout callout--note"><p class="callout__title">Schedule to be announced</p>'
        $html += '<p class="mb-0">Class days and times have not been published yet. Ask on WhatsApp for the current timetable and you will be sent the details that apply to you.</p></div>'
        $msg = 'Hello, please send me the current class timetable.'
        $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<p class="mt-5"><a class="btn btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">Request the timetable</a></p>'
        return $html + '</div></section>'
    }

    # Wide screens: a table. Small screens: cards, so nothing is squeezed.
    $html += '<div class="timetable-table"><div class="table-wrap"><table class="data"><caption>Class timetable. Times are Sri Lanka time.</caption>'
    $html += '<thead><tr><th scope="col">Class</th><th scope="col">Day</th><th scope="col">Time</th><th scope="col">Format</th><th scope="col">Registration</th><th scope="col">Ask</th></tr></thead><tbody>'
    foreach ($c in $withTimes) {
        $title = [string](P $c 'title')
        $status = ClassStatus (P $c 'registration')
        $msg = [string](P $c 'whatsappMessage' ("Hello, I would like information about $title. Please send me the schedule, fees and registration details."))
        # A class taught by another teacher uses that teacher's own number.
        $waNumber = [string](P $c 'whatsappInternational' $script:Config.whatsappInternational)
        $href = 'https://wa.me/' + $waNumber + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<tr><th scope="row">' + (E $title) + '</th>'
        $html += '<td>' + (E (P $c 'day' 'To be announced')) + '</td>'
        $html += '<td>' + (E (P $c 'time' 'To be announced')) + '</td>'
        $html += '<td>' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'delivery' 'online')))) + '</td>'
        $html += '<td>' + (E $status[1]) + '</td>'
        $html += '<td><a href="' + (E $href) + '" target="_blank" rel="noopener">WhatsApp</a></td></tr>'
    }
    $html += '</tbody></table></div></div>'

    $html += '<div class="timetable-cards">'
    foreach ($c in $withTimes) {
        $title = [string](P $c 'title')
        $status = ClassStatus (P $c 'registration')
        $msg = [string](P $c 'whatsappMessage' ("Hello, I would like information about $title. Please send me the schedule, fees and registration details."))
        # A class taught by another teacher uses that teacher's own number.
        $waNumber = [string](P $c 'whatsappInternational' $script:Config.whatsappInternational)
        $href = 'https://wa.me/' + $waNumber + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<article class="card"><div class="tag-row"><span class="class-card__status" data-status="' + $status[0] + '">' + (E $status[1]) + '</span></div>'
        $html += '<h3>' + (E $title) + '</h3><dl class="class-facts">'
        $html += '<div><dt>Day</dt><dd>' + (E (P $c 'day' 'To be announced')) + '</dd></div>'
        $html += '<div><dt>Time</dt><dd>' + (E (P $c 'time' 'To be announced')) + '</dd></div>'
        $html += '<div><dt>Format</dt><dd>' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'delivery' 'online')))) + '</dd></div>'
        $html += '</dl><a class="btn btn--sm btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">Ask about this class</a></article>'
    }
    $html += '</div>'
    return $html + '</div></section>'
}

function RenderNotices($block) {
    $html = (SectionOpen $block) + (SectionHead $block)
    $list = @($notices | Where-Object { (P $_ 'published' $true) -ne $false })
    if ($list.Count -eq 0) {
        $html += '<div class="empty-state"><h3>There are no notices at the moment</h3>'
        $html += '<p>Class notices, changes of time and revision announcements will be posted here. Students already enrolled also receive them on WhatsApp.</p></div>'
        return $html + '</div></section>'
    }
    $html += '<div class="grid grid--2">'
    foreach ($n in $list) {
        $html += '<article class="card card--accent"><div class="tag-row"><span class="tag tag--year">' + (E (P $n 'date' '')) + '</span></div>'
        $html += '<h3>' + (E (P $n 'title')) + '</h3>'
        $html += Paragraphs (P $n 'text')
        $html += '</article>'
    }
    return $html + '</div></div></section>'
}

function RenderLiterature($block) {
    $genre = P $block 'genre'
    $level = P $block 'level'
    $list = @($literature | Where-Object { (P $_ 'published' $true) -ne $false })
    if ($genre) { $list = @($list | Where-Object { [string](P $_ 'genre') -eq [string]$genre }) }
    if ($level) { $list = @($list | Where-Object { [string](P $_ 'level') -eq [string]$level }) }

    $html = (SectionOpen $block) + (SectionHead $block)
    if ($list.Count -eq 0) {
        $html += '<div class="pending-note"><p class="mb-0"><strong>Texts are added here as they are prepared.</strong> Each text is set out in the same fifteen sections described above, so you always know where to look. Nothing is published for a text until the material has been written and checked, and no copyrighted text is reproduced in full.</p></div>'
        return $html + '</div></section>'
    }
    $html += '<div class="grid grid--3">'
    foreach ($t in $list) {
        $slug = [string](P $t 'slug')
        $html += '<article class="card card--link"><div class="tag-row">'
        if (P $t 'genre') { $html += '<span class="tag tag--type">' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $t 'genre')))) + '</span>' }
        if (P $t 'level') { $html += '<span class="tag tag--level">' + (E (P $t 'level')) + '</span>' }
        $html += '</div><h3><a href="' + (E (Url $slug)) + '">' + (E (P $t 'title')) + '</a></h3>'
        if (P $t 'author') { $html += '<p><strong>By ' + (E (P $t 'author')) + '</strong></p>' }
        $html += Paragraphs (P $t 'summary')
        $html += '<span class="card__more" aria-hidden="true">Study this text</span></article>'
    }
    return $html + '</div></div></section>'
}

function RenderSearchBlock($block) {
    $html = (SectionOpen $block) + (SectionHead $block)
    $html += '<form class="toolbar" id="site-search-form" role="search"><div class="toolbar__row">'
    $html += '<div class="field"><label for="site-search-input">What are you looking for?</label>'
    $html += '<input type="search" id="site-search-input" name="q" placeholder="For example: guided writing, notice, past paper, Grade 11" autocomplete="off"></div>'
    $html += '<div class="filters"><div class="field"><label for="search-kind">Kind of result</label><select id="search-kind">'
    $html += '<option value="">Everything</option>'
    foreach ($k in @(
            @('page', 'Pages and lessons'), @('past-paper', 'Past papers'), @('model-paper', 'Model papers'),
            @('marking-scheme', 'Marking schemes'), @('model-answer', 'Model answers'), @('worksheet', 'Worksheets'),
            @('teacher-resource', 'Teacher resources'), @('quiz', 'Interactive activities'),
            @('literature-text', 'Literature texts'), @('class', 'Academy courses'), @('guidance', 'Examination guidance')
        )) {
        $html += '<option value="' + $k[0] + '">' + $k[1] + '</option>'
    }
    $html += '</select></div>'

    # Paper filters. Their options come from data/papers.json itself, so a
    # filter can never offer a value that no paper has, and adding a paper for
    # a new grade or province makes that option appear on its own.
    $gradeOpts = @($papers | ForEach-Object { [string](P $_ 'grade' '') } | Where-Object { $_ } |
        Select-Object -Unique | Sort-Object { [int]$_ })
    $yearOpts = @($papers | ForEach-Object { [string](P $_ 'year' '') } | Where-Object { $_ } |
        Select-Object -Unique | Sort-Object -Descending)
    $provOpts = @($papers | ForEach-Object { [string](P $_ 'province' '') } | Where-Object { $_ } |
        Select-Object -Unique | Sort-Object)
    $html += '<div class="field"><label for="search-grade">Grade</label><select id="search-grade"><option value="">Any grade</option>'
    foreach ($g in $gradeOpts) { $html += '<option value="' + (E $g) + '">Grade ' + (E $g) + '</option>' }
    $html += '</select></div>'
    $html += '<div class="field"><label for="search-term">Term</label><select id="search-term"><option value="">Any term</option>'
    foreach ($t in @(@('first', 'First term'), @('second', 'Second term'), @('third', 'Third term'))) {
        $html += '<option value="' + $t[0] + '">' + $t[1] + '</option>'
    }
    $html += '</select></div>'
    $html += '<div class="field"><label for="search-year">Year</label><select id="search-year"><option value="">Any year</option>'
    foreach ($y in $yearOpts) { $html += '<option value="' + (E $y) + '">' + (E $y) + '</option>' }
    $html += '</select></div>'
    $html += '<div class="field"><label for="search-province">Province or zone</label><select id="search-province"><option value="">Anywhere</option>'
    foreach ($p in $provOpts) { $html += '<option value="' + (E $p) + '">' + (E $p) + '</option>' }
    $html += '</select></div>'
    $html += '</div>'
    $html += '<div class="btn-row"><button type="submit" class="btn btn--accent">Search</button>'
    $html += '<button type="button" class="btn btn--outline" id="search-reset">Reset</button></div>'
    $html += '</div></form>'
    $html += '<div class="results-bar" id="search-summary" hidden><p class="results-count" id="search-count"></p>'
    $html += '<p class="text-small text-muted mb-0">Every result says what kind of thing it is.</p></div>'
    $html += '<p class="visually-hidden" role="status" aria-live="polite" id="search-live"></p>'
    $html += '<div id="search-results"></div>'
    $html += '<noscript><div class="noscript-note"><p class="mb-0">Search needs JavaScript. Without it, please use the menu at the top of the page, or the <a href="' + (E (Url 'how-to-use/')) + '">How to Use This Site</a> page, which lists every section.</p></div></noscript>'
    return $html + '</div></section>'
}

function RenderForm($block) {
    $mode = [string](P $block 'mode' 'whatsapp')
    $subject = [string](P $block 'subject' 'Message from the RCF English website')
    $formId = 'form-' + (Slugify $subject)
    $html = (SectionOpen $block) + (SectionHead $block)
    $html += '<div class="callout callout--note"><p class="callout__title">How this form works</p><p class="mb-0">'
    if ($mode -eq 'email') {
        $html += 'This website has no server, so nothing is sent from here. The form writes your message and opens it in your own email program, where you press send yourself.'
    }
    else {
        $html += 'This website has no server, so nothing is sent from here. The form writes your message and opens it in WhatsApp, where you press send yourself.'
    }
    $html += '</p></div>'
    $html += '<form class="toolbar mt-5" id="' + $formId + '" data-message-form data-mode="' + (E $mode) + '" data-subject="' + (E $subject) + '"><div class="toolbar__row">'

    foreach ($f in (AsList (P $block 'fields'))) {
        $name = [string](P $f 'name')
        $id = $formId + '-' + (Slugify $name)
        $type = [string](P $f 'type' 'text')
        $required = ''
        $star = ''
        if ((P $f 'required') -eq $true) { $required = ' data-required'; $star = ' <span class="text-small text-muted">(required)</span>' }
        $html += '<div class="field"><label for="' + $id + '">' + (E $name) + $star + '</label>'
        if ($type -eq 'textarea') {
            $html += '<textarea id="' + $id + '" data-field="' + (E $name) + '"' + $required + '></textarea>'
        }
        elseif ($type -eq 'select') {
            $html += '<select id="' + $id + '" data-field="' + (E $name) + '"' + $required + '><option value="">Please choose&hellip;</option>'
            foreach ($o in (AsList (P $f 'options'))) { $html += '<option value="' + (E $o) + '">' + (E $o) + '</option>' }
            $html += '</select>'
        }
        else {
            $html += '<input type="' + (E $type) + '" id="' + $id + '" data-field="' + (E $name) + '"' + $required + '>'
        }
        $hint = P $f 'hint'
        if ($hint) { $html += '<span class="hint">' + (Inline $hint) + '</span>' }
        $html += '</div>'
    }

    $buttonLabel = if ($mode -eq 'email') { 'Write this in my email program' } else { 'Write this in WhatsApp' }
    $html += '<div class="btn-row"><button type="submit" class="btn btn--accent">' + $buttonLabel + '</button></div>'
    $html += '</div></form>'
    $html += '<noscript><div class="noscript-note mt-5"><p class="mb-0">This form needs JavaScript to write your message. Without it, please write to us directly on WhatsApp <strong>' + (E $script:Config.whatsappDisplay) + '</strong> or by email at <a href="mailto:' + (E $script:Config.email) + '">' + (E $script:Config.email) + '</a>.</p></div></noscript>'
    return $html + '</div></section>'
}

# ============================================================ page writing ==

# An open book for the right-hand column of the home hero. It is decoration
# and nothing else: every word on it is said properly elsewhere on the page,
# so it is hidden from assistive technology, it is not printed, and the
# stylesheet keeps it out of the way below 980px where the hero is a single
# column. The animation lives in assets/js/herobook.js and only starts if the
# visitor has not asked for reduced motion.
#
# Pages are given in reading order. The first is the left page of the opening
# spread, the last is the right page of the closing spread, and the pages in
# between pair up into leaves: each leaf carries the page a reader sees before
# the turn on its front and the page they see afterwards on its back.
function BookSheet($pg, $extra) {
    $h = '<div class="hbook__sheet' + $extra + '">'
    $t = [string](P $pg 'title')
    if ($t) { $h += '<span class="hbook__title">' + (E $t) + '</span>' }
    $lines = AsList (P $pg 'lines')
    if ($lines.Count) {
        $h += '<span class="hbook__rule"></span><span class="hbook__lines">'
        foreach ($l in $lines) { $h += '<span>' + (E $l) + '</span>' }
        $h += '</span>'
    }
    return $h + '</div>'
}

# The hand that opens the book.
#
# One hand, not two: a second hand has nothing to do but sit there, and a hand
# with nothing to do reads as a sticker rather than as somebody opening a book.
# This one comes in from the right, takes the edge of the cover and carries it
# across, which is the movement a person actually makes.
#
# It is drawn out of rounded rectangles rather than freehand curves, because at
# this size four separate fingers are the only thing that makes a shape read as
# a hand at all. Anything more detailed turns into a smudge.
function BookHands() {
    $h = '<div class="hbook__hands" data-hbook-hands aria-hidden="true">'
    $h += '<svg class="hbook__hand" viewBox="0 0 140 120" focusable="false" aria-hidden="true">'
    $h += '<rect class="hbook__arm"    x="92" y="50" width="52" height="42" rx="19"/>'
    $h += '<rect class="hbook__palm"   x="44" y="42" width="54" height="54" rx="19"/>'
    $h += '<rect class="hbook__thumb"  x="50" y="24" width="13" height="32" rx="6.5" transform="rotate(-24 56 40)"/>'
    $h += '<rect class="hbook__finger" x="17" y="45" width="40" height="12" rx="6"/>'
    $h += '<rect class="hbook__finger" x="12" y="58" width="45" height="12.5" rx="6.25"/>'
    $h += '<rect class="hbook__finger" x="15" y="71" width="42" height="12" rx="6"/>'
    $h += '<rect class="hbook__finger" x="23" y="83" width="34" height="11" rx="5.5"/>'
    $h += '</svg>'
    return $h + '</div>'
}

function HeroBook($fig) {
    $pages = AsList (P $fig 'pages')
    if ($pages.Count -lt 4 -or ($pages.Count % 2) -ne 0) {
        [void]$script:Warnings.Add("The hero book on page '$($script:PageSlug)' needs an even number of pages, at least four, but has $($pages.Count). It was left out.")
        return ''
    }
    $leaves = ($pages.Count - 2) / 2

    $cover = P $fig 'cover'
    $imprint = [string](P $cover 'imprint' $script:Config.publicationsName)
    $covTitle = [string](P $cover 'title' $script:Config.siteName)
    $covLine = [string](P $cover 'line' $script:Config.tagline)

    # The book starts closed. The script opens it and then takes the class off
    # again; if the script never runs, the stylesheet has the open book as its
    # resting state and nothing is ever hidden.
    $h = '<div class="hbook" data-hbook aria-hidden="true">'
    $h += '<div class="hbook__scene">'
    $h += '<div class="hbook__float">'
    $h += '<div class="hbook__book" data-hbook-book>'

    # The two boards. The left one is only there once the book is open.
    $h += '<span class="hbook__cover hbook__cover--left"></span>'
    $h += '<span class="hbook__cover hbook__cover--right"></span>'

    # The last page, uncovered when every leaf has turned.
    $h += '<div class="hbook__page hbook__page--recto">' + (BookSheet $pages[$pages.Count - 1] ' hbook__sheet--recto') + '</div>'

    # The leaves, stacked with the first on top. Each sits a fraction of a
    # pixel above the one below so the browser has a real depth order to sort
    # by rather than two pages in the same plane. Because the translate comes
    # after the rotation, a leaf that has turned lands underneath the leaves
    # that turned before it, which is what paper does.
    for ($i = 0; $i -lt $leaves; $i++) {
        $front = $pages[(2 * $i) + 1]
        $back  = $pages[(2 * $i) + 2]
        $z = [math]::Round(($leaves - $i) * 0.6, 2)
        $h += '<div class="hbook__leaf" data-hbook-leaf style="--z:' + $z + 'px">'
        $h += '<div class="hbook__side hbook__side--front">' + (BookSheet $front ' hbook__sheet--recto') + '</div>'
        $h += '<div class="hbook__side hbook__side--back">' + (BookSheet $back ' hbook__sheet--verso') + '</div>'
        $h += '</div>'
    }

    # The front board is hinged like a leaf: the jacket on the outside and the
    # first page on the inside, so opening the cover is the same movement as
    # turning a page and lands the reader on the opening spread.
    $bz = [math]::Round(($leaves + 1) * 0.6, 2)
    $h += '<div class="hbook__board" data-hbook-board style="--z:' + $bz + 'px">'
    $h += '<div class="hbook__side hbook__side--front"><div class="hbook__jacket">'
    if ($imprint) { $h += '<span class="hbook__imprint">' + (E $imprint) + '</span>' }
    $h += '<span class="hbook__jackettitle">' + (E $covTitle) + '</span>'
    $h += '<span class="hbook__rule"></span>'
    if ($covLine) { $h += '<span class="hbook__jacketline">' + (E $covLine) + '</span>' }
    $h += '</div></div>'
    $h += '<div class="hbook__side hbook__side--back">' + (BookSheet $pages[0] ' hbook__sheet--verso') + '</div>'
    $h += '</div>'

    $h += '<span class="hbook__ribbon"></span>'
    $h += '</div></div>'
    $h += '<span class="hbook__shadow"></span>'
    $h += (BookHands)
    $h += '</div></div>'
    return $h
}

function HeroSection($page) {
    $hero = P $page 'hero'
    if (-not $hero) { return '' }
    $style = [string](P $hero 'style' 'page')

    if ($style -eq 'home') {
        # Two columns on a wide screen so the right-hand side is not left empty,
        # one column on anything narrower.
        $html = '<section class="hero"><div class="container hero__inner">'
        $html += '<div class="hero__main">'
        $html += '<h1>' + (E (P $page 'title')) + '</h1>'
        $html += '<p class="hero__tagline">' + (E $script:Config.tagline) + '</p>'
        $html += '<p class="hero__text">' + (Inline (P $hero 'text')) + '</p>'
        $html += '<div class="btn-row btn-row--even">'
        foreach ($b in (AsList (P $hero 'buttons'))) {
            $target = [string](P $b 'url')
            $cls = 'btn ' + [string](P $b 'style' 'btn--accent')
            $e = ''
            if (IsExternal $target) { $e = ' target="_blank" rel="noopener"'; $cls += ' ext' }
            if ((IsPub $target) -and -not (PubIsLive)) {
                # No bookshop address yet. On the page that explains the
                # bookshop this becomes a plain marker; anywhere else it leads
                # to that page rather than to nothing.
                if ($script:PageSlug -eq $script:PubFallback.Trim('/')) {
                    $html += '<span class="btn btn--soon" aria-disabled="true">' + (E $script:Config.publicationsName) + ' &mdash; coming soon</span>'
                }
                else {
                    $html += '<a class="btn ' + [string](P $b 'style' 'btn--accent') + '" href="' + (E (Url $script:PubFallback)) + '">' + (E (P $b 'label')) + ' <span class="badge-soon">Coming soon</span></a>'
                }
            }
            else {
                $html += '<a class="' + $cls + '" href="' + (E (Url $target)) + '"' + $e + '>' + (E (P $b 'label')) + '</a>'
            }
        }
        $html += '</div>'
        $note = P $hero 'note'
        if ($note) { $html += '<p class="hero__note">' + (Inline $note) + '</p>' }
        $html += '</div>'

        # The right-hand column. The hero grid has two columns, so the book and
        # the aside have to be handed to it as one child or the second of them
        # drops onto a row of its own.
        $figHtml = ''
        $figure = P $hero 'figure'
        if ($figure -and ([string](P $figure 'type')) -eq 'book') { $figHtml = HeroBook $figure }

        $asideHtml = ''
        $aside = P $hero 'aside'
        if ($aside) {
            $asideHtml = '<aside class="hero__aside" aria-labelledby="hero-aside-title">'
            $asideHtml += '<h2 class="hero__aside-title" id="hero-aside-title">' + (E (P $aside 'title')) + '</h2><ul>'
            foreach ($i in (AsList (P $aside 'items'))) { $asideHtml += '<li>' + (Inline $i) + '</li>' }
            $asideHtml += '</ul>'
            $foot = P $aside 'footnote'
            if ($foot) { $asideHtml += '<p class="hero__aside-foot">' + (Inline $foot) + '</p>' }
            $asideHtml += '</aside>'
        }

        if ($figHtml -and $asideHtml) { $html += '<div class="hero__side">' + $figHtml + $asideHtml + '</div>' }
        else { $html += $figHtml + $asideHtml }

        return $html + '</div></section>'
    }

    $html = '<section class="page-hero"><div class="container">'
    $kicker = P $page 'kicker'
    if ($kicker) { $html += '<span class="page-hero__kicker">' + (E $kicker) + '</span>' }
    $html += '<h1>' + (E (P $page 'title')) + '</h1>'
    $text = P $hero 'text'
    if ($text) { $html += '<p>' + (Inline $text) + '</p>' }
    # Topic tags: what the page is about, in the words people search with.
    # They are shown, not hidden - a tag nobody can see is keyword stuffing -
    # and the same words go into the structured data below.
    $tags = AsList (P $page 'tags')
    if ($tags.Count) {
        $html += '<ul class="page-hero__tags" aria-label="Topics">'
        foreach ($t in $tags) { $html += '<li>' + (E $t) + '</li>' }
        $html += '</ul>'
    }
    $buttons = AsList (P $hero 'buttons')
    if ($buttons.Count) {
        $html += '<div class="btn-row">'
        foreach ($b in $buttons) {
            $target = [string](P $b 'url')
            $cls = 'btn ' + [string](P $b 'style' 'btn--ghost-light')
            $e = ''
            if (IsExternal $target) { $e = ' target="_blank" rel="noopener"'; $cls += ' ext' }
            if ((IsPub $target) -and -not (PubIsLive)) {
                if ($script:PageSlug -eq $script:PubFallback.Trim('/')) {
                    $html += '<span class="btn btn--soon" aria-disabled="true">' + (E $script:Config.publicationsName) + ' &mdash; coming soon</span>'
                }
                else {
                    $html += '<a class="' + $cls + '" href="' + (E (Url $script:PubFallback)) + '">' + (E (P $b 'label')) + ' <span class="badge-soon">Coming soon</span></a>'
                }
            }
            else {
                $html += '<a class="' + $cls + '" href="' + (E (Url $target)) + '"' + $e + '>' + (E (P $b 'label')) + '</a>'
            }
        }
        $html += '</div>'
    }
    return $html + '</div></section>'
}

function StructuredData($page, $canonical) {
    $kind = [string](P $page 'schema' 'WebPage')
    $name = [string](P $page 'title')
    $desc = [string](P $page 'description')
    $siteUrl = $script:Config.siteUrl.TrimEnd('/') + '/'

    $blocks = @()

    if ($kind -eq 'EducationalOrganization') {
        $blocks += @"
{"@context":"https://schema.org","@type":"EducationalOrganization","name":$(JsonString $script:Config.siteName),"alternateName":"RCF English educational platform","url":$(JsonString $siteUrl),"slogan":$(JsonString $script:Config.tagline),"description":$(JsonString $desc),"founder":{"@type":"Person","name":$(JsonString $script:Config.founderName)},"address":{"@type":"PostalAddress","addressCountry":"LK"},"areaServed":"LK","contactPoint":{"@type":"ContactPoint","contactType":"educational support","telephone":"+$($script:Config.whatsappInternational)","email":$(JsonString $script:Config.email),"availableLanguage":["en"]}}
"@
    }
    elseif ($kind -eq 'LearningResource') {
        $level = [string](P $page 'educationalLevel' '')
        # The page's visible topic tags, and - for a page that summarises
        # someone else's article - the article it is based on, credited to
        # its real author and publisher.
        $extra = ''
        $tagList = @(); foreach ($t in (AsList (P $page 'tags'))) { $tagList += [string]$t }
        if ($tagList.Count) { $extra += ',"keywords":' + (JsonString ($tagList -join ', ')) }
        # International teaching material: the CEFR level as an educational
        # alignment, the lesson's length, what it teaches and who it is for -
        # the fields teachers' search tools and Google read for learning
        # resources. Each is written only when the page states it.
        $cefr = [string](P $page 'cefr' '')
        if ($cefr) {
            $extra += ',"educationalAlignment":{"@type":"AlignmentObject","alignmentType":"educationalLevel","educationalFramework":"Common European Framework of Reference for Languages (CEFR)","targetName":' + (JsonString $cefr) + '}'
        }
        $timeRequired = [string](P $page 'timeRequired' '')
        if ($timeRequired) { $extra += ',"timeRequired":' + (JsonString $timeRequired) }
        $teaches = [string](P $page 'teaches' '')
        if ($teaches) { $extra += ',"teaches":' + (JsonString $teaches) }
        $role = [string](P $page 'audienceRole' '')
        if ($role) { $extra += ',"audience":{"@type":"EducationalAudience","educationalRole":' + (JsonString $role) + '}' }
        $basis = P $page 'basedOn'
        if ($basis) {
            $authors = @(); foreach ($a in (AsList (P $basis 'authors'))) { $authors += '{"@type":"Person","name":' + (JsonString ([string]$a)) + '}' }
            $extra += ',"isBasedOn":{"@type":"ScholarlyArticle","name":' + (JsonString ([string](P $basis 'title'))) + ',"url":' + (JsonString ([string](P $basis 'url')))
            if ($authors.Count) { $extra += ',"author":[' + ($authors -join ',') + ']' }
            $extra += ',"isPartOf":{"@type":"Periodical","name":' + (JsonString ([string](P $basis 'journal'))) + '},"publisher":{"@type":"GovernmentOrganization","name":' + (JsonString ([string](P $basis 'publisher'))) + '},"datePublished":' + (JsonString ([string](P $basis 'year'))) + '}'
        }
        $blocks += @"
{"@context":"https://schema.org","@type":"LearningResource","name":$(JsonString $name),"description":$(JsonString $desc),"url":$(JsonString $canonical),"inLanguage":"en","learningResourceType":$(JsonString (P $page 'resourceType' 'lesson')),"educationalLevel":$(JsonString $level),"isAccessibleForFree":true$extra,"provider":{"@type":"EducationalOrganization","name":$(JsonString $script:Config.siteName),"url":$(JsonString $siteUrl)}}
"@
    }
    elseif ($kind -eq 'Course') {
        $blocks += @"
{"@context":"https://schema.org","@type":"Course","name":$(JsonString $name),"description":$(JsonString $desc),"url":$(JsonString $canonical),"inLanguage":"en","provider":{"@type":"EducationalOrganization","name":"RCF Online Academy","url":$(JsonString $siteUrl)}}
"@
    }
    elseif ($kind -eq 'Article') {
        $blocks += @"
{"@context":"https://schema.org","@type":"Article","headline":$(JsonString $name),"description":$(JsonString $desc),"url":$(JsonString $canonical),"inLanguage":"en","author":{"@type":"Person","name":$(JsonString $script:Config.founderName)},"publisher":{"@type":"Organization","name":$(JsonString $script:Config.siteName)}}
"@
    }
    else {
        $blocks += @"
{"@context":"https://schema.org","@type":"WebPage","name":$(JsonString $name),"description":$(JsonString $desc),"url":$(JsonString $canonical),"inLanguage":"en","isPartOf":{"@type":"WebSite","name":$(JsonString $script:Config.siteName),"url":$(JsonString $siteUrl)}}
"@
    }

    # Breadcrumb trail
    $trail = AsList (P $page 'breadcrumbs')
    $items = @('{"@type":"ListItem","position":1,"name":"Home","item":' + (JsonString $siteUrl) + '}')
    $pos = 2
    foreach ($crumb in $trail) {
        $u = $siteUrl + ([string](P $crumb 'url')).TrimStart('/')
        $items += '{"@type":"ListItem","position":' + $pos + ',"name":' + (JsonString (P $crumb 'label')) + ',"item":' + (JsonString $u) + '}'
        $pos++
    }
    if ($page._slug -ne '') {
        $items += '{"@type":"ListItem","position":' + $pos + ',"name":' + (JsonString $name) + ',"item":' + (JsonString $canonical) + '}'
        $blocks += '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + ($items -join ',') + ']}'
    }

    # FAQ pages
    if ($script:FaqEntries -and $script:FaqEntries.Count -gt 0) {
        $qa = @()
        foreach ($entry in $script:FaqEntries) {
            $qa += '{"@type":"Question","name":' + (JsonString $entry.Q) + ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonString $entry.A) + '}}'
        }
        $blocks += '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[' + ($qa -join ',') + ']}'
    }

    $out = ''
    foreach ($b in $blocks) {
        $out += '<script type="application/ld+json">' + ($b.Trim()) + '</script>'
    }
    return $out
}

function BuildPage($page) {
    $slug = $page._slug
    $script:PageSlug = $slug
    $script:PageBlocks = AsList (P $page 'blocks')
    if ((P $page 'flat') -eq $true) { $script:Root = '' } else { $script:Root = RootFor $slug }
    # The 404 page is served in place of any address, so its links must be
    # absolute - a relative link would be resolved against the missing address.
    if ((P $page 'absoluteLinks') -eq $true) { $script:Root = $script:Config.siteUrl.TrimEnd('/') + '/' }
    # A compatibility page: the address still works, but the content has
    # moved. GitHub Pages cannot issue a 301, so the canonical tag carries
    # the ranking, the refresh moves a browser, and the visible link works
    # without JavaScript and for anyone who lands mid-transfer.
    if ([string](P $page "kind") -eq "redirect") {
        $to = [string](P $page "redirectTo")
        $abs = $script:Config.siteUrl.TrimEnd("/") + "/" + $to
        $t   = [string](P $page "title")
        $h  = "<!doctype html><html lang=`"en`"><head><meta charset=`"utf-8`">"
        $h += "<meta name=`"viewport`" content=`"width=device-width, initial-scale=1`">"
        $h += "<title>" + (E $t) + " has moved | " + (E $script:Config.siteName) + "</title>"
        $h += "<link rel=`"canonical`" href=`"" + (E $abs) + "`">"
        $h += "<meta name=`"robots`" content=`"noindex, follow`">"
        $h += "<meta http-equiv=`"refresh`" content=`"0; url=" + (E $abs) + "`">"
        $h += "<style>body{font:16px/1.6 system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;"
        $h += "margin:0;padding:3rem 1.25rem;max-width:34rem;color:#12263f}a{color:#25497a}</style>"
        $h += "</head><body><h1>This page has moved</h1>"
        $h += "<p>&ldquo;" + (E $t) + "&rdquo; is now at a new address.</p>"
        $h += "<p><a href=`"" + (E $abs) + "`">Go to " + (E $t) + "</a></p>"
        $h += "</body></html>"
        $dir = Join-Path $ProjectRoot ($slug -replace "/", "\")
        if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory -Path $dir -Force) }
        [System.IO.File]::WriteAllText((Join-Path $dir "index.html"), $h, $utf8)
        return (Join-Path $dir "index.html")
    }

    $script:FaqEntries = New-Object System.Collections.ArrayList

    $title = [string](P $page 'title')
    # Every page needs its own title. Several sections legitimately contain a
    # page called "Model Answers" or "Syllabus", so the section name is folded
    # into the title to keep each one distinct for search engines and for
    # anyone reading a list of browser tabs.
    $metaTitle = [string](P $page 'metaTitle' '')
    if (-not $metaTitle) {
        if ($slug -eq '') {
            $metaTitle = "$($script:Config.siteName) | $($script:Config.shortDescription)"
        }
        else {
            $kicker = [string](P $page 'kicker' '')
            if ($kicker -and $kicker -ne $title) { $metaTitle = "$title | $kicker | $($script:Config.siteName)" }
            else { $metaTitle = "$title | $($script:Config.siteName)" }
        }
    }
    $description = [string](P $page 'description' $script:Config.shortDescription)
    $canonical = $script:Config.siteUrl.TrimEnd('/') + '/'
    if ($slug -ne '') { $canonical += $slug + '/' }

    # Body first, so blocks can collect FAQ entries before the head is written.
    # "topBlocks" is for the rare band that has to sit above the hero rather
    # than below it. Pages without one are untouched.
    $body = ''
    $body += RenderBlocks (P $page 'topBlocks')
    $body += HeroSection $page
    $body += Breadcrumbs $page
    $body += RenderBlocks (P $page 'blocks')

    $backTo = P $page 'backTo'
    if ($backTo) {
        $body += '<section class="section"><div class="container"><a class="back-link" href="' + (E (Url (P $backTo 'url'))) + '">Back to ' + (E (P $backTo 'label')) + '</a></div></section>'
    }

    $head = ''
    $head += '<meta charset="utf-8">'
    $head += '<meta name="viewport" content="width=device-width, initial-scale=1">'
    # GitHub Pages cannot send security headers, so the policy travels inside
    # the page. It must come before any script. See SecurityPolicy below.
    $head += '<meta http-equiv="Content-Security-Policy" content="' + (E $script:CspContent) + '">'
    $head += '<meta name="referrer" content="strict-origin-when-cross-origin">'
    $head += '<title>' + (E $metaTitle) + '</title>'
    $head += '<meta name="description" content="' + (E $description) + '">'
    $head += '<link rel="canonical" href="' + (E $canonical) + '">'
    $head += '<meta name="theme-color" content="' + (E $script:Config.themeColor) + '">'
    $head += '<meta name="author" content="' + (E $script:Config.founderName) + '">'
    $keywords = P $page 'keywords'
    if ($keywords) { $head += '<meta name="keywords" content="' + (E $keywords) + '">' }
    if ((P $page 'noindex') -eq $true) { $head += '<meta name="robots" content="noindex, follow">' }
    # What Facebook, WhatsApp and LinkedIn show when the page is shared. A
    # page may override the wording and the picture with ogTitle,
    # ogDescription, ogImage and ogImageAlt without touching what the browser
    # tab and the search snippet say. Pages that set none of them are
    # unchanged. Sharing sites need a full address for the picture, never a
    # relative path, so ogImage is written out against siteUrl.
    $ogTitle = [string](P $page 'ogTitle' $metaTitle)
    $ogDescription = [string](P $page 'ogDescription' $description)
    $ogImagePath = [string](P $page 'ogImage' 'assets/img/social/og-image.png')
    $ogImage = $script:Config.siteUrl.TrimEnd('/') + '/' + $ogImagePath.TrimStart('/')
    $ogImageAlt = [string](P $page 'ogImageAlt' 'RCF English - clear English lessons and practical revision resources')

    $head += '<meta property="og:type" content="website">'
    $head += '<meta property="og:site_name" content="' + (E $script:Config.siteName) + '">'
    $head += '<meta property="og:locale" content="' + (E $script:Config.locale) + '">'
    $head += '<meta property="og:title" content="' + (E $ogTitle) + '">'
    $head += '<meta property="og:description" content="' + (E $ogDescription) + '">'
    $head += '<meta property="og:url" content="' + (E $canonical) + '">'
    $head += '<meta property="og:image" content="' + (E $ogImage) + '">'
    $head += '<meta property="og:image:secure_url" content="' + (E $ogImage) + '">'
    $head += '<meta property="og:image:type" content="image/png">'
    $head += '<meta property="og:image:width" content="1200">'
    $head += '<meta property="og:image:height" content="630">'
    $head += '<meta property="og:image:alt" content="' + (E $ogImageAlt) + '">'
    $head += '<meta name="twitter:card" content="summary_large_image">'
    $head += '<meta name="twitter:title" content="' + (E $ogTitle) + '">'
    $head += '<meta name="twitter:description" content="' + (E $ogDescription) + '">'
    $head += '<meta name="twitter:image" content="' + (E $ogImage) + '">'
    $head += '<meta name="twitter:image:alt" content="' + (E $ogImageAlt) + '">'
    $head += '<link rel="icon" href="' + (E ($script:Root + 'assets/img/icons/favicon.svg')) + '" type="image/svg+xml">'
    $head += '<link rel="apple-touch-icon" href="' + (E ($script:Root + 'assets/img/icons/apple-touch-icon.png')) + '">'
    # The short label shown under the icon when an iPhone or iPad user chooses
    # Share, then Add to Home Screen. Without it, iOS uses the long page title.
    $head += '<meta name="apple-mobile-web-app-title" content="' + (E $script:Config.siteName) + '">'
    $head += '<link rel="manifest" href="' + (E ($script:Root + 'manifest.webmanifest')) + '">'
    # Styles and scripts carry ?v=<content hash>, so a changed file has a new
    # address and no browser or service worker can keep serving the old one.
    $head += '<link rel="stylesheet" href="' + (E (AssetUrl 'assets/css/styles.css')) + '">'
    # A page may ask for an extra stylesheet of its own, so a big section like
    # the Game Zone does not put its weight on the other 190 pages.
    foreach ($sheet in (AsList (P $page 'styles'))) {
        $head += '<link rel="stylesheet" href="' + (E (AssetUrl ('assets/css/' + $sheet + '.css'))) + '">'
    }
    $head += '<script src="' + (E (AssetUrl 'assets/js/site-config.js')) + '"></script>'
    # Reading options are applied before the page paints, so a visitor who
    # chose large text never sees the page jump from small to large.
    $head += '<script>' + $script:ReadingScript + '</script>'
    $head += StructuredData $page $canonical
    $head += AnalyticsTag

    $scripts = '<script src="' + (E (AssetUrl 'assets/js/nav.js')) + '" defer></script>'
    $scripts += '<script src="' + (E (AssetUrl 'assets/js/personal.js')) + '" defer></script>'
    # A block that needs a script now brings it with it. The script used to be
    # listed by hand in each page's "scripts", and a page that forgot got a
    # block that never came to life: the Study Packs filters said "Filters
    # load in a moment..." for ever, and the Grade 5 Scholarship, Alphabet and
    # Reading activities never got past "Loading activity...". A page's own
    # list is still honoured, and nothing is loaded twice.
    $modules = New-Object System.Collections.ArrayList
    foreach ($m in (AsList (P $page 'scripts'))) { if (-not $modules.Contains([string]$m)) { [void]$modules.Add([string]$m) } }
    foreach ($b in (AsList (P $page 'blocks'))) {
        $need = $script:BlockScripts[[string](P $b 'type')]
        if (-not $need) { continue }
        # An activities block with no activities in it has nothing to run.
        if ([string](P $b 'type') -eq 'activities' -and (AsList (P $b 'ids')).Count -eq 0) { continue }
        if (-not $modules.Contains($need)) { [void]$modules.Add($need) }
    }
    foreach ($m in $modules) {
        $scripts += '<script type="module" src="' + (E (AssetUrl ('assets/js/' + $m + '.js'))) + '"></script>'
    }

    $html = '<!doctype html>' + "`n"
    $html += '<html lang="' + (E $script:Config.lang) + '">' + "`n<head>`n" + $head + "`n</head>`n"
    $html += '<body data-root="' + (E $script:Root) + '">' + "`n"
    # The target the "back to top" control returns to. It sits before the skip
    # link so that a keyboard user who uses the control lands above everything
    # and their next Tab is "Skip to main content", which is what being at the
    # top of the page should mean.
    $html += '<span id="top" tabindex="-1"></span>' + "`n"
    $html += '<a class="skip-link" href="#main">Skip to main content</a>' + "`n"
    $html += Header $slug + "`n"
    $html += '<main id="main" tabindex="-1">' + "`n" + $body + "`n</main>`n"
    $html += Footer + "`n"
    # The floating control. It is an enhancement: it ships hidden and the script
    # reveals it once there is something to scroll back from, so a visitor
    # without JavaScript is never shown a control. The footer link above is the
    # one that always works.
    $html += '<a class="to-top" href="#top" data-to-top hidden>'
    $html += '<svg class="to-top__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">'
    $html += '<path d="M12 19V6M6 12l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
    $html += '</svg><span class="visually-hidden">Back to top</span></a>' + "`n"
    $html += $scripts + "`n</body>`n</html>`n"

    # Where to write it
    if ($slug -eq '') { $outPath = Join-Path $ProjectRoot 'index.html' }
    elseif ((P $page 'flat') -eq $true) { $outPath = Join-Path $ProjectRoot ($slug + '.html') }
    else {
        $dir = Join-Path $ProjectRoot ($slug -replace '/', '\')
        if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory -Path $dir -Force) }
        $outPath = Join-Path $dir 'index.html'
    }
    [System.IO.File]::WriteAllText($outPath, $html, $utf8)

    # Search index entry
    if ((P $page 'noindex') -ne $true) {
        $entry = [ordered]@{
            title       = $title
            description = $description
            url         = if ($slug -eq '') { '' } else { $slug + '/' }
            kind        = [string](P $page 'kind' 'page')
            section     = [string](P $page 'kicker' '')
            keywords    = [string](P $page 'keywords' '')
        }
        [void]$script:SearchIndex.Add([pscustomobject]$entry)
    }

    return $outPath
}

# ----------------------------------------------------------- site-config.js --
# Written before the pages, so the ?v= address each page gives it is current.
# It holds only public contact details: never put a key or password here.

$cfgJs = "/* Generated by tools/build-site.ps1 from _src/config.json. Do not edit by hand. */`n"
$cfgJs += 'window.RCF_CONFIG = ' + (ConvertTo-Json ([ordered]@{
            siteName             = $script:Config.siteName
            tagline              = $script:Config.tagline
            whatsappDisplay      = $script:Config.whatsappDisplay
            whatsappInternational = $script:Config.whatsappInternational
            email                = $script:Config.email
            publicationsUrl      = $script:Config.PUBLICATIONS_WEBSITE_URL
            publicationsName     = $script:Config.publicationsName
        }) -Compress) + ";`n"
[System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'assets\js\site-config.js'), $cfgJs, $utf8)

# ------------------------------------------------- asset versions and CSP --

# ?v=<first 10 characters of the file's SHA-1>. The address changes only when
# the file's content changes, so unchanged files stay cached between deploys.
$script:AssetVersions = @{}
function AssetUrl($rel) {
    if (-not $script:AssetVersions.ContainsKey($rel)) {
        $path = Join-Path $ProjectRoot ($rel -replace '/', '\')
        $v = ''
        if (Test-Path $path) {
            $bytes = [System.IO.File]::ReadAllBytes($path)
            $v = ((([System.Security.Cryptography.SHA1]::Create()).ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 10)
        }
        $script:AssetVersions[$rel] = $v
    }
    $u = $script:Root + $rel
    if ($script:AssetVersions[$rel]) { $u += '?v=' + $script:AssetVersions[$rel] }
    return $u
}

# The one inline script every page needs (reading options before first paint).
# Defined once so its CSP hash always matches what is written into the page.
$script:ReadingScript = 'try{var r=JSON.parse(localStorage.getItem("rcf-reading")||"{}"),h=document.documentElement,s=[1,1.15,1.3][r.size||0]||1;if(r.size){h.classList.add("reading-large");h.style.setProperty("--reading-scale",s)}if(r.contrast)h.classList.add("reading-contrast");if(r.spacing)h.classList.add("reading-spacing")}catch(e){}'

function ScriptHash($js) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($js)
    return "'sha256-" + [Convert]::ToBase64String(([System.Security.Cryptography.SHA256]::Create()).ComputeHash($bytes)) + "'"
}

# Content Security Policy. Scripts may come only from this site, from the two
# inline scripts identified by their hashes, and from the statistics service
# chosen in config.json. No inline event handlers, no eval, no plugins, no
# other sites. Inline style attributes stay allowed: they cannot run code and a
# few components set CSS variables with them.
$cspScript = "'self' " + (ScriptHash $script:ReadingScript)
$cspConnect = "'self'"
$cspImg = "'self' data:"
if ($script:AnalyticsKind -eq 'google') {
    $m = [regex]::Match($script:AnalyticsHtml, '<script>(.*?)</script>')
    if ($m.Success) { $cspScript += ' ' + (ScriptHash $m.Groups[1].Value) }
    $cspScript += ' https://www.googletagmanager.com'
    $cspConnect += ' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com'
    $cspImg += ' https://*.google-analytics.com https://*.googletagmanager.com'
}
elseif ($script:AnalyticsName -eq 'Cloudflare Web Analytics') {
    $cspScript += ' https://static.cloudflareinsights.com'
    $cspConnect += ' https://cloudflareinsights.com'
}
elseif ($script:AnalyticsName -eq 'GoatCounter') {
    $gcId = ([string](P (P $script:Config 'analytics') 'id' '')).Trim()
    $cspScript += ' https://gc.zgo.at'
    $cspConnect += " https://$gcId.goatcounter.com"
    $cspImg += " https://$gcId.goatcounter.com"
}
# frame-src names one publisher and nothing else: English Teaching Forum's
# PDFs, shown on the ELT Articles pages from the U.S. Department of State's
# own server. Any other frame is still refused.
$script:CspContent = "default-src 'self'; script-src $cspScript; style-src 'self' 'unsafe-inline'; img-src $cspImg; connect-src $cspConnect; media-src 'self'; font-src 'self'; frame-src https://americanenglish.state.gov; object-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'; worker-src 'self'"

# ------------------------------------------------------------------ build --

Say '  Writing pages...'
$written = 0
foreach ($page in $pages) {
    [void](BuildPage $page)
    $written++
}
Say "  Pages written: $written" 'Green'

# ---------------------------------------------- extra search index entries --

$script:Root = ''

# A paper is found by the way people actually ask for it, not by the way its
# filename happens to read. Every structured field is written into the search
# text together with the forms a visitor is likely to type, so that "Grade 7
# second term", "grade 7 term 2" and "gr 7 2nd term" all reach the same paper.
# The structured fields are emitted separately as well, for the filters.
function PaperSearchWords($r) {
    $w = New-Object System.Collections.Generic.List[string]
    $grade = [string](P $r 'grade' '')
    if ($grade) {
        $names = @{ '1'='one'; '2'='two'; '3'='three'; '4'='four'; '5'='five'; '6'='six'; '7'='seven';
                    '8'='eight'; '9'='nine'; '10'='ten'; '11'='eleven'; '12'='twelve'; '13'='thirteen' }
        $w.Add("grade $grade"); $w.Add("gr $grade"); $w.Add("g$grade")
        if ($names.ContainsKey($grade)) { $w.Add("grade " + $names[$grade]) }
    }
    $term = [string](P $r 'term' '')
    if ($term) {
        $n = @{ 'first'='1'; 'second'='2'; 'third'='3' }
        $w.Add("$term term"); $w.Add("term $($n[$term])")
        $ord = @{ 'first'='1st'; 'second'='2nd'; 'third'='3rd' }
        $w.Add("$($ord[$term]) term")
        if ($term -eq 'third') { $w.Add('year end'); $w.Add('end of year') }
    }
    $exam = [string](P $r 'examination' '')
    $subject = [string](P $r 'subject' '')
    # 'ol-english' is used across this file to mean the English language
    # subject, including in Grade 4 papers, so it cannot on its own mean the
    # O/L examination. Only a paper actually sat at O/L earns the O/L words,
    # or a search for "O/L" returns primary term tests.
    if ($exam -eq 'ol' -or $grade -eq '11') {
        $w.Add('ol'); $w.Add('o/l'); $w.Add('ordinary level')
    }
    if ($exam -eq 'al' -or $subject -match '^al-' -or $subject -eq 'general-english') {
        $w.Add('al'); $w.Add('a/l'); $w.Add('advanced level')
    }
    if ($subject -match 'literature') { $w.Add('literature'); $w.Add('english literature') }
    if ($subject -match 'english' -and $subject -notmatch 'literature') { $w.Add('english language') }
    $prov = [string](P $r 'province' '')
    if ($prov) {
        $w.Add($prov)
        # "Western Province" should also be found by "western", and
        # "Trincomalee Zone" by "trincomalee".
        $w.Add(($prov -replace '\s+(Province|Zone|Division|District)$', ''))
    }
    foreach ($f in 'sourceType', 'medium', 'source', 'level', 'year', 'keywords') {
        $v = [string](P $r $f ''); if ($v) { $w.Add($v) }
    }
    $paperNo = [string](P $r 'paper' '')
    if ($paperNo) { $w.Add("paper $paperNo") }
    $type = [string](P $r 'type' 'past-paper')
    $w.Add(($type -replace '-', ' '))
    switch ($type) {
        'past-paper'     { $w.Add('past paper'); $w.Add('term test'); $w.Add('exam paper') }
        'model-paper'    { $w.Add('model paper'); $w.Add('practice paper') }
        'marking-scheme' { $w.Add('marking scheme'); $w.Add('answers'); $w.Add('answer key') }
        'model-answer'   { $w.Add('model answer'); $w.Add('answers') }
        'revision-paper' { $w.Add('revision paper') }
        'question-bank'  { $w.Add('question bank') }
    }
    if ((P $r 'answers' '') -eq 'yes') { $w.Add('answers'); $w.Add('with answers') }
    ($w | Where-Object { $_ } | Select-Object -Unique) -join ' '
}

foreach ($r in $papers) {
    if ((P $r 'published' $true) -eq $false) { continue }
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $r 'title')
            description = [string](P $r 'description' '')
            url         = [string](P $r 'url' 'past-papers/')
            kind        = [string](P $r 'type' 'past-paper')
            section     = 'Past Papers'
            level       = [string](P $r 'level' '')
            keywords    = (PaperSearchWords $r)
            grade       = [string](P $r 'grade' '')
            year        = [string](P $r 'year' '')
            term        = [string](P $r 'term' '')
            province    = [string](P $r 'province' '')
            paperType   = [string](P $r 'type' 'past-paper')
        })
}
foreach ($r in $resources) {
    if ((P $r 'published' $true) -eq $false) { continue }
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $r 'title')
            description = [string](P $r 'description' '')
            url         = [string](P $r 'url' 'resources/')
            kind        = [string](P $r 'type' 'article')
            section     = [string](P $r 'category' '')
            level       = [string](P $r 'level' '')
            keywords    = [string](P $r 'keywords' '')
        })
}
foreach ($c in $classes) {
    if ((P $c 'published' $true) -eq $false) { continue }
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $c 'title')
            description = [string](P $c 'description' '')
            url         = 'rcf-classes/'
            kind        = 'class'
            section     = 'RCF Online Academy'
            level       = [string](P $c 'level' '')
            keywords    = (@((P $c 'subject'), (P $c 'delivery'), (P $c 'groupFormat')) -join ' ')
        })
}
foreach ($q in $quizzes) {
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $q 'title')
            description = [string](P $q 'description' '')
            url         = [string](P $q 'page' 'interactive/')
            kind        = 'quiz'
            section     = 'Interactive Learning'
            keywords    = [string](P $q 'keywords' '')
        })
}
foreach ($t in $literature) {
    if ((P $t 'published' $true) -eq $false) { continue }
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $t 'title')
            description = ((AsList (P $t 'summary')) -join ' ')
            url         = [string](P $t 'slug')
            kind        = 'literature-text'
            section     = [string](P $t 'level' '')
            keywords    = (@((P $t 'author'), (P $t 'genre')) -join ' ')
        })
}

$indexPath = Join-Path $dataDir 'search-index.json'
[System.IO.File]::WriteAllText($indexPath, ($script:SearchIndex | ConvertTo-Json -Depth 4), $utf8)
Say "  Search index entries: $($script:SearchIndex.Count)" 'Green'

# ------------------------------------------------------------ sitemap etc. --

$siteUrl = $script:Config.siteUrl.TrimEnd('/') + '/'
$today = (Get-Date).ToString('yyyy-MM-dd')
$sm = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "`n"
foreach ($page in $pages) {
    if ((P $page 'noindex') -eq $true) { continue }
    $loc = $siteUrl
    if ($page._slug -ne '') { $loc += $page._slug + '/' }
    $priority = if ($page._slug -eq '') { '1.0' } elseif ((Depth $page._slug) -eq 1) { '0.8' } else { '0.6' }
    $sm += "  <url><loc>$(E $loc)</loc><lastmod>$today</lastmod><changefreq>monthly</changefreq><priority>$priority</priority></url>`n"
}
$sm += '</urlset>' + "`n"
[System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'sitemap.xml'), $sm, $utf8)

$robots = "User-agent: *`nAllow: /`n`n# Source folders are not content`nDisallow: /_src/`nDisallow: /tools/`n`nSitemap: ${siteUrl}sitemap.xml`n"
[System.IO.File]::WriteAllText((Join-Path $ProjectRoot 'robots.txt'), $robots, $utf8)

[System.IO.File]::WriteAllText((Join-Path $ProjectRoot '.nojekyll'), '', $utf8)

# --------------------------------------------------------- link validation --

Say '  Checking every internal link...'
$broken = @{}
foreach ($link in $script:Links) {
    $target = [string]$link.Target
    $bad = $false
    $kind = 'BROKEN LINK'
    if ($target -match '\.(pdf|png|jpg|jpeg|svg|webp|zip|docx|xlsx|css|js|json|xml|txt|webmanifest)$') {
        if (-not (Test-Path (Join-Path $ProjectRoot ($target -replace '/', '\')))) { $bad = $true; $kind = 'MISSING FILE' }
    }
    elseif (-not $script:Slugs.Contains($target.Trim('/'))) { $bad = $true }

    if ($bad) {
        if (-not $broken.ContainsKey($target)) {
            $broken[$target] = [pscustomobject]@{ Kind = $kind; Count = 0; First = $link.From }
        }
        $broken[$target].Count++
    }
}

if ($broken.Count -gt 0) {
    Write-Host ''
    Write-Host "  BUILD FAILED - $($broken.Count) address(es) do not point at a real page:" -ForegroundColor Red
    foreach ($key in ($broken.Keys | Sort-Object)) {
        $row = $broken[$key]
        $where = if ($row.First -eq '') { '/' } else { "/$($row.First)" }
        Write-Host ("    {0}  {1}   used {2} time(s), first on '{3}'" -f $row.Kind, $key, $row.Count, $where) -ForegroundColor Red
    }
    Write-Host ''
    Write-Host '  Fix the address, or add the missing page, then run the build again.' -ForegroundColor Yellow
    exit 1
}
Say "  Internal links checked: $($script:Links.Count) - all good" 'Green'

if ($script:Warnings.Count -gt 0) {
    Write-Host ''
    Write-Host '  Warnings:' -ForegroundColor Yellow
    $script:Warnings | Sort-Object -Unique | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
}

# The service worker's cache name follows the content of the styles, scripts
# and data, so visitors are offered the new version only when something they
# would see has actually changed.
$swPath = Join-Path $ProjectRoot 'sw.js'
if (Test-Path $swPath) {
    $sha = [System.Security.Cryptography.SHA1]::Create()
    $files = @(Get-ChildItem (Join-Path $ProjectRoot 'assets/css') -Filter *.css) + @(Get-ChildItem (Join-Path $ProjectRoot 'assets/js') -Filter *.js) + @(Get-ChildItem (Join-Path $ProjectRoot 'data') -Filter *.json)
    $ms = New-Object System.IO.MemoryStream
    foreach ($f in ($files | Sort-Object FullName)) { $b = [System.IO.File]::ReadAllBytes($f.FullName); $ms.Write($b, 0, $b.Length) }
    $hash = (($sha.ComputeHash($ms.ToArray()) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 12)
    $sw = [System.IO.File]::ReadAllText($swPath)
    $sw2 = [regex]::Replace($sw, 'const VERSION = "[^"]*";', "const VERSION = `"rcf-$hash`";")
    if ($sw2 -ne $sw) { [System.IO.File]::WriteAllText($swPath, $sw2, (New-Object System.Text.UTF8Encoding($false))) }
}

Say ''
Say '  Build finished.' 'Green'
Say "  Pages: $written   Links checked: $($script:Links.Count)   Search entries: $($script:SearchIndex.Count)"
Say '  Preview it by double-clicking preview.cmd'
Say ''
