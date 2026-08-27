<#
    catalogue-papers.ps1
    --------------------
    Reads a LIST OF FILENAMES and sorts it into an inventory of test papers.

    This script never opens, downloads, copies, renames or publishes a paper.
    It only reads a text list of names that you give it, and writes three
    reports into _scratch\paper-inventory\ , which git ignores. Nothing it
    writes can reach GitHub.

    It expects names in this form:

        Grade 9 English - First Term Test 2023 - Western Province.pdf

    and it also copes with these additions:

        ... - Paper II
        ... - Marking Scheme          (or Answer Key, or Model Answers)
        ... (1)      ... - Copy       (the markers Google Drive adds)

    HOW TO USE IT

      1. Make a plain text file with one filename per line. If you can also
         export the size and the date, put them after the name separated by
         TAB characters, and the report becomes more useful:

             Grade 9 English - First Term Test 2023 - Western.pdf<TAB>2.4 MB<TAB>2023-05-11

      2. Run:  powershell -ExecutionPolicy Bypass -File tools\catalogue-papers.ps1 -Listing mylist.txt

    WHAT IT CANNOT DO

      Page counts, scan quality and student names are inside the files, not in
      the names. Those columns come back as "needs inspection" and a person
      must open the paper to fill them in.
#>

param(
    [Parameter(Mandatory = $true)]
    [string] $Listing,

    [string] $OutDir
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $ProjectRoot '_scratch\paper-inventory' }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

