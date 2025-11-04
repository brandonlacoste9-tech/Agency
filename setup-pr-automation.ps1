#!/usr/bin/env pwsh
# Quick Setup Script for GitHub PR Automation
# This script sets up daily automation and validates your environment

Write-Host "🚀 GitHub PR Automation Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check prerequisites
Write-Host "`n1. Checking prerequisites..." -ForegroundColor Cyan

# Check GitHub CLI
try {
    $ghVersion = gh --version
    Write-Host "✅ GitHub CLI installed: $($ghVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI not found. Install with: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

# Check GitHub token
if ($env:GITHUB_TOKEN) {
    Write-Host "✅ GitHub token configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  GitHub token not set. Set with: `$env:GITHUB_TOKEN = 'your_token'" -ForegroundColor Yellow
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Testing PR triage system..." -ForegroundColor Cyan

# Test triage system
try {
    Write-Host "Running quick test on Microsoft/vscode (public repo)..."
    npm run triage:prs -- --repo microsoft/vscode --dry-run --limit 5
    Write-Host "✅ PR triage system working!" -ForegroundColor Green
} catch {
    Write-Host "❌ PR triage test failed" -ForegroundColor Red
    Write-Host "Make sure you're in the adgenxai directory and npm packages are installed" -ForegroundColor Yellow
}

Write-Host "`n3. Available automation commands:" -ForegroundColor Cyan

$commands = @(
    @{
        Command = ".\pr-automation.ps1 -Action daily-triage"
        Description = "Generate daily PR triage report"
    },
    @{
        Command = ".\pr-automation.ps1 -Action merge-ready -DryRun"
        Description = "Check which PRs are ready to merge (safe preview)"
    },
    @{
        Command = ".\pr-automation.ps1 -Action fix-builds"
        Description = "Analyze build failures and suggest fixes"
    },
    @{
        Command = ".\pr-automation.ps1 -Action cleanup-drafts"
        Description = "Review draft PRs for cleanup"
    }
)

foreach ($cmd in $commands) {
    Write-Host "  📋 $($cmd.Description)" -ForegroundColor White
    Write-Host "     $($cmd.Command)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "4. Quick start recommendations:" -ForegroundColor Cyan
Write-Host "  a) Run daily triage: .\pr-automation.ps1 -Action daily-triage" -ForegroundColor Yellow
Write-Host "  b) Check ready PRs: .\pr-automation.ps1 -Action merge-ready -DryRun" -ForegroundColor Yellow
Write-Host "  c) Review the generated PR_ACTION_PLAN.md" -ForegroundColor Yellow

Write-Host "`n🎯 Your repository status:" -ForegroundColor Green
Write-Host "  - Repository: brandonlacoste9-tech/adgenxai" -ForegroundColor White
Write-Host "  - Last analysis: $(if (Test-Path 'triage_analysis.json') { (Get-Item 'triage_analysis.json').LastWriteTime } else { 'Not run yet' })" -ForegroundColor White
Write-Host "  - System status: OPERATIONAL ✅" -ForegroundColor Green

Write-Host "`nSetup complete! 🎉" -ForegroundColor Green