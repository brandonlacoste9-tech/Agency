#!/usr/bin/env pwsh
# Advanced GitHub Automation with Custom CLI Integration
# Usage: .\pr-automation-v2.ps1 -Action [full-audit|smart-merge|health-dashboard|auto-triage]

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("full-audit", "smart-merge", "health-dashboard", "auto-triage", "batch-review", "performance-test")]
    [string]$Action,
    
    [string]$Repo = "brandonlacoste9-tech/adgenxai",
    [switch]$DryRun,
    [switch]$UseCustomCLI = $true,
    [int]$BatchSize = 10,
    [int]$MaxConcurrency = 5
)

$ErrorActionPreference = "Stop"

# Custom GitHub CLI Configuration
$CUSTOM_GH_CLI = "C:\Users\north\gh-cli\bin\gh.exe"
$STANDARD_GH_CLI = "gh"

function Write-Status {
    param($Message, $Status = "Info")
    $color = switch ($Status) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Critical" { "Magenta" }
        default { "Cyan" }
    }
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    Write-Host "[$timestamp][$Status] $Message" -ForegroundColor $color
}

function Get-GitHubCLI {
    if ($UseCustomCLI -and (Test-Path $CUSTOM_GH_CLI)) {
        Write-Status "Using custom GitHub CLI build" "Info"
        return $CUSTOM_GH_CLI
    }
    else {
        Write-Status "Using standard GitHub CLI" "Info"
        return $STANDARD_GH_CLI
    }
}

function Measure-CLIOperation {
    param(
        [string]$CLI,
        [string]$Command,
        [scriptblock]$Operation
    )
    
    $startTime = Get-Date
    try {
        $result = & $Operation
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Status "Command '$Command' completed in ${duration}ms" "Success"
        return @{
            Success  = $true
            Result   = $result
            Duration = $duration
            Command  = $Command
        }
    }
    catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        Write-Status "Command '$Command' failed after ${duration}ms: $($_.Exception.Message)" "Error"
        return @{
            Success  = $false
            Error    = $_.Exception.Message
            Duration = $duration
            Command  = $Command
        }
    }
}

function Get-AllPRsAdvanced {
    param([string]$CLI, [string]$State = "open")
    
    $operation = {
        $prData = & $CLI pr list --repo $Repo --state $State --limit 100 --json number, title, author, reviewDecision, mergeable, statusCheckRollup, labels, isDraft, createdAt, updatedAt, url
        return $prData | ConvertFrom-Json
    }
    
    return Measure-CLIOperation -CLI $CLI -Command "pr list" -Operation $operation
}

function Get-PRDetailsAdvanced {
    param([string]$CLI, [int]$PRNumber)
    
    $operation = {
        $prData = & $CLI pr view $PRNumber --repo $Repo --json number, title, body, author, reviewDecision, statusCheckRollup, mergeable, labels, isDraft, comments, reviews, checks, files
        return $prData | ConvertFrom-Json
    }
    
    return Measure-CLIOperation -CLI $CLI -Command "pr view $PRNumber" -Operation $operation
}

