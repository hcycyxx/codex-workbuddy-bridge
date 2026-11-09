$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$appPath = Join-Path $projectRoot 'WorkBuddy积分管理.exe'
$iconPath = Join-Path $PSScriptRoot 'workbuddy.ico'
$publicRoot = Join-Path $projectRoot 'public'
$outputs = @($appPath, $iconPath, (Join-Path $publicRoot 'favicon.ico'), (Join-Path $publicRoot 'app-icon-192.png'), (Join-Path $publicRoot 'app-icon-512.png'))
foreach ($output in $outputs) { if (Test-Path -LiteralPath $output) { throw "目标已存在，为保留现有产物请在新版本目录构建：$output" } }
Add-Type -AssemblyName System.Drawing
$frames = @()
foreach ($size in @(16,32,48,64,128,192,256,512)) {
    $bitmap = New-Object Drawing.Bitmap($size,$size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($size / 256.0),($size / 256.0))
    $path = New-Object Drawing.Drawing2D.GraphicsPath
    $path.AddArc(8,8,72,72,180,90); $path.AddArc(176,8,72,72,270,90); $path.AddArc(176,176,72,72,0,90); $path.AddArc(8,176,72,72,90,90); $path.CloseFigure()
    $brush = New-Object Drawing.SolidBrush([Drawing.ColorTranslator]::FromHtml('#214c40'))
    $graphics.FillPath($brush,$path)
    $pen = New-Object Drawing.Pen([Drawing.ColorTranslator]::FromHtml('#f3f5f0'),19)
    $pen.StartCap = [Drawing.Drawing2D.LineCap]::Round; $pen.EndCap = [Drawing.Drawing2D.LineCap]::Round; $pen.LineJoin = [Drawing.Drawing2D.LineJoin]::Round
    $points = [Drawing.PointF[]]@((New-Object Drawing.PointF(49,80)),(New-Object Drawing.PointF(82,177)),(New-Object Drawing.PointF(128,113)),(New-Object Drawing.PointF(174,177)),(New-Object Drawing.PointF(207,80)))
    $graphics.DrawLines($pen,$points)
    $memory = New-Object IO.MemoryStream
    $bitmap.Save($memory,[Drawing.Imaging.ImageFormat]::Png)
    $png = $memory.ToArray()
    if ($size -eq 192 -or $size -eq 512) { [IO.File]::WriteAllBytes((Join-Path $publicRoot "app-icon-$size.png"),$png) }
    if ($size -ne 512) { $frames += [PSCustomObject]@{Size=$size;Bytes=$png} }
    $memory.Dispose(); $pen.Dispose(); $brush.Dispose(); $path.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$stream = [IO.File]::Open($iconPath,[IO.FileMode]::CreateNew)
$writer = New-Object IO.BinaryWriter($stream)
try {
    $writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$frames.Count)
    $offset = 6 + 16 * $frames.Count
    foreach ($frame in $frames) {
        $dim = if ($frame.Size -eq 256) {0} else {$frame.Size}
        $writer.Write([byte]$dim); $writer.Write([byte]$dim); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([UInt16]1); $writer.Write([UInt16]32); $writer.Write([UInt32]$frame.Bytes.Length); $writer.Write([UInt32]$offset)
        $offset += $frame.Bytes.Length
    }
    foreach ($frame in $frames) { $writer.Write([byte[]]$frame.Bytes) }
} finally { $writer.Dispose(); $stream.Dispose() }
Copy-Item -LiteralPath $iconPath -Destination (Join-Path $publicRoot 'favicon.ico')
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
& $compiler /nologo /target:winexe /optimize+ /platform:anycpu /reference:System.Windows.Forms.dll "/win32icon:$iconPath" "/out:$appPath" (Join-Path $PSScriptRoot 'Launcher.cs')
if ($LASTEXITCODE -ne 0) { throw '桌面启动程序构建失败。' }
Write-Output '桌面启动程序及图标已生成。'
