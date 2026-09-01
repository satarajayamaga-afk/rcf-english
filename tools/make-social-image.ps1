# =========================================================================
#  Draws the RCF English launch card used when the homepage is shared on
#  Facebook, WhatsApp, LinkedIn and similar.
#
#  Output: assets/img/social/og-countdown.png, 1200 x 630.
#
#  Composition notes
#
#  The four blocks are the point of the picture, so they sit high and near
#  the middle. Everything that matters is kept inside the central 630 x 630
#  square, which is what survives when a service crops the card to a square
#  or to a portrait shape in a mobile feed. The full 1200 x 630 is what
#  Facebook shows in the ordinary landscape link preview.
#
#  The blocks carry the launch moment - 17, 09, 2026, 6 PM - and NOT a
#  number of days remaining. These services cache a preview picture for a
#  long time, so a remaining-days figure would be wrong within a day and
#  would stay wrong in every share already made. The live ticking clock is
#  on the page itself, which is where the card sends people.
#
#  Run it with:  powershell -ExecutionPolicy Bypass -File tools\make-social-image.ps1
#  Only needed if the wording or the launch date changes.
# =========================================================================

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'assets\img\social\og-countdown.png'

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

function Measure-Tracked($graphics, [string]$text, $font, [single]$track) {
    $fmt = [System.Drawing.StringFormat]::GenericTypographic
    $one = $graphics.MeasureString('nn', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $two = $graphics.MeasureString('n n', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $spaceW = [Math]::Max(($two - $one), ($font.Size * 0.25))
    $total = 0
    foreach ($ch in $text.ToCharArray()) {
        if ($ch -eq ' ') { $total += $spaceW + $track }
        else { $total += $graphics.MeasureString([string]$ch, $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width + $track }
    }
    return ($total - $track)
}

# Draws text centred on $cx with even letter spacing.
function Draw-Tracked($graphics, [string]$text, $font, $brush, [single]$cx, [single]$y, [single]$track) {
    $fmt = [System.Drawing.StringFormat]::GenericTypographic
    $one = $graphics.MeasureString('nn', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $two = $graphics.MeasureString('n n', $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width
    $spaceW = [Math]::Max(($two - $one), ($font.Size * 0.25))
    $total = Measure-Tracked $graphics $text $font $track
    $x = $cx - ($total / 2)
    foreach ($ch in $text.ToCharArray()) {
        if ($ch -eq ' ') {
            $x += $spaceW + $track
            continue
        }
        $graphics.DrawString([string]$ch, $font, $brush, [System.Drawing.PointF]::new($x, $y), $fmt)
        $x += $graphics.MeasureString([string]$ch, $font, [System.Drawing.PointF]::new(0, 0), $fmt).Width + $track
    }
}

function Draw-Centred($graphics, [string]$text, $font, $brush, [single]$cx, [single]$y) {
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString($text, $font, $brush, [System.Drawing.RectangleF]::new(($cx - 600), $y, 1200, 200), $fmt)
    $fmt.Dispose()
}

# ------------------------------------------------------------- background

$bgRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $navyTop, $navyEnd, 100.0)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
$blend.Colors = @($navyTop, $navyMid, $navyEnd)
$blend.Positions = @(0.0, 0.55, 1.0)
$bg.InterpolationColors = $blend
$g.FillRectangle($bg, $bgRect)

# The teal glow sits behind the blocks rather than at the very top, so the
# focus of the picture is where the blocks are.
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(($W / 2) - 660, -180, 1320, 820)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glow.CenterPoint = New-Object System.Drawing.PointF(($W / 2), 250)
$glow.CenterColor = [System.Drawing.Color]::FromArgb(86, $teal)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $teal))
$g.FillPath($glow, $glowPath)

$cx = $W / 2

# --------------------------------------------- lockup: mark and the name

# Mark and wordmark on one line, so the top of the card costs 90px, not 210.
$markSize = 62
$nameFont = New-Object System.Drawing.Font('Georgia', 60, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$nameText = 'RCF ENGLISH'
$nameW = Measure-Tracked $g $nameText $nameFont 2
$gapAfterMark = 24
$lockupW = $markSize + $gapAfterMark + $nameW
$markX = $cx - ($lockupW / 2)
$markY = 40

$outer = New-RoundedPath $markX $markY $markSize $markSize 13
$navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 38, 71))
$g.FillPath($navyBrush, $outer)

$inner = New-RoundedPath ($markX + 4) ($markY + 4) ($markSize - 8) ($markSize - 8) 10
$markGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point([int]$markX, [int]$markY)),
    (New-Object System.Drawing.Point([int]($markX + $markSize), [int]($markY + $markSize))),
    $teal, $tealDark)
$g.FillPath($markGrad, $inner)