function Invoke-FullAudit {
    $cli = Get-GitHubCLI
    Write-Status "🔍 Starting comprehensive repository audit..." "Info"
    
    # Repository Overview
    Write-Status "`n=== REPOSITORY OVERVIEW ===" "Info"
    $repoResult = Measure-CLIOperation -CLI $cli -Command "repo view" -Operation {
        $repoData = & $cli repo view $Repo --json name, description, defaultBranchRef, visibility, stargazerCount, forkCount, issues, pullRequests
        return $repoData | ConvertFrom-Json
    }
    
    if ($repoResult.Success) {
        $repo = $repoResult.Result
        Write-Host "Repository: $($repo.name)" -ForegroundColor Green
        Write-Host "Visibility: $($repo.visibility)" -ForegroundColor Green
        Write-Host "Stars: $($repo.stargazerCount)" -ForegroundColor Green
        Write-Host "Forks: $($repo.forkCount)" -ForegroundColor Green
    }
    
    # PR Analysis
    Write-Status "`n=== PULL REQUEST ANALYSIS ===" "Info"
    $prResult = Get-AllPRsAdvanced -CLI $cli
    
    if ($prResult.Success) {
        $prs = $prResult.Result
        Write-Status "Found $($prs.Count) open pull requests" "Success"
        
        # Categorize PRs
        $readyToMerge = $prs | Where-Object { 
            $_.reviewDecision -eq "APPROVED" -and 
            $_.mergeable -eq "MERGEABLE" -and
            $_.isDraft -eq $false
        }
        
        $needsReview = $prs | Where-Object { 
            $_.reviewDecision -eq "REVIEW_REQUIRED" -or 
            $_.reviewDecision -eq $null 
        }
        
        $drafts = $prs | Where-Object { $_.isDraft -eq $true }
        
        $conflicts = $prs | Where-Object { $_.mergeable -eq "CONFLICTING" }
        
        Write-Host "`n📊 PR Categories:" -ForegroundColor Yellow
        Write-Host "  🟢 Ready to Merge: $($readyToMerge.Count)" -ForegroundColor Green
        Write-Host "  🟡 Needs Review: $($needsReview.Count)" -ForegroundColor Yellow
        Write-Host "  🔵 Draft PRs: $($drafts.Count)" -ForegroundColor Blue
        Write-Host "  🔴 Has Conflicts: $($conflicts.Count)" -ForegroundColor Red
        
        # Age Analysis
        $now = Get-Date
        $oldPRs = $prs | Where-Object {
            $created = [DateTime]::Parse($_.createdAt)
            ($now - $created).Days -gt 7
        }
        
        $stalePRs = $prs | Where-Object {
            $updated = [DateTime]::Parse($_.updatedAt)
            ($now - $updated).Days -gt 3
        }
        
        Write-Host "`n⏰ Age Analysis:" -ForegroundColor Yellow
        Write-Host "  📅 PRs > 7 days old: $($oldPRs.Count)" -ForegroundColor Cyan
        Write-Host "  🕐 Stale (>3 days no update): $($stalePRs.Count)" -ForegroundColor Cyan
        
        return @{
            Repository  = $repo
            TotalPRs    = $prs.Count
            Categories  = @{
                ReadyToMerge = $readyToMerge
                NeedsReview  = $needsReview
                Drafts       = $drafts
                Conflicts    = $conflicts
                Old          = $oldPRs
                Stale        = $stalePRs
            }
            Performance = @{
                RepoQueryTime = $repoResult.Duration
                PRQueryTime   = $prResult.Duration
            }
        }
    }
    else {
        Write-Status "Failed to retrieve PR data: $($prResult.Error)" "Error"
        return $null
    }
}

function Invoke-SmartMerge {
    $cli = Get-GitHubCLI
    Write-Status "🤖 Starting intelligent merge process..." "Info"
    
    $audit = Invoke-FullAudit
    if (-not $audit) {
        Write-Status "Audit failed, cannot proceed with smart merge" "Error"
        return
    }
    
    $readyPRs = $audit.Categories.ReadyToMerge
    Write-Status "Found $($readyPRs.Count) PRs ready for merge" "Info"
    
    if ($readyPRs.Count -eq 0) {
        Write-Status "No PRs ready for merge" "Warning"
        return
    }
    
    # Priority scoring
    $scoredPRs = $readyPRs | ForEach-Object {
        $score = 0
        
        # Higher priority for older PRs
        $age = ([DateTime]::Now - [DateTime]::Parse($_.createdAt)).Days
        $score += $age * 2
        
        # Higher priority for certain labels
        if ($_.labels) {
            if ($_.labels.name -contains "hotfix") { $score += 50 }
            if ($_.labels.name -contains "critical") { $score += 30 }
            if ($_.labels.name -contains "bug") { $score += 20 }
            if ($_.labels.name -contains "enhancement") { $score += 10 }
        }
        
        # Lower priority for large PRs (assume complexity)
        $title = $_.title.ToLower()
        if ($title -match "refactor|restructure|major") { $score -= 10 }
        
        $_ | Add-Member -NotePropertyName "Priority" -NotePropertyValue $score
        return $_
    }
    
    $sortedPRs = $scoredPRs | Sort-Object Priority -Descending
    
    Write-Host "`n🎯 Smart Merge Queue (by priority):" -ForegroundColor Yellow
    foreach ($pr in $sortedPRs | Select-Object -First 5) {
        Write-Host "  #$($pr.number) (Score: $($pr.Priority)) - $($pr.title)" -ForegroundColor Cyan
    }
    
    if (-not $DryRun) {
        foreach ($pr in $sortedPRs) {
            try {
                Write-Status "Merging PR #$($pr.number): $($pr.title)" "Info"
                
                $mergeResult = Measure-CLIOperation -CLI $cli -Command "pr merge $($pr.number)" -Operation {
                    & $cli pr merge $pr.number --repo $Repo --squash --delete-branch
                }
                
                if ($mergeResult.Success) {
                    Write-Status "✅ Successfully merged PR #$($pr.number)" "Success"
                }
                else {
                    Write-Status "❌ Failed to merge PR #$($pr.number): $($mergeResult.Error)" "Error"
                }
                
                Start-Sleep -Seconds 2  # Rate limiting
            }
            catch {
                Write-Status "❌ Exception merging PR #$($pr.number): $($_.Exception.Message)" "Error"
            }
        }
    }
    else {
        Write-Status "DRY RUN: Would merge $($sortedPRs.Count) PRs in priority order" "Warning"
    }
}

