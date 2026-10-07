@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 ( py start.py & exit /b )
where python >nul 2>nul
if %errorlevel%==0 ( python start.py & exit /b )
echo.
echo Python 3 was not found on this PC.
echo Install it from https://www.python.org/downloads/  (tick "Add Python to PATH"),
echo then run this file again.
echo.
echo You can also just double-click index.html to open the app directly.
pause
