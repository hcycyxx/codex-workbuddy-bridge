param([switch]$NoWindow)
$ErrorActionPreference = 'Stop'
$targetRoot = Split-Path $PSScriptRoot -Parent
$sourceRoot = Join-Path (Split-Path $targetRoot -Parent) 'WorkBuddy增强桥接_v2_20261109'
$sourceData = Join-Path $sourceRoot 'data'
$targetData = Join-Path $targetRoot 'data'
if (Test-Path -LiteralPath $targetData) { throw 'v3 已有独立数据目录，未覆盖；请直接启动 v3。' }
if (-not (Test-Path -LiteralPath (Join-Path $sourceRoot 'Stop-Bridge.ps1'))) { throw '未找到已确认的 v2 目录，未进行切换。' }
$health = $null
try { $health = Invoke-RestMethod 'http://127.0.0.1:8900/health' -TimeoutSec 2 } catch {}
$hash = [Security.Cryptography.SHA256]::Create()
try { $sourceId = ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($sourceRoot)))).Replace('-','').ToLowerInvariant().Substring(0,16) } finally { $hash.Dispose() }
if ($health -and ($health.service -ne 'workbuddy-plus-bridge' -or $health.instanceId -ne $sourceId)) { throw '8900 端口与已确认的 v2 不匹配，没有停止其他服务。' }
$wasRunning = [bool]$health
try {
    if ($wasRunning) {
        & (Join-Path $sourceRoot 'Stop-Bridge.ps1')
        $stopped = $false
        for ($attempt=0; $attempt -lt 100; $attempt++) {
            Start-Sleep -Milliseconds 200
            $stillListening = $false
            try { $null = Invoke-RestMethod 'http://127.0.0.1:8900/health' -TimeoutSec 1; $stillListening = $true } catch {}
            if (-not $stillListening -and -not (Test-Path -LiteralPath (Join-Path $sourceData 'bridge.lock'))) { $stopped = $true; break }
        }
        if (-not $stopped) { throw 'v2 仍在结束请求，未复制数据。请稍后再切换。' }
    }
    if (Test-Path -LiteralPath $sourceData) {
        New-Item -ItemType Directory -Path $targetData | Out-Null
        Get-ChildItem -LiteralPath $sourceData -Force | Where-Object { $_.Name -ne 'bridge.lock' -and $_.Extension -ne '.tmp' } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $targetData -Recurse }
    }
    if ($NoWindow) { & (Join-Path $targetRoot 'Start-Bridge.ps1') -NoWindow } else { & (Join-Path $targetRoot 'Start-Bridge.ps1') }
    & (Join-Path $PSScriptRoot 'Install-Shortcuts.ps1')
    Write-Output '已切换至 v3，账号和记录已复制保留，旧版文件未改动。'
} catch {
    if ($wasRunning) {
        try {
            $current = $null
            try { $current = Invoke-RestMethod 'http://127.0.0.1:8900/health' -TimeoutSec 2 } catch {}
            if (-not $current) { & (Join-Path $sourceRoot 'Start-Bridge.ps1') -NoWindow }
        } catch {}
    }
    throw
}
