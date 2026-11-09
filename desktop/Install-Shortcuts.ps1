$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$target = Join-Path $projectRoot 'CodexWorkBuddyBridge.exe'
$icon = Join-Path $PSScriptRoot 'workbuddy.ico'
if (-not (Test-Path -LiteralPath $target)) { throw '请先构建桌面启动程序。' }
$desktopPath = [Environment]::GetFolderPath('Desktop')
$shell = New-Object -ComObject WScript.Shell
$installed = @()
foreach ($entry in @(@{Name='Codex 桥接 WorkBuddy v4';Args='';Description='打开账号、余额、模型倍率和扣费记录；关闭窗口后继续运行'},@{Name='停止 Codex WorkBuddy 桥接 v4';Args='--stop';Description='停止增强桥接，保留账号和扣费记录'})) {
    $name = $entry.Name
    $path = Join-Path $desktopPath "$name.lnk"
    if (Test-Path -LiteralPath $path) { $path = Join-Path $desktopPath ("$name`_" + (Get-Date -Format 'yyyyMMdd_HHmmss_fff') + '.lnk') }
    $shortcut = $shell.CreateShortcut($path)
    $shortcut.TargetPath = $target; $shortcut.Arguments = $entry.Args; $shortcut.WorkingDirectory = $projectRoot; $shortcut.IconLocation = "$icon,0"; $shortcut.Description = $entry.Description; $shortcut.WindowStyle = 1
    $shortcut.Save(); $installed += $path
}
$installed | ForEach-Object { Write-Output $_ }
