@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Restore-CodexDirect.ps1" -Backup "%~1"
if errorlevel 1 pause
