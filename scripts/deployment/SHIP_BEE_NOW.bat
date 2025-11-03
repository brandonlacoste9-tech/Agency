@echo off
REM SHIP_BEE_NOW.bat - Deploy Bee-ship extension
REM Works with Windows PowerShell 5.1 (no pwsh required)

echo.
echo === Bee-Ship Deployment ===
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& {^
    $ErrorActionPreference = 'Stop';^
    Write-Host 'Creating directories...' -ForegroundColor Cyan;^
    New-Item -ItemType Directory -Path lib\platforms -Force | Out-Null;^
    New-Item -ItemType Directory -Path netlify\functions -Force | Out-Null;^
    Write-Host 'Creating files...' -ForegroundColor Yellow;^
    git add -A;^
    git commit -m 'feat(bee-ship): add platform modules and Netlify function';^
    git push origin main;^
    Write-Host 'Pushed to GitHub - Netlify is deploying!' -ForegroundColor Green;^
    Write-Host '';^
    Write-Host 'Monitor at: https://app.netlify.com/' -ForegroundColor Cyan^
}"

echo.
echo Done! Your site is deploying now.
pause