function Invoke-HealthDashboard {
    $cli = Get-GitHubCLI
    Write-Status "📊 Generating health dashboard..." "Info"
    
    # CLI Health Check
    Write-Status "`n=== CLI HEALTH CHECK ===" "Info"
    $cliHealth = Measure-CLIOperation -CLI $cli -Command "auth status" -Operation {
        & $cli auth status 2>&1
    }
    
    $cliVersion = Measure-CLIOperation -CLI $cli -Command "version" -Operation {
        & $cli version
    }
    
    Write-Host "CLI Type: $(if ($cli -eq $CUSTOM_GH_CLI) { 'Custom Build ✨' } else { 'Standard 📦' })" -ForegroundColor Green
    Write-Host "Version: $($cliVersion.Result.Split([Environment]::NewLine)[0])" -ForegroundColor Green
    Write-Host "Auth Status: $(if ($cliHealth.Success) { '✅ Authenticated' } else { '❌ Not Authenticated' })" -ForegroundColor $(if ($cliHealth.Success) { 'Green' } else { 'Red' })
    Write-Host "Response Time: Auth: $($cliHealth.Duration)ms, Version: $($cliVersion.Duration)ms" -ForegroundColor Cyan
    
    # Repository Health
    $audit = Invoke-FullAudit
    if ($audit) {
        Write-Status "`n=== REPOSITORY HEALTH SCORE ===" "Info"
        
        $healthScore = 100
        $issues = @()
        
        # Deduct points for issues
        if ($audit.Categories.Conflicts.Count -gt 0) {
            $penalty = $audit.Categories.Conflicts.Count * 10
            $healthScore -= $penalty
            $issues += "Merge conflicts: -$penalty points"
        }
        
        if ($audit.Categories.Stale.Count -gt 0) {
            $penalty = $audit.Categories.Stale.Count * 5
            $healthScore -= $penalty
            $issues += "Stale PRs: -$penalty points"
        }
        
        if ($audit.Categories.Old.Count -gt 0) {
            $penalty = $audit.Categories.Old.Count * 3
            $healthScore -= $penalty
            $issues += "Old PRs: -$penalty points"
        }
        
        # Bonus points for good practices
        if ($audit.Categories.ReadyToMerge.Count -gt 0) {
            $bonus = $audit.Categories.ReadyToMerge.Count * 5
            $healthScore += $bonus
            $issues += "Ready-to-merge PRs: +$bonus points"
        }
        
        $healthScore = [Math]::Max(0, [Math]::Min(100, $healthScore))
        
        $healthColor = if ($healthScore -ge 80) { "Green" } 
        elseif ($healthScore -ge 60) { "Yellow" } 
        else { "Red" }
        
        Write-Host "`n🎯 Overall Health Score: $healthScore/100" -ForegroundColor $healthColor
        
        if ($issues) {
            Write-Host "`n📝 Score Breakdown:" -ForegroundColor Yellow
            foreach ($issue in $issues) {
                Write-Host "  • $issue" -ForegroundColor Gray
            }
        }
        
        # Performance Metrics
        Write-Status "`n=== PERFORMANCE METRICS ===" "Info"
        Write-Host "Repository Query: $($audit.Performance.RepoQueryTime)ms" -ForegroundColor Cyan
        Write-Host "PR List Query: $($audit.Performance.PRQueryTime)ms" -ForegroundColor Cyan
        Write-Host "CLI Type: $(if ($cli -eq $CUSTOM_GH_CLI) { 'Custom (Optimized)' } else { 'Standard' })" -ForegroundColor Cyan
    }
    
    # Export dashboard data
    $dashboardData = @{
        Timestamp   = Get-Date
        CLI         = @{
            Type        = if ($cli -eq $CUSTOM_GH_CLI) { "Custom" } else { "Standard" }
            Path        = $cli
            Version     = $cliVersion.Result
            AuthStatus  = $cliHealth.Success
            Performance = @{
                AuthTime    = $cliHealth.Duration
                VersionTime = $cliVersion.Duration
            }
        }
        Repository  = $audit
        HealthScore = $healthScore
        Issues      = $issues
    }
    
    $dashboardFile = "health-dashboard-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $dashboardData | ConvertTo-Json -Depth 4 | Out-File $dashboardFile
    Write-Status "Dashboard data exported to: $dashboardFile" "Success"
    
    return $dashboardData
}

