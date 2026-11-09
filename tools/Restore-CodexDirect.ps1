param([Parameter(Mandatory = $true)][string]$Backup)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { throw '没有找到 Node.js 22 或更高版本。' }
if (-not (Test-Path -LiteralPath $Backup)) { throw "备份文件不存在：$Backup" }
& $node (Join-Path $root 'tools\setup-codex-direct.mjs') --restore --backup $Backup
if ($LASTEXITCODE -ne 0) { throw '还原未完成。' }
