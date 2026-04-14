@echo off
setlocal
cd /d "%~dp0"
python "%~dp0scripts\excel_sync_gui.py"
if errorlevel 1 (
  pause
)
