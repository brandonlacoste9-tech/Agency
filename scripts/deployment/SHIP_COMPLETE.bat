@echo off
REM SHIP_COMPLETE.bat - Launch the complete deployment script
REM This batch file checks for PowerShell 7+ and runs the deployment

echo.
echo ========================================
echo   BEE SHIP COMPLETE DEPLOYMENT
echo ========================================
echo.

REM Check if pwsh (PowerShell 7+) is available
where pwsh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell 7+ not found!
    echo.
    echo Please install PowerShell 7+ from:
    echo https://aka.ms/powershell
    echo.
    echo Or run: winget install --id Microsoft.PowerShell --source winget
    echo.
    pause
    exit /b 1
)

echo [OK] PowerShell 7+ detected
echo.
echo Starting deployment script...
echo.

REM Run the PowerShell deployment script
pwsh -ExecutionPolicy Bypass -File "%~dp0SHIP_COMPLETE_NOW.ps1"

echo.
echo Deployment script finished.
pause