if (-not (Test-Path $Listing)) {
    Write-Host ''
    Write-Host "  Could not find the list file: $Listing" -ForegroundColor Red
    Write-Host '  Make a plain text file with one filename per line and try again.'
    Write-Host ''
    exit 1
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

# ------------------------------------------------------------------ helpers

function Normalise([string] $s) {
    $s = $s -replace [char]0x2013, '-'      # en dash
    $s = $s -replace [char]0x2014, '-'      # em dash
    $s = $s -replace [char]0x2019, "'"      # curly apostrophe
    $s = $s -replace '\s+', ' '
    return $s.Trim()
}

function RomanToNumber([string] $s) {
    switch ($s.ToUpper()) {
        'I'   { return 1 }
        'II'  { return 2 }
        'III' { return 3 }
        default { return [int]$s }
    }
}

# Turns one filename into a classified record.
function ParseName([string] $rawName) {

    $rec = [ordered]@{
        file        = $rawName
        grade       = ''
        subject     = ''
        term        = ''
        year        = ''
        location    = ''
        paper       = ''
        docType     = 'past-paper'
        extension   = ''
        dupMarker   = $false
        parsed      = $true
        problems    = @()
    }

    $name = Normalise $rawName

    # Extension
    if ($name -match '\.([A-Za-z0-9]{2,4})$') {
        $rec.extension = $matches[1].ToLower()
        $name = $name -replace '\.[A-Za-z0-9]{2,4}$', ''
    }

    # The markers Google Drive and Windows add to a second copy
    if ($name -match '\s*\((\d+)\)\s*$' -or $name -match '\s*-\s*Copy(\s*\(\d+\))?\s*$' -or $name -match '_\d+$') {
        $rec.dupMarker = $true
        $name = $name -replace '\s*\(\d+\)\s*$', ''
        $name = $name -replace '\s*-\s*Copy(\s*\(\d+\))?\s*$', ''
        $name = $name -replace '_\d+$', ''
    }
    if ($name -match '^\s*Copy of\s+') {
        $rec.dupMarker = $true
        $name = $name -replace '^\s*Copy of\s+', ''
    }

    $name = Normalise $name

    # Split into segments on the dash separator
    $segments = @()
    foreach ($seg in ($name -split '\s+-\s+')) {
        $s = Normalise $seg
        if ($s) { $segments += $s }
    }

    $leftover = @()

    foreach ($seg in $segments) {

        if ($seg -match '^Grade\s+(\d{1,2})\s+(.+)$') {
            $rec.grade   = $matches[1]
            $rec.subject = Normalise $matches[2]
            continue
        }

        if ($seg -match '^(First|Second|Third)\s+Term\s+Test\s+(\d{4})$') {
            $rec.term = $matches[1].ToLower()
            $rec.year = $matches[2]
            continue
        }

        # Term and year written apart, or in another order
        if ($seg -match '^(First|Second|Third)\s+Term(\s+Test)?$') {
            $rec.term = $matches[1].ToLower()
            continue
        }
        if ($seg -match '^(19|20)\d{2}$') {
            $rec.year = $seg
            continue
        }

        if ($seg -match '^Paper\s*(I{1,3}|[123])$') {
            $rec.paper = RomanToNumber $matches[1]
            continue
        }

        if ($seg -match '^(Marking\s*Scheme|Answer\s*Key|Answers|Model\s*Answers?|Scheme)$') {
            if ($seg -match 'Marking|Scheme') { $rec.docType = 'marking-scheme' }
            else                              { $rec.docType = 'model-answer' }
            continue
        }

        $leftover += $seg
    }

    if ($leftover.Count -ge 1) {
        $rec.location = $leftover[0]
        if ($leftover.Count -gt 1) {
            $rec.problems += ('unrecognised text: ' + (($leftover | Select-Object -Skip 1) -join ' / '))
        }
    }

    # What is missing?
    if (-not $rec.grade)    { $rec.problems += 'no grade in the name';    $rec.parsed = $false }
    if (-not $rec.subject)  { $rec.problems += 'no subject in the name';  $rec.parsed = $false }
    if (-not $rec.year)     { $rec.problems += 'no year in the name';     $rec.parsed = $false }
    if (-not $rec.term)     { $rec.problems += 'no term in the name' }
    if (-not $rec.location) { $rec.problems += 'NO CLEAR SOURCE - no province or zone in the name' }

    if ($rec.subject -and $rec.subject -notmatch '(?i)english|literature') {
        $rec.problems += ("subject is '" + $rec.subject + "', not English - check this belongs here")
    }

    # A first pass at personal information. Weak, and no substitute for opening
    # the file, but it catches the obvious cases.
    if ($rawName -match '\b\d{9}[vVxX]\b')                       { $rec.problems += 'POSSIBLE PERSONAL DATA - looks like an NIC number' }
    if ($rawName -match '(?i)\b(results?|marks?|name\s*list|nominal\s*roll|attendance)\b') { $rec.problems += 'POSSIBLE PERSONAL DATA - name suggests student records' }
    if ($rawName -match '(?i)\b(scanned by|copy for)\b')         { $rec.problems += 'POSSIBLE PERSONAL DATA - name mentions a person' }

    return $rec
}

# ------------------------------------------------------------------- read it

$lines = [System.IO.File]::ReadAllLines($Listing, [System.Text.Encoding]::UTF8)

$records = @()
foreach ($line in $lines) {
    if (-not $line -or -not $line.Trim()) { continue }
    if ($line.Trim().StartsWith('#')) { continue }

    $parts = $line -split "`t"
    $rawName = $parts[0].Trim()
    if (-not $rawName) { continue }

    $rec = ParseName $rawName
    $rec.size     = if ($parts.Count -gt 1) { $parts[1].Trim() } else { '' }
    $rec.modified = if ($parts.Count -gt 2) { $parts[2].Trim() } else { '' }

    # These three can only be answered by opening the file.
    $rec.pages    = 'needs inspection'
    $rec.quality  = 'needs inspection'
    $rec.personal = 'needs inspection'

    $records += [pscustomobject]$rec
}

if ($records.Count -eq 0) {
    Write-Host ''
    Write-Host '  The list file had no usable lines in it.' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

# ------------------------------------------------------------- find repeats

function GroupKey($r) {
    return (('g' + $r.grade), $r.term, $r.year, $r.location.ToLower(), ('p' + $r.paper), $r.docType) -join '|'
}

$groups = @{}
foreach ($r in $records) {
    $k = GroupKey $r
    if (-not $groups.ContainsKey($k)) { $groups[$k] = @() }
    $groups[$k] += $r
}

$duplicateGroups = @()
foreach ($k in $groups.Keys) {
    if ($groups[$k].Count -gt 1) { $duplicateGroups += , $groups[$k] }
}

# ---------------------------------------------------------------- write out

$csvPath = Join-Path $OutDir 'inventory.csv'
$records |
    Select-Object file, grade, subject, term, year, location, paper, docType,
                  extension, size, modified, pages, quality, personal,
                  @{ n = 'flags'; e = { ($_.problems) -join '; ' } } |
    Sort-Object grade, year, term, location |
    Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

# --- the readable report -----------------------------------------------
$md = New-Object System.Text.StringBuilder
$null = $md.AppendLine('# Paper inventory')
$null = $md.AppendLine('')
$null = $md.AppendLine('Built from a list of filenames only. Nothing was opened, downloaded or copied.')
$null = $md.AppendLine('')
$null = $md.AppendLine(('- Files listed: **' + $records.Count + '**'))
$null = $md.AppendLine(('- Names that matched your convention: **' + @($records | Where-Object { $_.parsed }).Count + '**'))
$null = $md.AppendLine(('- Names that did not: **' + @($records | Where-Object { -not $_.parsed }).Count + '**'))
$null = $md.AppendLine(('- Groups with more than one copy: **' + $duplicateGroups.Count + '**'))
$null = $md.AppendLine(('- Marking schemes or answer keys: **' + @($records | Where-Object { $_.docType -ne 'past-paper' }).Count + '**'))
$null = $md.AppendLine(('- Without a province or zone in the name: **' + @($records | Where-Object { -not $_.location }).Count + '**'))
$null = $md.AppendLine(('- Flagged as possibly holding personal data: **' + @($records | Where-Object { ($_.problems -join ' ') -match 'PERSONAL' }).Count + '**'))
$null = $md.AppendLine('')

$null = $md.AppendLine('## By grade')
$null = $md.AppendLine('')
$null = $md.AppendLine('| Grade | Papers | Years covered | Terms covered | Provinces or zones |')
$null = $md.AppendLine('|---|---|---|---|---|')
foreach ($g in ($records | Where-Object { $_.grade } | Group-Object grade | Sort-Object { [int]$_.Name })) {
    $years  = ($g.Group | Where-Object { $_.year } | Select-Object -ExpandProperty year | Sort-Object -Unique) -join ', '
    $terms  = ($g.Group | Where-Object { $_.term } | Select-Object -ExpandProperty term | Sort-Object -Unique) -join ', '
    $places = ($g.Group | Where-Object { $_.location } | Select-Object -ExpandProperty location | Sort-Object -Unique) -join ', '
    $null = $md.AppendLine(('| ' + $g.Name + ' | ' + $g.Count + ' | ' + $years + ' | ' + $terms + ' | ' + $places + ' |'))
}
$null = $md.AppendLine('')

if ($duplicateGroups.Count -gt 0) {
    $null = $md.AppendLine('## Repeated papers')
    $null = $md.AppendLine('')
    $null = $md.AppendLine('Same grade, term, year, place, paper number and document type. These are')
    $null = $md.AppendLine('either true duplicates or different scans of one paper. Only one should be kept.')
    $null = $md.AppendLine('')
    foreach ($grp in $duplicateGroups) {
        $first = $grp[0]
        $null = $md.AppendLine(('**Grade ' + $first.grade + ' - ' + $first.term + ' term ' + $first.year + ' - ' + $first.location + '**'))
        $null = $md.AppendLine('')
        foreach ($r in $grp) {
            $note = if ($r.dupMarker) { '  <- name carries a copy marker' } else { '' }
            $null = $md.AppendLine(('- `' + $r.file + '` ' + $r.size + $note))
        }
        $null = $md.AppendLine('')
    }
}

$problem = $records | Where-Object { $_.problems.Count -gt 0 }
if ($problem) {
    $null = $md.AppendLine('## Names needing attention')
    $null = $md.AppendLine('')
    $null = $md.AppendLine('| File | Problem |')
    $null = $md.AppendLine('|---|---|')
    foreach ($r in $problem) {
        $null = $md.AppendLine(('| `' + $r.file + '` | ' + (($r.problems) -join '; ') + ' |'))
    }
    $null = $md.AppendLine('')
}

[System.IO.File]::WriteAllText((Join-Path $OutDir 'inventory.md'), $md.ToString(), $utf8)

# --- the draft approval table ------------------------------------------
# One candidate per group: prefer no copy marker, then the largest file.
$shortlist = @()
foreach ($k in $groups.Keys) {
    $best = $groups[$k] |
        Sort-Object @{ e = { if ($_.dupMarker) { 1 } else { 0 } } },
                    @{ e = { $_.size }; Descending = $true } |
        Select-Object -First 1
    $shortlist += $best
}
# Anything flagged for personal data, or that is not an English paper, is held
# back rather than proposed. It goes into a separate list underneath instead.
function IsHeldBack($r) {
    $joined = ($r.problems) -join ' '
    if ($joined -match 'PERSONAL') { return $true }
    if ($joined -match 'not English') { return $true }
    return $false
}

$heldBack  = @($shortlist | Where-Object { $_.parsed -and $_.docType -eq 'past-paper' -and (IsHeldBack $_) })
$shortlist = @($shortlist |
    Where-Object { $_.parsed -and $_.docType -eq 'past-paper' -and -not (IsHeldBack $_) } |
    Sort-Object { [int]$_.grade }, { [int]$_.year }, term, location)

$at = New-Object System.Text.StringBuilder
$null = $at.AppendLine('# Draft approval table')
$null = $at.AppendLine('')
$null = $at.AppendLine('**Nothing here is approved and nothing has been copied.** The last four')
$null = $at.AppendLine('columns cannot be filled in from a filename. Somebody must open each paper.')
$null = $at.AppendLine('')
$null = $at.AppendLine('| Filename | Grade | Term | Year | Province or zone | Quality | Pages | Answers | Source | Redistribution concern | Recommendation |')
$null = $at.AppendLine('|---|---|---|---|---|---|---|---|---|---|---|')
foreach ($r in $shortlist) {
    $key = GroupKey $r
    $hasAnswers = $records | Where-Object {
        $_.grade -eq $r.grade -and $_.term -eq $r.term -and $_.year -eq $r.year -and
        $_.location -eq $r.location -and $_.docType -ne 'past-paper'
    }
    $answers = if ($hasAnswers) { 'yes' } else { 'none found' }
    $source  = if ($r.location) { $r.location } else { 'NOT STATED' }
    $concern = if ($r.location) { 'permission needed' } else { 'unknown origin' }
    $null = $at.AppendLine(
        '| `' + $r.file + '` | ' + $r.grade + ' | ' + $r.term + ' | ' + $r.year + ' | ' +
        $source + ' | needs inspection | needs inspection | ' + $answers + ' | ' +
        $source + ' | ' + $concern + ' | hold for review |')
}
$null = $at.AppendLine('')

if ($heldBack.Count -gt 0) {
    $null = $at.AppendLine('## Held back, deliberately not proposed')
    $null = $at.AppendLine('')
    $null = $at.AppendLine('These are not in the table above. Deal with each one before it goes near the website.')
    $null = $at.AppendLine('')
    $null = $at.AppendLine('| Filename | Why it is held back |')
    $null = $at.AppendLine('|---|---|')
    foreach ($r in $heldBack) {
        $null = $at.AppendLine(('| `' + $r.file + '` | ' + (($r.problems) -join '; ') + ' |'))
    }
    $null = $at.AppendLine('')
}

$null = $at.AppendLine('## Before any of these can be published')
$null = $at.AppendLine('')
$null = $at.AppendLine('A term test paper set by a provincial department or a zonal office belongs to')
$null = $at.AppendLine('that office. Having a copy is not permission to republish it. See')
$null = $at.AppendLine('RESOURCE-PUBLISHING-POLICY.md and the notes at the top of data/papers.json.')
[System.IO.File]::WriteAllText((Join-Path $OutDir 'approval-table.md'), $at.ToString(), $utf8)

# ------------------------------------------------------------------ report

Write-Host ''
Write-Host '  Paper inventory'
Write-Host '  ---------------'
Write-Host ('  Files listed:              ' + $records.Count)
Write-Host ('  Matched your convention:   ' + @($records | Where-Object { $_.parsed }).Count)
Write-Host ('  Did not match:             ' + @($records | Where-Object { -not $_.parsed }).Count)
Write-Host ('  Repeated papers:           ' + $duplicateGroups.Count + ' groups')
Write-Host ('  Marking schemes / answers: ' + @($records | Where-Object { $_.docType -ne 'past-paper' }).Count)
Write-Host ('  No province or zone:       ' + @($records | Where-Object { -not $_.location }).Count)
Write-Host ('  Possible personal data:    ' + @($records | Where-Object { ($_.problems -join ' ') -match 'PERSONAL' }).Count)
Write-Host ''
Write-Host '  Written to:'
Write-Host ('    ' + (Join-Path $OutDir 'inventory.csv'))
Write-Host ('    ' + (Join-Path $OutDir 'inventory.md'))
Write-Host ('    ' + (Join-Path $OutDir 'approval-table.md'))
Write-Host ''
Write-Host '  Nothing was downloaded, copied, renamed or published.'
Write-Host '  This folder is ignored by git and cannot reach GitHub.'
Write-Host ''
