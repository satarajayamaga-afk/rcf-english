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
    return (([string]$script:Config.PUBLICATIONS_WEBSITE_URL) -match '^https?://')
}

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
        if (PubIsLive) { return $script:Config.PUBLICATIONS_WEBSITE_URL }
        $v = $script:PubFallback
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
    # A bookshop link is only external once the bookshop actually exists.
    if (IsPub $v) { return (PubIsLive) }
    return ($v -match '^https?:')
}

# The marker shown beside a bookshop link: "external bookshop" once it is
# published, "Coming soon" until then.
function PubBadge() {
    if (PubIsLive) { return '<span class="badge-ext">External bookshop</span>' }
    return '<span class="badge-soon">Coming soon</span>'
}

# Wording used in screen-reader-only notes and button labels.
function PubNote() {
    if (PubIsLive) { return ' (external bookshop, opens in a new tab)' }
    return ' - the bookshop website is not published yet. This page explains what it will offer.'
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

function Bullets($items, $ordered = $false) {
    $list = AsList $items
    if ($list.Count -eq 0) { return '' }
    $tag = if ($ordered) { 'ol' } else { 'ul' }
    $out = "<$tag>"
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
$literature = @(DataList 'literature' 'texts')
$notices = @(DataList 'notices' 'notices')

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
        $html += '<div class="mega__group"><h3>' + (E (P $group 'title')) + '</h3><ul>'
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
        $html += '<li class="' + $classAttr + '">'

        if ($groups.Count -gt 0) {
            $panelId = 'mega-' + $index
            $html += '<button type="button" class="main-nav__button" aria-expanded="false" aria-controls="' + $panelId + '">'
            $html += (E $label) + '<span class="main-nav__caret" aria-hidden="true"></span></button>'
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
            $extra = ' <span class="badge-soon">Coming soon</span><span class="visually-hidden">' + (PubNote) + '</span>'
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
                $html += '<div class="drawer-nav__group"><h3>' + (E (P $group 'title')) + '</h3><ul>'
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
    if (PubIsLive) {
        $html += '<a class="header-link header-link--accent ext" href="' + (E $script:Config.PUBLICATIONS_WEBSITE_URL) + '" target="_blank" rel="noopener">' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a>'
    }
    else {
        $html += '<a class="header-link header-link--soon" href="' + (E (Url $script:PubFallback)) + '">' + (E $script:Config.publicationsName) + '<span class="header-link__soon">Coming soon</span><span class="visually-hidden">' + (PubNote) + '</span></a>'
    }
    $html += '<button class="search-toggle" type="button" aria-expanded="false" aria-controls="mobile-search"><span class="visually-hidden">Search</span><span aria-hidden="true">&#128269;</span></button>'
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
        $html += '<li><a class="ext" href="' + (E $script:Config.PUBLICATIONS_WEBSITE_URL) + '" target="_blank" rel="noopener">' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a></li>'
    }
    else {
        $html += '<li><a href="' + (E (Url $script:PubFallback)) + '">' + (E $script:Config.publicationsName) + '<span class="visually-hidden">' + (PubNote) + '</span></a></li>'
    }
    $html += '<li><a href="' + (E (Url 'about/rcf-publications/')) + '">About RCF Publications</a></li>'
    $html += '<li><a href="' + (E (Url 'teacher-resources/rcf-publications-for-teachers/')) + '">Books for teachers</a></li>'
    $html += '</ul></div></div>'

    $html += '<div class="footer-bottom"><p>&copy; ' + $year + ' ' + (E $script:Config.siteName) + '. Materials on this site are for educational use.</p>'
    $sep = if (PubIsLive) { ' is a separate website.' } else { ' is a separate website, coming soon.' }
    $html += '<p>' + (E $script:Config.publicationsName) + (E $sep) + '</p></div>'
    return $html + '</div></footer>'
}

# ================================================================== blocks ==

function RenderBlocks($blocks) {
    $html = ''
    foreach ($block in (AsList $blocks)) { $html += (RenderBlock $block) }
    return $html
}

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
                $html += Bullets (P $part 'numbered') $true
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
                        $note = '<span class="visually-hidden"> (external website, opens in a new tab)</span>'
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
            $html += '<div class="table-wrap"><table class="data' + $stacked + '">'
            $caption = P $block 'caption'
            if ($caption) { $html += '<caption>' + (Inline $caption) + '</caption>' }
            $html += '<thead><tr>'
            foreach ($c in $cols) { $html += '<th scope="col">' + (E $c) + '</th>' }
            $html += '</tr></thead><tbody>'
            foreach ($row in (AsList (P $block 'rows'))) {
                $html += '<tr>'
                $i = 0
                foreach ($cell in (AsList $row)) {
                    $label = ''
                    if ($i -lt $cols.Count) { $label = ' data-label="' + (E $cols[$i]) + '"' }
                    $html += '<td' + $label + '>' + (Inline $cell) + '</td>'
                    $i++
                }
                $html += '</tr>'
            }
            return $html + '</tbody></table></div></div></section>'
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

        'browse' {
            $source = [string](P $block 'source' 'resources')
            $fixed = P $block 'fixed'
            $fixedJson = '{}'
            if ($fixed) { $fixedJson = (ConvertTo-Json $fixed -Compress) }
            $filters = (AsList (P $block 'filters')) -join ','
            $html = (SectionOpen $block) + (SectionHead $block)
            $html += '<div class="browse" data-source="' + (E $source) + '" data-fixed="' + (E $fixedJson) + '" data-filters="' + (E $filters) + '">'
            $html += '<div class="toolbar" data-controls><p class="text-muted mb-0">Filters load in a moment&hellip;</p></div>'
            $html += '<div class="results-bar"><p class="results-count" data-count>&nbsp;</p>'
            $html += '<p class="text-small text-muted mb-0">' + (E (P $block 'note' 'Only resources that RCF English is permitted to publish or link to are listed here.')) + '</p></div>'
            $html += '<p class="visually-hidden" role="status" aria-live="polite" data-live></p>'
            $html += StaticList $source $fixed
            return $html + '</div></div></section>'
        }

        'classes' {
            return (RenderClasses $block)
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
            $html += '<p class="whatsapp-number">' + (E $script:Config.whatsappDisplay) + '</p>'
            $html += '<div class="btn-row">'
            foreach ($b in (AsList (P $block 'buttons'))) {
                $msg = [string](P $b 'message')
                $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
                $html += '<a class="btn btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">' + (E (P $b 'label')) + '</a>'
            }
            $html += '</div><p class="text-small text-muted mt-4">WhatsApp opens with the message already written. Read it and press send yourself. Nothing is sent from this website.</p>'
            return $html + '</div></div></section>'
        }

        'publications' {
            $onFallbackPage = ($script:PageSlug -eq $script:PubFallback.Trim('/'))
            $html = (SectionOpen $block) + '<div class="promo"><div>'
            if (PubIsLive) { $html += '<span class="section__eyebrow">Separate bookshop website</span>' }
            else { $html += '<span class="section__eyebrow">Separate bookshop website &mdash; coming soon</span>' }
            $html += '<h2>' + (E (P $block 'heading' 'RCF Publications')) + '</h2>'
            $html += Paragraphs (P $block 'text')
            $html += '<div class="btn-row">'
            if (PubIsLive) {
                $html += '<a class="btn btn--accent ext" href="' + (E $script:Config.PUBLICATIONS_WEBSITE_URL) + '" target="_blank" rel="noopener">Visit ' + (E $script:Config.publicationsName) + '<span class="visually-hidden"> (external website, opens in a new tab)</span></a>'
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
            if (PubIsLive) {
                $html += (E $script:Config.publicationsName) + ' is a separate website with its own ordering arrangements. This link opens it in a new tab.'
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
            if (PubIsLive) {
                $html += '<p class="mb-0"><a class="btn btn--sm btn--outline ext" href="' + (E $script:Config.PUBLICATIONS_WEBSITE_URL) + '" target="_blank" rel="noopener">Browse ' + (E $script:Config.publicationsName) + '<span class="visually-hidden"> (external website, opens in a new tab)</span></a></p>'
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
        'teaching-guide' = 'Teaching guide'; 'guidance' = 'Examination guidance'; 'article' = 'Article'
    }
    $key = [string]$value
    if ($map.ContainsKey($key)) { return $map[$key] }
    if (-not $key) { return 'Resource' }
    return ((Get-Culture).TextInfo.ToTitleCase(($key -replace '[-_]', ' ')))
}

function StaticList($source, $fixed) {
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

    $html = '<ul class="result-list" data-results>'
    foreach ($r in $records) {
        $target = [string](P $r 'url' (P $r 'file' ''))
        $isExt = $target -match '^https?:'
        $html += '<li class="result"><span class="result__thumb" aria-hidden="true">' + (E (TypeLabel (P $r 'type'))) + '</span><div><div class="tag-row">'
        $html += '<span class="tag tag--type">' + (E (TypeLabel (P $r 'type'))) + '</span>'
        if (P $r 'level') { $html += '<span class="tag tag--level">' + (E (P $r 'level')) + '</span>' }
        if (P $r 'year') { $html += '<span class="tag tag--year">' + (E (P $r 'year')) + '</span>' }
        $html += '</div><h3>'
        if ($target) {
            $e = ''
            if ($isExt) { $e = ' target="_blank" rel="noopener" class="ext"' }
            $html += '<a href="' + (E (Url $target)) + '"' + $e + '>' + (E (P $r 'title')) + '</a>'
        }
        else { $html += (E (P $r 'title')) }
        $html += '</h3>'
        if (P $r 'description') { $html += '<p>' + (E (P $r 'description')) + '</p>' }
        if (P $r 'copyright') { $html += '<p class="text-small text-muted mb-0">Copyright status: ' + (E (P $r 'copyright')) + '</p>' }
        $html += '</div></li>'
    }
    return $html + '</ul>'
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

function RenderClasses($block) {
    $filterCourse = P $block 'course'
    $filterFormat = P $block 'format'
    $filterDelivery = P $block 'delivery'
    $featuredOnly = (P $block 'featured') -eq $true

    $list = @($classes | Where-Object { (P $_ 'published' $true) -ne $false })
    if ($filterCourse) { $list = @($list | Where-Object { [string](P $_ 'course') -eq [string]$filterCourse }) }
    if ($filterFormat) { $list = @($list | Where-Object { [string](P $_ 'groupFormat') -eq [string]$filterFormat }) }
    if ($filterDelivery) { $list = @($list | Where-Object { [string](P $_ 'delivery') -eq [string]$filterDelivery }) }
    if ($featuredOnly) { $list = @($list | Where-Object { (P $_ 'featured') -eq $true }) }
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

    $html += '<div class="grid grid--3">'
    foreach ($c in $list) {
        $title = [string](P $c 'title')
        $status = ClassStatus (P $c 'registration')
        $html += '<article class="card class-card"><div class="tag-row">'
        $html += '<span class="class-card__status" data-status="' + $status[0] + '">' + (E $status[1]) + '</span>'
        if (P $c 'delivery') { $html += '<span class="tag tag--type">' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'delivery')))) + '</span>' }
        if (P $c 'groupFormat') { $html += '<span class="tag">' + (E ((Get-Culture).TextInfo.ToTitleCase([string](P $c 'groupFormat')))) + '</span>' }
        $html += '</div><h3>' + (E $title) + '</h3>'
        $html += Paragraphs (P $c 'description')
        $html += '<dl class="class-facts">'
        $facts = @(
            @('Subject', (P $c 'subject')),
            @('Learner level', (P $c 'level')),
            @('Teacher', (P $c 'teacher')),
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
        $msg = [string](P $c 'whatsappMessage' ("Hello, I would like information about $title. Please send me the schedule, fees and registration details."))
        $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
        $html += '<div class="btn-row"><a class="btn btn--sm btn--whatsapp" href="' + (E $href) + '" target="_blank" rel="noopener">Ask about this class</a></div>'
        $html += '</article>'
    }
    return $html + '</div></div></section>'
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
        $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
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
        $href = 'https://wa.me/' + $script:Config.whatsappInternational + '?text=' + [uri]::EscapeDataString($msg)
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
    $html += '</select></div></div>'
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

        $aside = P $hero 'aside'
        if ($aside) {
            $html += '<aside class="hero__aside" aria-labelledby="hero-aside-title">'
            $html += '<h2 class="hero__aside-title" id="hero-aside-title">' + (E (P $aside 'title')) + '</h2><ul>'
            foreach ($i in (AsList (P $aside 'items'))) { $html += '<li>' + (Inline $i) + '</li>' }
            $html += '</ul>'
            $foot = P $aside 'footnote'
            if ($foot) { $html += '<p class="hero__aside-foot">' + (Inline $foot) + '</p>' }
            $html += '</aside>'
        }
        return $html + '</div></section>'
    }

    $html = '<section class="page-hero"><div class="container">'
    $kicker = P $page 'kicker'
    if ($kicker) { $html += '<span class="page-hero__kicker">' + (E $kicker) + '</span>' }
    $html += '<h1>' + (E (P $page 'title')) + '</h1>'
    $text = P $hero 'text'
    if ($text) { $html += '<p>' + (Inline $text) + '</p>' }
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
        $blocks += @"
{"@context":"https://schema.org","@type":"LearningResource","name":$(JsonString $name),"description":$(JsonString $desc),"url":$(JsonString $canonical),"inLanguage":"en","learningResourceType":$(JsonString (P $page 'resourceType' 'lesson')),"educationalLevel":$(JsonString $level),"isAccessibleForFree":true,"provider":{"@type":"EducationalOrganization","name":$(JsonString $script:Config.siteName),"url":$(JsonString $siteUrl)}}
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
    if ((P $page 'flat') -eq $true) { $script:Root = '' } else { $script:Root = RootFor $slug }
    # The 404 page is served in place of any address, so its links must be
    # absolute - a relative link would be resolved against the missing address.
    if ((P $page 'absoluteLinks') -eq $true) { $script:Root = $script:Config.siteUrl.TrimEnd('/') + '/' }
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
    $body = ''
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
    $head += '<title>' + (E $metaTitle) + '</title>'
    $head += '<meta name="description" content="' + (E $description) + '">'
    $head += '<link rel="canonical" href="' + (E $canonical) + '">'
    $head += '<meta name="theme-color" content="' + (E $script:Config.themeColor) + '">'
    $head += '<meta name="author" content="' + (E $script:Config.founderName) + '">'
    $keywords = P $page 'keywords'
    if ($keywords) { $head += '<meta name="keywords" content="' + (E $keywords) + '">' }
    if ((P $page 'noindex') -eq $true) { $head += '<meta name="robots" content="noindex, follow">' }
    $head += '<meta property="og:type" content="website">'
    $head += '<meta property="og:site_name" content="' + (E $script:Config.siteName) + '">'
    $head += '<meta property="og:locale" content="' + (E $script:Config.locale) + '">'
    $head += '<meta property="og:title" content="' + (E $metaTitle) + '">'
    $head += '<meta property="og:description" content="' + (E $description) + '">'
    $head += '<meta property="og:url" content="' + (E $canonical) + '">'
    $head += '<meta property="og:image" content="' + (E ($script:Config.siteUrl.TrimEnd('/') + '/assets/img/social/og-image.png')) + '">'
    $head += '<meta property="og:image:alt" content="RCF English - clear English lessons and practical revision resources">'
    $head += '<meta name="twitter:card" content="summary_large_image">'
    $head += '<link rel="icon" href="' + (E ($script:Root + 'assets/img/icons/favicon.svg')) + '" type="image/svg+xml">'
    $head += '<link rel="apple-touch-icon" href="' + (E ($script:Root + 'assets/img/icons/apple-touch-icon.png')) + '">'
    $head += '<link rel="manifest" href="' + (E ($script:Root + 'manifest.webmanifest')) + '">'
    $head += '<link rel="stylesheet" href="' + (E ($script:Root + 'assets/css/styles.css')) + '">'
    $head += '<script src="' + (E ($script:Root + 'assets/js/site-config.js')) + '"></script>'
    $head += StructuredData $page $canonical

    $scripts = '<script src="' + (E ($script:Root + 'assets/js/nav.js')) + '" defer></script>'
    foreach ($m in (AsList (P $page 'scripts'))) {
        $scripts += '<script type="module" src="' + (E ($script:Root + 'assets/js/' + $m + '.js')) + '"></script>'
    }

    $html = '<!doctype html>' + "`n"
    $html += '<html lang="' + (E $script:Config.lang) + '">' + "`n<head>`n" + $head + "`n</head>`n"
    $html += '<body data-root="' + (E $script:Root) + '">' + "`n"
    $html += '<a class="skip-link" href="#main">Skip to main content</a>' + "`n"
    $html += Header $slug + "`n"
    $html += '<main id="main" tabindex="-1">' + "`n" + $body + "`n</main>`n"
    $html += Footer + "`n"
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
foreach ($r in $papers) {
    if ((P $r 'published' $true) -eq $false) { continue }
    [void]$script:SearchIndex.Add([pscustomobject][ordered]@{
            title       = [string](P $r 'title')
            description = [string](P $r 'description' '')
            url         = [string](P $r 'url' 'past-papers/')
            kind        = [string](P $r 'type' 'past-paper')
            section     = 'Past Papers'
            level       = [string](P $r 'level' '')
            keywords    = (@((P $r 'keywords'), (P $r 'subject'), (P $r 'year')) -join ' ')
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

# ----------------------------------------------------------- site-config.js --

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

Say ''
Say '  Build finished.' 'Green'
Say "  Pages: $written   Links checked: $($script:Links.Count)   Search entries: $($script:SearchIndex.Count)"
Say '  Preview it by double-clicking preview.cmd'
Say ''
