# Regenerates the PWA raster icons from the KLYRO brand mark.
# Requires Windows PowerShell with System.Drawing (no external dependencies).
Add-Type -AssemblyName System.Drawing

$outputDir = Join-Path $PSScriptRoot "..\public\icons"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$background = [System.Drawing.Color]::FromArgb(8, 11, 14)
$accent = [System.Drawing.Color]::FromArgb(185, 243, 107)
$ink = [System.Drawing.Color]::FromArgb(11, 16, 8)

function New-Icon {
  param(
    [int]$Size,
    [string]$FileName,
    [switch]$Maskable
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear($background)

  if ($Maskable) {
    # Maskable icons keep the mark inside the central 80% safe zone.
    $fontSize = [int]($Size * 0.44)
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush($accent)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $graphics.DrawString("K", $font, $brush, $rect, $format)
  }
  else {
    $inset = [int]($Size * 0.10)
    $tileSize = $Size - (2 * $inset)
    $radius = [int]($Size * 0.18)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($inset, $inset, $d, $d, 180, 90)
    $path.AddArc(($Size - $inset - $d), $inset, $d, $d, 270, 90)
    $path.AddArc(($Size - $inset - $d), ($Size - $inset - $d), $d, $d, 0, 90)
    $path.AddArc($inset, ($Size - $inset - $d), $d, $d, 90, 90)
    $path.CloseFigure()

    $accentBrush = New-Object System.Drawing.SolidBrush($accent)
    $graphics.FillPath($accentBrush, $path)

    $font = New-Object System.Drawing.Font("Segoe UI", [int]($Size * 0.50), [System.Drawing.FontStyle]::Bold)
    $inkBrush = New-Object System.Drawing.SolidBrush($ink)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $graphics.DrawString("K", $font, $inkBrush, $rect, $format)
  }

  $pathOut = Join-Path $outputDir $FileName
  $bitmap.Save($pathOut, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Generated $pathOut"

  $graphics.Dispose()
  $bitmap.Dispose()
}

New-Icon -Size 192 -FileName "icon-192.png"
New-Icon -Size 512 -FileName "icon-512.png"
New-Icon -Size 512 -FileName "icon-maskable-512.png" -Maskable
New-Icon -Size 180 -FileName "apple-touch-icon.png"
