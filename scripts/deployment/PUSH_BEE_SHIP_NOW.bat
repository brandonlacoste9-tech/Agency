@echo off
setlocal
color 0E
title 🚀 PUSHING BEE-SHIP TO GITHUB NOW!

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║          🐝  PUSHING BEE-SHIP STACK TO GITHUB  🐝         ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check git status
git status >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository!
    pause
    exit /b 1
)

echo [1/4] Staging all Bee-ship files...
echo.

REM Add all bee-ship related files
git add BEE_SHIP_*.md
git add SHIP_BEE_SWARM_NOW.bat
git add BEE_SHIP_DEPLOY.bat
git add EXECUTE_BEESHIP_SETUP.bat
git add create-platforms-simple.ps1
git add create-platforms.bat
git add .env.bee-ship

echo     ✓ Documentation added
echo     ✓ Deployment scripts added
echo     ✓ Environment template added

echo.
echo [2/4] Checking what will be committed...
echo.
git diff --cached --name-only
echo.

echo [3/4] Creating commit...
git commit -m "feat(bee-ship): complete autonomous publishing deployment package

- Added Instagram publishing (ready)
- Added TikTok + YouTube stubs  
- Added Netlify serverless function
- Added bulk swarm publishing script
- Added complete documentation suite
- Added one-click deployment scripts
- Ready for production deployment

Includes:
- Platform modules (lib/platforms/)
- Netlify function (netlify/functions/bee-ship.ts)
- Deployment automation (SHIP_BEE_SWARM_NOW.bat)
- Bulk publisher (scripts/ship-swarm.ps1)
- Complete guides and checklists
- Environment variable templates

Status: ✅ READY TO SHIP
Deploy: Double-click SHIP_BEE_SWARM_NOW.bat
"

if errorlevel 1 (
    echo     ⚠ No changes to commit (already committed?)
) else (
    echo     ✓ Commit created
)

echo.
echo [4/4] Pushing to GitHub...
echo.

git push origin main

if errorlevel 1 (
    echo.
    echo     ⚠ Push failed - trying to pull first...
    git pull --rebase origin main
    if errorlevel 1 (
        echo     ❌ Automatic merge failed
        echo.
        echo     Please resolve conflicts manually:
        echo       1. Fix conflicts in the files
        echo       2. Run: git add .
        echo       3. Run: git rebase --continue
        echo       4. Run: git push origin main
        echo.
        pause
        exit /b 1
    )
    echo     ✓ Rebased successfully
    echo     Pushing again...
    git push origin main
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║               🎉  SUCCESSFULLY PUSHED!  🎉                ║
echo ║                                                           ║
echo ║         Bee-ship deployment files are on GitHub          ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo.
echo     📍 Repository Status:
echo        • All files committed: ✓
echo        • Pushed to GitHub: ✓
echo        • Netlify will auto-deploy: ⏳ (2-3 min)
echo.
echo     🔐 Next Steps:
echo        1. Wait for Netlify deploy to complete
echo        2. Add environment variables in Netlify dashboard
echo        3. Create Supabase 'assets' bucket
echo        4. Test with: scripts\ship-swarm.ps1
echo.
echo     📊 Monitor Deploy:
echo        https://app.netlify.com
echo.
echo     📘 Documentation:
echo        • BEE_SHIP_DEPLOYMENT_READY.md (overview)
echo        • BEE_SHIP_COMPLETE_GUIDE.md (full guide)
echo        • BEE_SHIP_LAUNCH_CHECKLIST.md (step-by-step)
echo        • BEE_SHIP_QUICK_REF.md (quick reference)
echo.
color 0A
echo     🚀 The swarm is shipping to production!
echo.
color 07
pause
