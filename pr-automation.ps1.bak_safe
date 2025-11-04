#!/usr/bin/env pwsh
# GitHub PR Management Automation Script
# Usage: .\pr-automation.ps1 -Action [merge-ready|daily-triage|cleanup-drafts]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("merge-ready", "daily-triage", "cleanup-drafts", "fix-builds")]
    [string]$Action,
    
    [string]$Repo = "brandonlacoste9-tech/adgenxai",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param($Message, $Status = "Info")
    $color = switch($Status) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Test-GitHubCLI {
    try {
        $null = gh --version
        return $true
    } catch {
        Write-Status "GitHub CLI (gh) not found. Please install: winget install GitHub.cli" "Error"
        return $false
    }
}

function Get-TriageData {
    Write-Status "Running PR triage analysis..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outputFile = "triage_$timestamp.json"
    
    npm run triage:prs -- --repo $Repo --output $outputFile --format json
    
    if (Test-Path $outputFile) {
        return Get-Content $outputFile | ConvertFrom-Json
    } else {
        throw "Triage analysis failed - no output file generated"
    }
}

function Invoke-MergeReady {
    Write-Status "Finding PRs ready to merge..."
    $triage = Get-TriageData
    $readyPRs = $triage.analysis | Where-Object { $_.recommendation -eq "queue-for-merge" }
    
    if ($readyPRs.Count -eq 0) {
        Write-Status "No PRs ready to merge!" "Warning"
        return
    }
    
    Write-Status "Found $($readyPRs.Count) PRs ready to merge:" "Success"
    foreach ($pr in $readyPRs) {
        Write-Host "  #$($pr.number): $($pr.title)"
    }
    
    if ($DryRun) {
        Write-Status "DRY RUN: Would merge $($readyPRs.Count) PRs" "Warning"
        return
    }
    
    $confirm = Read-Host "Merge these PRs? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        foreach ($pr in $readyPRs) {
            try {
                Write-Status "Merging PR #$($pr.number)..."
                gh pr merge $pr.number --repo $Repo --squash --delete-branch
                Write-Status "✅ Merged PR #$($pr.number)" "Success"
            } catch {
                Write-Status "❌ Failed to merge PR #$($pr.number): $($_.Exception.Message)" "Error"
            }
        }
    }
}

function Invoke-DailyTriage {
    Write-Status "Generating daily triage report..."
    $timestamp = Get-Date -Format "yyyy-MM-dd"
    $reportFile = "daily_triage_$timestamp.md"
    
    npm run triage:prs -- --repo $Repo --output $reportFile --format markdown
    
    if (Test-Path $reportFile) {
        Write-Status "✅ Daily triage report saved to: $reportFile" "Success"
        
        # Display summary
        $triage = Get-TriageData
        Write-Host "`n📊 PR Summary:" -ForegroundColor Yellow
        Write-Host "  Ready to Merge: $($triage.summary.queue_for_merge)" -ForegroundColor Green
        Write-Host "  Needs Review: $($triage.summary.request_review)" -ForegroundColor Cyan
        Write-Host "  Needs Author Action: $($triage.summary.request_fix)" -ForegroundColor Red
        Write-Host "  Work in Progress: $($triage.summary.confirm_status)" -ForegroundColor Gray
    }
}

function Invoke-CleanupDrafts {
    Write-Status "Finding stale draft PRs..."
    $triage = Get-TriageData
    $draftPRs = $triage.analysis | Where-Object { $_.recommendation -eq "confirm-status" -and $_.is_draft }
    
    if ($draftPRs.Count -eq 0) {
        Write-Status "No draft PRs found!" "Warning"
        return
    }
    
    Write-Status "Found $($draftPRs.Count) draft PRs:" "Success"
    foreach ($pr in $draftPRs) {
        $age = (Get-Date) - [DateTime]$pr.created_at
        Write-Host "  #$($pr.number): $($pr.title) (Age: $($age.Days) days)"
    }
    
    if ($DryRun) {
        Write-Status "DRY RUN: Would analyze $($draftPRs.Count) draft PRs" "Warning"
        return
    }
    
    Write-Status "Review each draft PR above and decide to close or promote to ready-for-review" "Info"
}

function Invoke-FixBuilds {
    Write-Status "Analyzing build failures..."
    $triage = Get-TriageData
    $failedPRs = $triage.analysis | Where-Object { $_.recommendation -eq "request-fix" }
    
    if ($failedPRs.Count -eq 0) {
        Write-Status "No failing PRs found!" "Success"
        return
    }
    
    Write-Status "Found $($failedPRs.Count) PRs with failing builds:" "Warning"
    
    # Analyze common failure patterns
    $netlifyFailures = $failedPRs | Where-Object { $_.details -match "netlify" }
    $ciFailures = $failedPRs | Where-Object { $_.details -match "CI" -and $_.details -notmatch "netlify" }
    
    Write-Host "`n🔍 Failure Analysis:" -ForegroundColor Yellow
    Write-Host "  Netlify failures: $($netlifyFailures.Count)" -ForegroundColor Red
    Write-Host "  Other CI failures: $($ciFailures.Count)" -ForegroundColor Red
    
    if ($netlifyFailures.Count -gt 5) {
        Write-Status "🚨 Multiple Netlify failures detected! Likely common configuration issue." "Error"
        Write-Status "Recommended action: Create fix branch for Netlify build configuration" "Info"
    }
}

# Main execution
try {
    if (-not (Test-GitHubCLI)) {
        exit 1
    }
    
    Write-Status "Starting PR automation: $Action" "Info"
    Write-Status "Repository: $Repo" "Info"
    if ($DryRun) { Write-Status "DRY RUN MODE - No changes will be made" "Warning" }
    
    switch ($Action) {
        "merge-ready" { Invoke-MergeReady }
        "daily-triage" { Invoke-DailyTriage }
        "cleanup-drafts" { Invoke-CleanupDrafts }
        "fix-builds" { Invoke-FixBuilds }
    }
    
    Write-Status "✅ Automation completed successfully!" "Success"
    
} catch {
    Write-Status "❌ Automation failed: $($_.Exception.Message)" "Error"
    exit 1
}