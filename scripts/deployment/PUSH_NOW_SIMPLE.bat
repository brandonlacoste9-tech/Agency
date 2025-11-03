@echo off
echo ========================================
echo   BEE-SHIP DEPLOYMENT PUSH
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Staging all changes...
git add -A

echo [2/4] Committing...
git commit -m "feat(bee-ship): complete autonomous publishing system with Instagram, YouTube, TikTok stubs, payments, crypto feed, and full deployment stack"

echo [3/4] Pushing to GitHub...
git push origin main

echo [4/4] DONE! Netlify auto-deploy triggered.
echo.
echo ========================================
echo   Your Bee swarm is deploying now!
echo   Check: https://app.netlify.com
echo ========================================
echo.
pause
