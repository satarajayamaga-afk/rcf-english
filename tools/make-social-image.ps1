# =========================================================================
#  Draws the RCF English launch card used when the homepage is shared on
#  Facebook, WhatsApp, LinkedIn and similar.
#
#  Output: assets/img/social/og-launch-card-6pm.png, 1200 x 630, the size those
#  services expect.
#
#  It deliberately carries NO countdown numbers. Facebook caches a preview
#  image for a long time, so a number baked into the picture would go stale
#  and then be wrong in every share that had already been made.
#
#  Run it with:  powershell -ExecutionPolicy Bypass -File tools\make-social-image.ps1
#  Only needed if the wording or the launch date changes.
# =========================================================================

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'assets\img\social\og-launch-card-6pm.png'

$W = 1200
$H = 630

# Same palette as the countdown band in assets/css/styles.css
$navyTop = [System.Drawing.Color]::FromArgb(8, 21, 39)      # #081527
$navyMid = [System.Drawing.Color]::FromArgb(11, 28, 52)     # #0b1c34
$navyEnd = [System.Drawing.Color]::FromArgb(7, 31, 44)      # #071f2c
$teal = [System.Drawing.Color]::FromArgb(14, 124, 102)      # #0e7c66
$tealDark = [System.Drawing.Color]::FromArgb(8, 80, 63)     # #08503f
$gold = [System.Drawing.Color]::FromArgb(224, 168, 60)      # #e0a83c
$mist = [System.Drawing.Color]::FromArgb(201, 214, 232)     # #c9d6e8
$white = [System.Drawing.Color]::White

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# ---------------------------------------------------------------- helpers

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

# Draws text centred on $cx with even letter spacing, and returns its width.
function Draw-Tracked($graphics, [string]$text, $font, $brush, [single]$cx, [single]$y, [single]$track) {
    $fmt = [System.Drawing.StringFormat]::GenericTypographic
    # A space measured on its own comes back as almost nothing under
    # GenericTypographic, which would run the words together. Measure it
    # between two letters instead and subtract them.
    $one = $graphics.MeasureString('nn', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $two = $graphics.MeasureString('n n', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $spaceW = [Math]::Max(($two - $one), ($font.Size * 0.25))
    $widths = @()
    $total = 0
    foreach ($ch in $text.ToCharArray()) {
        if ($ch -eq ' ') {
            $w = $spaceW
        }
        else {
            $w = $graphics.MeasureString([string]$ch, $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
        }
        $widths += $w
        $total += $w + $track
    }
    $total -= $track
    $x = $cx - ($total / 2)
    for ($i = 0; $i -lt $text.Length; $i++) {
        $graphics.DrawString([string]$text[$i], $font, $brush, [System.Drawing.PointF]::new($x, $y), $fmt)
        $x += $widths[$i] + $track
    }
    return $total
}

function Draw-Centred($graphics, [string]$text, $font, $brush, [single]$cx, [single]$y) {
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString($text, $font, $brush, [System.Drawing.RectangleF]::new(0, $y, $W, 200), $fmt)
    $fmt.Dispose()
}

# ------------------------------------------------------------- background

$bgRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
# Built from the rectangle and an angle, so the gradient spans the whole
# card. A short gradient vector would tile and leave a diagonal seam.
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect, $navyTop, $navyEnd, 100.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
$blend.Colors = @($navyTop, $navyMid, $navyEnd)
$blend.Positions = @(0.0, 0.55, 1.0)
$bg.InterpolationColors = $blend
$g.FillRectangle($bg, $bgRect)

# The teal glow the countdown band carries above its numbers.
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(($W / 2) - 620, -430, 1240, 900)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glow.CenterPoint = New-Object System.Drawing.PointF(($W / 2), 40)
$glow.CenterColor = [System.Drawing.Color]::FromArgb(78, $teal)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $teal))
$g.FillPath($glow, $glowPath)

# ------------------------------------------------------------- brand mark

$markSize = 104
$markX = ($W - $markSize) / 2
$markY = 74

$outer = New-RoundedPath $markX $markY $markSize $markSize 22
$navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 38, 71))
$g.FillPath($navyBrush, $outer)

$inner = New-RoundedPath ($markX + 7) ($markY + 7) ($markSize - 14) ($markSize - 14) 16
$markGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point([int]$markX, [int]$markY)),
    (New-Object System.Drawing.Point([int]($markX + $markSize), [int]($markY + $markSize))),
    $teal, $tealDark)
$g.FillPath($markGrad, $inner)

$markFont = New-Object System.Drawing.Font('Georgia', 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$whiteBrush = New-Object System.Drawing.SolidBrush($white)
Draw-Centred $g 'RCF' $markFont $whiteBrush ($W / 2) ($markY + 24)

$goldBrush = New-Object System.Drawing.SolidBrush($gold)
$g.FillPath($goldBrush, (New-RoundedPath (($W / 2) - 26) ($markY + 70) 52 5 2.5))

# ------------------------------------------------------------------ words

# 1. The name, the largest thing on the card.
$nameFont = New-Object System.Drawing.Font('Georgia', 96, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
[void](Draw-Tracked $g 'RCF ENGLISH' $nameFont $whiteBrush ($W / 2) 218 3)

# 2. The promise.
$lineFont = New-Object System.Drawing.Font('Georgia', 40, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)
$mistBrush = New-Object System.Drawing.SolidBrush($mist)
Draw-Centred $g 'Something Big Is Coming to English Education' $lineFont $mistBrush ($W / 2) 350

# 3. The date, in the gold pill the countdown uses.
$pillFont = New-Object System.Drawing.Font('Segoe UI', 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
# The middle dot is written by code point so the file stays plain ASCII and
# PowerShell cannot mis-read it.
$pillText = 'LAUNCHING 17 SEPTEMBER 2026 ' + [char]0x00B7 + ' 6.00 P.M.'
$fmtT = [System.Drawing.StringFormat]::GenericTypographic
$pillTextW = 0
foreach ($ch in $pillText.ToCharArray()) {
    $pillTextW += $g.MeasureString([string]$ch, $pillFont, [System.Drawing.PointF]::new(0, 0), $fmtT).Width + 3
}
$pillW = $pillTextW + 76
$pillH = 66
$pillX = ($W - $pillW) / 2
$pillY = 452
$pill = New-RoundedPath $pillX $pillY $pillW $pillH ($pillH / 2)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, $gold), 2)
$g.DrawPath($goldPen, $pill)
[void](Draw-Tracked $g $pillText $pillFont $goldBrush ($W / 2) ($pillY + 18) 3)

# ---------------------------------------------------- gold rule at the foot

$footPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, $gold), 3)
$g.DrawLine($footPen, 0, $H - 2, $W, $H - 2)

# ------------------------------------------------------------------- save

$dir = Split-Path -Parent $out
if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory -Path $dir -Force) }
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

foreach ($d in @($g, $bmp, $bg, $glow, $glowPath, $navyBrush, $markGrad, $markFont, $whiteBrush, $goldBrush,
        $nameFont, $lineFont, $mistBrush, $pillFont, $goldPen, $footPen, $outer, $inner, $pill)) {
    if ($d -and $d.Dispose) { $d.Dispose() }
}

Write-Host "Wrote $out ($W x $H)"
