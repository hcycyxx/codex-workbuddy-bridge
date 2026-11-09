param([string]$DataDirectory)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
if (-not $DataDirectory) { $DataDirectory = Join-Path $projectRoot 'data' }
$lockPath = Join-Path ([IO.Path]::GetFullPath($DataDirectory)) 'bridge.lock'
if (-not (Test-Path -LiteralPath $lockPath)) { Write-Host '没有找到本项目运行记录。'; exit 0 }
$bridgePid = [int](Get-Content -LiteralPath $lockPath -Raw)
$serverPath = Join-Path $projectRoot 'src\server.js'
$processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$bridgePid" -ErrorAction SilentlyContinue
if (-not $processInfo) { Write-Host '服务已经停止；下次启动会清理过期运行记录。'; exit 0 }
if ($processInfo.Name -ne 'node.exe' -or -not $processInfo.CommandLine.Contains($serverPath)) { throw '进程与本项目不匹配，已停止操作。' }
$portMatch = [regex]::Match($processInfo.CommandLine, '--port\s+(\d+)')
if (-not $portMatch.Success) { throw '无法确认服务端口，未强行结束进程。' }
$port = [int]$portMatch.Groups[1].Value
$serviceUrl = "http://127.0.0.1:$port"
$health = Invoke-RestMethod "$serviceUrl/health" -TimeoutSec 3
$hash = [Security.Cryptography.SHA256]::Create()
try { $instanceId = ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot)))).Replace('-','').ToLowerInvariant().Substring(0,16) } finally { $hash.Dispose() }
if ($health.service -ne 'workbuddy-plus-bridge' -or $health.instanceId -ne $instanceId) { throw '服务与本项目不匹配，没有停止其他版本。' }
$session = Invoke-RestMethod "$serviceUrl/api/session" -TimeoutSec 3
$null = Invoke-RestMethod "$serviceUrl/api/shutdown" -Method Post -Headers @{'X-Admin-Token'=$session.token} -ContentType 'application/json' -Body '{}' -TimeoutSec 5
Write-Host '已通知增强桥接结束请求并保存记录；关闭完成后会自动退出。原桥接未受影响。'
