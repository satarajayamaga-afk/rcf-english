<#
    ===========================================================================
    RCF English - local preview server
    ---------------------------------------------------------------------------
    Serves the website on this computer so you can look at it in a browser
    before publishing it.

    Just double-click preview.cmd. Your browser opens automatically.
    Close the black window when you have finished.

    Why a server is needed: the site loads data/*.json files, and browsers
    refuse to load those from a plain file:// address. This little server
    solves that. It is not published anywhere and nobody else can see it.
    ===========================================================================
#>

[CmdletBinding()]
param(
    [int]$Port = 8124,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.mjs'  = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.txt'  = 'text/plain; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.pdf'  = 'application/pdf'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.webmanifest' = 'application/manifest+json'
}

function Get-MimeType([string]$path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    if ($mimeTypes.ContainsKey($ext)) { return $mimeTypes[$ext] }
    return 'application/octet-stream'
}

# --- find a free port -------------------------------------------------------

function Test-PortFree([int]$p) {
    try {
        $test = New-Object System.Net.HttpListener
        $test.Prefixes.Add("http://localhost:$p/")
        $test.Start()
        $test.Stop()
        $test.Close()
        return $true
    }
    catch { return $false }
}

$attempt = 0
while (-not (Test-PortFree $Port) -and $attempt -lt 12) {
    $Port++
    $attempt++
}
if ($attempt -ge 12) {
    Write-Host ''
    Write-Host '  Could not find a free port between 8124 and 8136.' -ForegroundColor Red
    Write-Host '  Close any other preview window that may already be running, then try again.' -ForegroundColor Yellow
    Write-Host ''
    Read-Host '  Press Enter to close'
    exit 1
}

$root = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($root)
$listener.Start()

Write-Host ''
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host '   RCF English - local preview' -ForegroundColor Cyan
Write-Host '  ============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "   Your website is now at:  $root" -ForegroundColor Green
Write-Host ''
Write-Host '   Leave this window open while you look at the site.'
Write-Host '   To stop, close this window or press Ctrl+C.'
Write-Host ''
Write-Host '  ------------------------------------------------------------'
Write-Host ''

if (-not $NoBrowser) {
    Start-Process $root | Out-Null
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        $relative = $urlPath.TrimStart('/')

        # A folder address means the index.html inside it.
        if ($relative -eq '' -or $relative.EndsWith('/')) {
            $relative = $relative + 'index.html'
        }

        $filePath = Join-Path $ProjectRoot ($relative -replace '/', '\')

        # If the address has no extension and is not a file, try it as a folder.
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $asFolder = Join-Path $ProjectRoot (($relative -replace '/', '\') + '\index.html')
            if (Test-Path $asFolder -PathType Leaf) { $filePath = $asFolder }
        }

        # Keep everything inside the project folder.
        $fullProject = [System.IO.Path]::GetFullPath($ProjectRoot)
        $fullTarget = ''
        try { $fullTarget = [System.IO.Path]::GetFullPath($filePath) } catch { $fullTarget = '' }

        $status = 200
        $bytes = $null
        $mime = 'text/html; charset=utf-8'

        if ($fullTarget -and $fullTarget.StartsWith($fullProject) -and (Test-Path $fullTarget -PathType Leaf)) {
            $bytes = [System.IO.File]::ReadAllBytes($fullTarget)
            $mime = Get-MimeType $fullTarget
            Write-Host ("   200  " + $urlPath) -ForegroundColor DarkGray
        }
        else {
            $status = 404
            $notFound = Join-Path $ProjectRoot '404.html'
            if (Test-Path $notFound) {
                $bytes = [System.IO.File]::ReadAllBytes($notFound)
            }
            else {
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('<h1>404 - not found</h1>')
            }
            Write-Host ("   404  " + $urlPath) -ForegroundColor Yellow
        }

        $response.StatusCode = $status
        $response.ContentType = $mime
        $response.Headers.Add('Cache-Control', 'no-store')
        $response.ContentLength64 = $bytes.Length
        try {
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        catch {
            # The browser closed the connection early. Nothing to do.
        }
        $response.OutputStream.Close()
    }
}
finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
    Write-Host ''
    Write-Host '   Preview stopped.' -ForegroundColor Cyan
    Write-Host ''
}
