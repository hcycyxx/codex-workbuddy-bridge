$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $node) { throw '没有找到 Node.js 22 或更高版本。' }
& $node (Join-Path $root 'tools\setup-codex-direct.mjs')
if ($LASTEXITCODE -ne 0) { throw '一键连接未完成。配置已经备份，请查看上面的提示。' }