$markFont = New-Object System.Drawing.Font('Georgia', 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$whiteBrush = New-Object System.Drawing.SolidBrush($white)
Draw-Centred $g 'RCF' $markFont $whiteBrush ($markX + ($markSize / 2)) ($markY + 14)
$goldBrush = New-Object System.Drawing.SolidBrush($gold)
$g.FillPath($goldBrush, (New-RoundedPath ($markX + ($markSize / 2) - 15) ($markY + 42) 30 3 1.5))

Draw-Tracked $g $nameText $nameFont $whiteBrush ($markX + $markSize + $gapAfterMark + ($nameW / 2)) ($markY + 3) 2

# ---------------------------------------------------------------- eyebrow

$eyebrowFont = New-Object System.Drawing.Font('Segoe UI', 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
Draw-Tracked $g 'SOMETHING BIG IS COMING TO ENGLISH EDUCATION' $eyebrowFont $goldBrush $cx 128 3

# ------------------------------------------------------------- the blocks

# Four blocks in the shape the website uses. They are the largest thing on
# the card and they sit inside the central square, so a square or portrait
# crop keeps all four.
$blocks = @(
    @{ value = '17'; label = 'DAY' },
    @{ value = '09'; label = 'MONTH' },
    @{ value = '2026'; label = 'YEAR' }
)

$blockW = 178
$blockH = 238
$blockGap = 16
$stripW = ($blockW * $blocks.Count) + ($blockGap * ($blocks.Count - 1))
$stripX = $cx - ($stripW / 2)
$stripY = 170

$blockFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 255, 255, 255))
$blockPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(46, 255, 255, 255), 1.5)
$labelFont = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

# Each value is set as large as its block can hold. A fixed size would let a
# four-figure year run over the edge of the block and into its neighbour.
function Fit-Font($graphics, [string]$text, [single]$maxWidth, [single]$startSize) {
    $size = $startSize
    while ($size -gt 24) {
        $f = New-Object System.Drawing.Font('Georgia', $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $w = $graphics.MeasureString($text, $f, [System.Drawing.PointF]::new(0, 0), [System.Drawing.StringFormat]::GenericTypographic).Width
        if ($w -le $maxWidth) { return $f }
        $f.Dispose()
        $size -= 2
    }
    return (New-Object System.Drawing.Font('Georgia', 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel))
}

for ($i = 0; $i -lt $blocks.Count; $i++) {
    $bx = $stripX + ($i * ($blockW + $blockGap))
    $path = New-RoundedPath $bx $stripY $blockW $blockH 18
    $g.FillPath($blockFill, $path)
    $g.DrawPath($blockPen, $path)

    $v = [string]$blocks[$i].value
    $f = Fit-Font $g $v ($blockW - 30) 100
    # Sit each value on the same baseline whatever size it came out at.
    $vy = $stripY + 40 + ((100 - $f.Size) * 0.62)
    Draw-Centred $g $v $f $whiteBrush ($bx + ($blockW / 2)) $vy
    $f.Dispose()

    Draw-Tracked $g ([string]$blocks[$i].label) $labelFont $goldBrush ($bx + ($blockW / 2)) ($stripY + 190) 2
    $path.Dispose()
}

# ------------------------------------------------------------- the gold pill

# Sized to sit inside the central square as well, so a square crop keeps the
# whole launch date rather than shearing the first and last words off it.
$pillFont = New-Object System.Drawing.Font('Segoe UI', 21, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
# The middle dot is written by code point so the file stays plain ASCII and
# PowerShell cannot mis-read it.
$pillText = 'LAUNCHING 17 SEPTEMBER 2026 ' + [char]0x00B7 + ' 6.00 P.M.'
$pillTextW = Measure-Tracked $g $pillText $pillFont 3
$pillW = $pillTextW + 64
$pillH = 58
$pillX = $cx - ($pillW / 2)
$pillY = 462
$pill = New-RoundedPath $pillX $pillY $pillW $pillH ($pillH / 2)
$pillFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 224, 168, 60))
$g.FillPath($pillFill, $pill)
$goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(165, $gold), 2)
$g.DrawPath($goldPen, $pill)
Draw-Tracked $g $pillText $pillFont $goldBrush $cx ($pillY + 17) 3

# ---------------------------------------------------- gold rule at the foot

$footPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, $gold), 3)
$g.DrawLine($footPen, 0, $H - 2, $W, $H - 2)

# ------------------------------------------------------------------- save

$dir = Split-Path -Parent $out
if (-not (Test-Path $dir)) { [void](New-Item -ItemType Directory -Path $dir -Force) }
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

foreach ($d in @($g, $bmp, $bg, $glow, $glowPath, $navyBrush, $markGrad, $markFont, $whiteBrush, $goldBrush,
        $nameFont, $eyebrowFont, $lineFont, $mistBrush, $pillFont, $goldPen, $pillFill, $footPen,
        $outer, $inner, $pill, $blockFill, $blockPen, $labelFont)) {
    if ($d -and $d.Dispose) { $d.Dispose() }
}

Write-Host "Wrote $out ($W x $H)"
