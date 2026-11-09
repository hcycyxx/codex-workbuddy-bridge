$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$output = Join-Path $projectRoot 'WorkBuddy积分管理_v3.exe'
if (Test-Path -LiteralPath $output) { throw 'v3 启动程序已存在，未覆盖；请在新版本目录构建。' }
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
& $compiler /nologo /target:winexe /optimize+ /platform:anycpu /codepage:65001 /reference:System.Windows.Forms.dll "/win32icon:$(Join-Path $PSScriptRoot 'workbuddy.ico')" "/out:$output" (Join-Path $PSScriptRoot 'Launcher.cs')
if ($LASTEXITCODE -ne 0) { throw 'v3 启动程序构建失败。' }
Write-Output 'v3 启动程序已生成，复用原版图标。'
