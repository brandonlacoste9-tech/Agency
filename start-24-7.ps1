# GitHub Agent 24/7 Startup Script for Windows
# Run this script to ensure the GitHub Agent runs 24/7

param(
    [switch]$Production,
    [switch]$Install,
    [switch]$Status,
    [switch]$Stop
)

$ErrorActionPreference = "Continue"

Write-Host "🚀 GitHub Agent 24/7 Management System" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Change to the correct directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if ($Install) {
    Write-Host "📦 Installing GitHub Agent for 24/7 operation..." -ForegroundColor Yellow
    
    # Install dependencies
    npm install
    
    # Install PM2 globally if not already installed
    try {
        npx pm2 --version | Out-Null
    } catch {
        Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
        npm install -g pm2
    }
    
    # Set up PM2 to start on boot (Windows)
    Write-Host "🔧 Configuring PM2 for startup..." -ForegroundColor Yellow
    npx pm2 startup
    
    Write-Host "✅ Installation complete!" -ForegroundColor Green
    exit 0
}

if ($Status) {
    Write-Host "📊 Checking 24/7 status..." -ForegroundColor Yellow
    
    # Check PM2 status
    npx pm2 status
    
    # Check if process is saved for startup
    Write-Host "`n🔍 Startup configuration:" -ForegroundColor Blue
    npx pm2 show github-pr-manager 2>$null
    
    # Check logs
    Write-Host "`n📋 Recent logs:" -ForegroundColor Blue
    if (Test-Path "logs/github-agent.log") {
        Get-Content "logs/github-agent.log" -Tail 5
    } else {
        Write-Host "No logs found yet" -ForegroundColor Yellow
    }
    
    exit 0
}

if ($Stop) {
    Write-Host "🛑 Stopping GitHub Agent..." -ForegroundColor Red
    npx pm2 stop github-pr-manager
    npx pm2 delete github-pr-manager
    Write-Host "✅ GitHub Agent stopped" -ForegroundColor Green
    exit 0
}

# Main 24/7 deployment
Write-Host "🚀 Starting GitHub Agent in 24/7 mode..." -ForegroundColor Green

# Stop any existing instance
npx pm2 delete github-pr-manager 2>$null

# Start with production configuration if requested
if ($Production) {
    Write-Host "🏭 Using production configuration..." -ForegroundColor Blue
    npx pm2 start ecosystem.config.cjs --env production
} else {
    Write-Host "🔧 Using development configuration..." -ForegroundColor Blue
    npx pm2 start ecosystem.config.cjs
}

# Save PM2 configuration for startup
Write-Host "💾 Saving PM2 configuration for startup..." -ForegroundColor Yellow
npx pm2 save

# Show status
Write-Host "`n📊 Current status:" -ForegroundColor Blue
npx pm2 status

# Show health
Write-Host "`n❤️  Health check:" -ForegroundColor Blue
Start-Sleep 3
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "📊 Uptime: $([math]::Round($health.uptime)) seconds" -ForegroundColor Green
    Write-Host "💾 Memory: $([math]::Round($health.memory.heapUsed / 1MB, 2)) MB" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Health check pending..." -ForegroundColor Yellow
}

Write-Host "`n🎉 GitHub Agent is now running 24/7!" -ForegroundColor Green
Write-Host "📋 Management commands:" -ForegroundColor Cyan
Write-Host "   .\start-24-7.ps1 -Status    # Check status" -ForegroundColor White
Write-Host "   .\start-24-7.ps1 -Stop      # Stop agent" -ForegroundColor White
Write-Host "   npm run agent:health        # Health check" -ForegroundColor White
Write-Host "   npm run agent:monitor       # Start monitoring" -ForegroundColor White

Write-Host "`n🌐 Endpoints:" -ForegroundColor Cyan
Write-Host "   Dashboard: http://localhost:3001" -ForegroundColor White
Write-Host "   Health: http://localhost:3001/health" -ForegroundColor White
Write-Host "   Webhook: http://localhost:3001/webhook" -ForegroundColor White

Write-Host "`n🔄 The agent will automatically:" -ForegroundColor Blue
Write-Host "   • Restart if it crashes (up to 50 times)" -ForegroundColor White
Write-Host "   • Restart daily at 3 AM for maintenance" -ForegroundColor White
Write-Host "   • Log all activity to logs/ directory" -ForegroundColor White
Write-Host "   • Restart if memory usage exceeds 500MB" -ForegroundColor White
Write-Host "   • Start automatically when Windows boots" -ForegroundColor White