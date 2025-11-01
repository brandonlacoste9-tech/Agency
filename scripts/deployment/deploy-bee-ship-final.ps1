#!/usr/bin/env pwsh
# deploy-bee-ship-final.ps1
# Final deployment script for Bee-Ship system

Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🐝  BEE-SHIP DEPLOYMENT SCRIPT  🐝               ║
║                                                          ║
║    Autonomous Social Publishing System                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Yellow

Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in Beehive root directory" -ForegroundColor Red
    Write-Host "Please run this from: C:\Users\north\OneDrive\Documents\GitHub\Beehive" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ In Beehive directory" -ForegroundColor Green
Write-Host ""

# Create lib/platforms directory if it doesn't exist
Write-Host "Step 1: Creating lib/platforms directory..." -ForegroundColor Cyan
if (-not (Test-Path "lib\platforms")) {
    New-Item -ItemType Directory -Path "lib\platforms" -Force | Out-Null
    Write-Host "  ✓ Created lib\platforms" -ForegroundColor Green
} else {
    Write-Host "  ✓ lib\platforms already exists" -ForegroundColor Green
}

Write-Host ""

# Check for platform files
Write-Host "Step 2: Checking platform module files..." -ForegroundColor Cyan
$platformFiles = @("instagram.ts", "youtube.ts", "tiktok.ts")
$missingFiles = @()

foreach ($file in $platformFiles) {
    $path = "lib\platforms\$file"
    if (Test-Path $path) {
        Write-Host "  ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $file missing" -ForegroundColor Yellow
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "📝 Missing platform files. Creating them now..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run: .\create-platforms.bat" -ForegroundColor Cyan
    Write-Host "OR manually create the files from BEE_SHIP_FILES_COMPLETE.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""

# Check dependencies
Write-Host "Step 3: Checking dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$requiredDeps = @{
    "googleapis" = "YouTube publishing"
    "@supabase/supabase-js" = "Asset storage"
    "@netlify/functions" = "Function types"
}

foreach ($dep in $requiredDeps.Keys) {
    if ($packageJson.dependencies.$dep -or $packageJson.devDependencies.$dep) {
        Write-Host "  ✓ $dep installed ($($requiredDeps[$dep]))" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $dep missing - $($requiredDeps[$dep])" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check Netlify function
Write-Host "Step 4: Checking Netlify function..." -ForegroundColor Cyan
if (Test-Path "netlify\functions\bee-ship.ts") {
    $size = (Get-Item "netlify\functions\bee-ship.ts").Length
    Write-Host "  ✓ bee-ship.ts exists ($([Math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "  ❌ bee-ship.ts missing!" -ForegroundColor Red
}

Write-Host ""

# Check scripts
Write-Host "Step 5: Checking deployment scripts..." -ForegroundColor Cyan
if (Test-Path "scripts\ship-swarm.ps1") {
    Write-Host "  ✓ ship-swarm.ps1 exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ ship-swarm.ps1 missing" -ForegroundColor Yellow
}

if (Test-Path "scripts\ship-swarm.sh") {
    Write-Host "  ✓ ship-swarm.sh exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ ship-swarm.sh missing" -ForegroundColor Yellow
}

Write-Host ""

# Git status
Write-Host "Step 6: Git status..." -ForegroundColor Cyan
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "  📝 Uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
} else {
    Write-Host "  ✓ Working directory clean" -ForegroundColor Green
}

Write-Host ""
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                   DEPLOYMENT CHECKLIST                " -ForegroundColor Cyan  
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Before you deploy, ensure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ☐ Platform modules created (lib/platforms/*.ts)" -ForegroundColor White
Write-Host "  ☐ Dependencies installed (npm install googleapis @supabase/supabase-js)" -ForegroundColor White
Write-Host "  ☐ Netlify env vars set (BEE_API_URL, SUPABASE_URL, etc.)" -ForegroundColor White
Write-Host "  ☐ Supabase 'assets' bucket created" -ForegroundColor White
Write-Host "  ☐ Instagram/FB tokens obtained" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Deployment commands
Write-Host "🚀 READY TO DEPLOY?" -ForegroundColor Green
Write-Host ""
Write-Host "Run these commands when ready:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  git add lib/platforms/*.ts netlify/functions/bee-ship.ts scripts/ship-swarm.* BEE_SHIP_*.md" -ForegroundColor White
Write-Host "  git commit -m 'feat(bee): add bee-ship autonomous publishing system 🐝'" -ForegroundColor White
Write-Host "  git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "Netlify auto-deploy will trigger automatically!" -ForegroundColor Green
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - BEE_SHIP_README_COMPLETE.md - Overview & architecture" -ForegroundColor White
Write-Host "  - BEE_SHIP_DEPLOYMENT_COMPLETE.md - Step-by-step deployment" -ForegroundColor White
Write-Host "  - BEE_SHIP_FILES_COMPLETE.md - File listings & code" -ForegroundColor White
Write-Host ""

Write-Host "🐝 The swarm awaits! 🐝" -ForegroundColor Yellow
Write-Host ""
