param([int]$Port = 8900, [switch]$NoWindow, [string]$DataDirectory)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.runtime'
$serverPath = Join-Path $projectRoot 'src\server.js'
if ($Port -lt 1024 -or $Port -gt 65535) { throw '端口应在 1024–65535 之间。' }
if (-not $DataDirectory) { $DataDirectory = Join-Path $projectRoot 'data' }
$DataDirectory = [IO.Path]::GetFullPath($DataDirectory)
$chromeChoices = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
$chromePath = $chromeChoices | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $NoWindow -and -not $chromePath) { throw '没有找到 Chrome。请安装 Chrome 后重新打开桌面图标。' }
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw '没有找到 Node.js。需要 Node.js 22 或更高版本。' }
$serviceUrl = "http://127.0.0.1:$Port"
$existing = $null
$hash = [Security.Cryptography.SHA256]::Create()
try { $instanceId = ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot)))).Replace('-','').ToLowerInvariant().Substring(0,16) } finally { $hash.Dispose() }
try { $existing = Invoke-RestMethod "$serviceUrl/health" -TimeoutSec 2 } catch {}
if ($existing -and ($existing.service -ne 'workbuddy-plus-bridge' -or $existing.instanceId -ne $instanceId)) { throw "端口 $Port 正由其他程序或版本使用。请先停止那个版本，再打开 v4；没有改动原服务。" }
if (-not $existing) {
    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss_fff'
    $outLog = Join-Path $runtimeRoot "start_$stamp.out.log"
    $errLog = Join-Path $runtimeRoot "start_$stamp.err.log"
    $previousDataDir = $env:WB_PLUS_DATA
    try {
        $env:WB_PLUS_DATA = $DataDirectory
        $child = Start-Process -FilePath $nodeCommand.Source -ArgumentList @("`"$serverPath`"", '--port', "$Port") -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    } finally { $env:WB_PLUS_DATA = $previousDataDir }
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        $child.Refresh()
        if ($child.HasExited) { throw "启动失败，请查看日志：$errLog" }
        try { $health = Invoke-RestMethod "$serviceUrl/health" -TimeoutSec 1; if ($health.service -eq 'workbuddy-plus-bridge' -and $health.instanceId -eq $instanceId) { $ready = $true; break } } catch {}
    }
    if (-not $ready) { throw "服务未及时启动，请查看日志：$errLog" }
}
if (-not $NoWindow) {
    $profilePath = Join-Path $runtimeRoot 'chrome-profile'
    $chromeArgs = @("--app=$serviceUrl", "--user-data-dir=`"$profilePath`"", '--no-first-run', '--no-default-browser-check', '--window-size=1200,820')
    Start-Process -FilePath $chromePath -ArgumentList $chromeArgs | Out-Null
}
Write-Host "管理页：$serviceUrl"
Write-Host '关闭窗口后桥接继续运行。停止请点击窗口右上角或桌面上的停止图标。'