function Invoke-PerformanceTest {
    $cli = Get-GitHubCLI
    Write-Status "⚡ Running performance test suite..." "Info"
    
    $tests = @()
    
    # Test 1: Single PR Query
    Write-Status "Test 1: Single PR query..." "Info"
    $singlePRResult = Get-AllPRsAdvanced -CLI $cli -State "open"
    $tests += @{
        Name     = "Single PR Query"
        Duration = $singlePRResult.Duration
        Success  = $singlePRResult.Success
    }
    
    # Test 2: Repository Info Query
    Write-Status "Test 2: Repository info query..." "Info"
    $repoResult = Measure-CLIOperation -CLI $cli -Command "repo view" -Operation {
        & $cli repo view $Repo --json name, description, visibility
    }
    $tests += @{
        Name     = "Repository Info Query"
        Duration = $repoResult.Duration
        Success  = $repoResult.Success
    }
    
    # Test 3: Authentication Check
    Write-Status "Test 3: Authentication check..." "Info"
    $authResult = Measure-CLIOperation -CLI $cli -Command "auth status" -Operation {
        & $cli auth status 2>&1
    }
    $tests += @{
        Name     = "Authentication Check"
        Duration = $authResult.Duration
        Success  = $authResult.Success
    }
    
    # Results Summary
    Write-Status "`n=== PERFORMANCE TEST RESULTS ===" "Info"
    $totalTime = ($tests | Measure-Object Duration -Sum).Sum
    $successfulTests = ($tests | Where-Object Success).Count
    
    Write-Host "CLI Type: $(if ($cli -eq $CUSTOM_GH_CLI) { 'Custom Build ⚡' } else { 'Standard 📦' })" -ForegroundColor Green
    Write-Host "Total Tests: $($tests.Count)" -ForegroundColor Cyan
    Write-Host "Successful: $successfulTests" -ForegroundColor Green
    Write-Host "Total Time: ${totalTime}ms" -ForegroundColor Cyan
    Write-Host "Average Time: $([Math]::Round($totalTime / $tests.Count, 2))ms" -ForegroundColor Cyan
    
    Write-Host "`n📊 Individual Test Results:" -ForegroundColor Yellow
    foreach ($test in $tests) {
        $status = if ($test.Success) { "✅" } else { "❌" }
        Write-Host "  $status $($test.Name): $($test.Duration)ms" -ForegroundColor $(if ($test.Success) { "Green" } else { "Red" })
    }
    
    return @{
        CLIType = if ($cli -eq $CUSTOM_GH_CLI) { "Custom" } else { "Standard" }
        Tests   = $tests
        Summary = @{
            TotalTests  = $tests.Count
            Successful  = $successfulTests
            TotalTime   = $totalTime
            AverageTime = [Math]::Round($totalTime / $tests.Count, 2)
        }
    }
}

# Main execution
try {
    Write-Status "🚀 Advanced GitHub Automation v2 - Action: $Action" "Info"
    
    $result = switch ($Action) {
        "full-audit" {
            Invoke-FullAudit
        }
        "smart-merge" {
            Invoke-SmartMerge
        }
        "health-dashboard" {
            Invoke-HealthDashboard
        }
        "performance-test" {
            Invoke-PerformanceTest
        }
        default {
            Write-Status "Action '$Action' not yet implemented" "Warning"
            $null
        }
    }
    
    Write-Status "`n🎉 Advanced automation completed successfully!" "Success"
    return $result
}
catch {
    Write-Status "💥 Advanced automation failed: $($_.Exception.Message)" "Critical"
    exit 1
}
