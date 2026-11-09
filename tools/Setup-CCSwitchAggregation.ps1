$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { throw '没有找到 Node.js 22 或更高版本。' }
& $node (Join-Path $root 'tools\setup-ccswitch-aggregation.mjs')
if ($LASTEXITCODE -ne 0) { throw '聚合模式配置未完成。未检测到聚合模式时不会改动任何配置。' }
