@echo off
REM SHIP_IT_NOW.bat - One-command deployment
REM Run this to deploy the complete Bee-ship package

echo.
echo ========================================
echo    BEE-SHIP DEPLOYMENT - ONE COMMAND
echo ========================================
echo.

REM Check if PowerShell 7+ is available
where pwsh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PowerShell 7+ (pwsh) not found
    echo.
    echo Install PowerShell 7:
    echo   winget install Microsoft.PowerShell
    echo.
    echo Or download from: https://aka.ms/powershell
    pause
    exit /b 1
)

echo [1/3] Running deployment script...
echo.
pwsh -File deploy-complete.ps1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Deployment script failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo.
echo [2/3] Ready to push to GitHub
echo.
set /p PUSH_NOW="Push to GitHub now? (y/N): "
if /i "%PUSH_NOW%"=="y" (
    echo.
    echo Pushing to GitHub...
    pwsh -File push-and-deploy.ps1 -CreatePR
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [WARNING] Push had issues - check output above
    )
) else (
    echo.
    echo Skipped push. Run manually when ready:
    echo   pwsh ./push-and-deploy.ps1 -CreatePR
)

echo.
echo ========================================
echo.
echo [3/3] Next Steps
echo.
echo 1. Set environment variables in Netlify:
echo    https://app.netlify.com ^> Site Settings ^> Environment
echo.
echo 2. See DEPLOYMENT_VERIFICATION.md for complete checklist
echo.
echo 3. Merge PR or deploy branch to trigger Netlify build
echo.
echo 4. Test function at:
echo    https://your-site.netlify.app/.netlify/functions/bee-ship
echo.
echo ========================================
echo.
echo    DEPLOYMENT PACKAGE READY! 
echo.
echo ========================================
echo.
pause
