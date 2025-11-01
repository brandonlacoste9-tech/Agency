@echo off
REM SHIP_COMPLETE_NOW.bat - Beehive Complete Deployment
REM Windows batch wrapper for PowerShell 5.1+

echo.
echo  BEE BEEHIVE Complete Deployment
echo ================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0SHIP_COMPLETE_FINAL_WIN.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment script failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [SUCCESS] Ship complete! Your Beehive is ready.
echo.
pause
