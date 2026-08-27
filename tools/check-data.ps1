<#
    ===========================================================================
    RCF English - check your data files
    ---------------------------------------------------------------------------
    Reads every file in _src/ and data/ and tells you, in plain language, if
    any of them contains a typing mistake that would stop the site building.

    Double-click check.cmd to run it. Nothing is changed - it only looks.

    The commonest mistakes it catches:
      * a comma left after the LAST item in a list          [ "a", "b", ]
      * a missing comma BETWEEN two items                   [ "a"  "b" ]
      * a missing closing bracket   }   or   ]
      * a curly quote instead of a straight one   "  instead of  "
    ===========================================================================
#>

$ErrorActionPreference = 'Continue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host '   RCF English - checking your files' -ForegroundColor Cyan
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host ''

$problems = 0
$checked = 0

$files = @()
$files += Get-ChildItem (Join-Path $ProjectRoot '_src') -Filter *.json -Recurse -ErrorAction SilentlyContinue
$files += Get-ChildItem (Join-Path $ProjectRoot 'data') -Filter *.json -ErrorAction SilentlyContinue

foreach ($file in $files) {
    if ($file.Name -eq 'search-index.json') { continue }   # written by the build
    $checked++
    $relative = $file.FullName.Substring($ProjectRoot.Length + 1)
    $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)

    # Curly quotes are the single commonest cause of a broken file, because
    # word processors insert them silently. Warn before trying to read it.
    if ($text -match '[\u201C\u201D]\s*:' -or $text -match ':\s*[\u201C\u201D]') {
        Write-Host "   PROBLEM  $relative" -ForegroundColor Red
        Write-Host '            This file contains curly quotation marks around a name or' -ForegroundColor Yellow
        Write-Host '            value. JSON needs straight ones. Retype the quotes, or use' -ForegroundColor Yellow
        Write-Host '            Notepad rather than Word to edit these files.' -ForegroundColor Yellow
        Write-Host ''
        $problems++
        continue
    }

    try {
        $null = $text | ConvertFrom-Json
        Write-Host "   OK       $relative" -ForegroundColor DarkGray
    }
    catch {
        $problems++
        Write-Host "   PROBLEM  $relative" -ForegroundColor Red
        $message = $_.Exception.Message

        # Translate the usual .NET messages into something readable.
        if ($message -match 'after a name') {
            Write-Host '            A colon or a comma is missing after a name.' -ForegroundColor Yellow
        }
        elseif ($message -match 'Unexpected character|Invalid character') {
            Write-Host '            There is an unexpected character. Look for a missing comma' -ForegroundColor Yellow
            Write-Host '            between two items, or a comma after the LAST item in a list.' -ForegroundColor Yellow
        }
        elseif ($message -match 'Unterminated|Unexpected end') {
            Write-Host '            The file ends too early. A closing bracket } or ] is missing.' -ForegroundColor Yellow
        }
        else {
            Write-Host '            The file could not be read.' -ForegroundColor Yellow
        }

        if ($message -match 'line (\d+)') {
            $line = $Matches[1]
            Write-Host "            Look at about LINE $line of that file." -ForegroundColor Yellow
            $lines = $text -split "`r?`n"
            $index = [int]$line - 1
            $from = [Math]::Max(0, $index - 2)
            $to = [Math]::Min($lines.Count - 1, $index + 1)
            Write-Host ''
            for ($i = $from; $i -le $to; $i++) {
                $marker = if ($i -eq $index) { ' >> ' } else { '    ' }
                $colour = if ($i -eq $index) { 'Red' } else { 'DarkGray' }
                Write-Host ("      {0}{1,4}  {2}" -f $marker, ($i + 1), $lines[$i]) -ForegroundColor $colour
            }
        }
        Write-Host ''
        Write-Host "            (Technical detail: $message)" -ForegroundColor DarkGray
        Write-Host ''
    }
}

Write-Host ''
Write-Host '  ------------------------------------------------------------'
if ($problems -eq 0) {
    Write-Host "   All $checked files are fine. You can run build.cmd." -ForegroundColor Green
}
else {
    Write-Host "   $problems file(s) out of $checked need fixing." -ForegroundColor Red
    Write-Host '   Fix them, then run this check again before building.' -ForegroundColor Yellow
}
Write-Host '  ------------------------------------------------------------'
Write-Host ''
exit ([int]($problems -gt 0))
