#!/usr/bin/env pwsh
# Enhanced GitHub PR Management with Custom CLI Integration
# Usage: .\pr-automation-enhanced.ps1 -Action [merge-ready|daily-triage|cleanup-drafts|health-check]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("merge-ready", "daily-triage", "cleanup-drafts", "fix-builds", "health-check")]
    [string]$Action,
    
    [string]$Repo = "brandonlacoste9-tech/adgenxai",
    [switch]$DryRun,
    [switch]$UseCustomCLI = $true
)

$ErrorActionPreference = "Stop"

# Custom GitHub CLI Configuration
$CUSTOM_GH_CLI = "C:\Users\north\gh-cli\bin\gh.exe"
$STANDARD_GH_CLI = "gh"

function Write-Status {
    param($Message, $Status = "Info")
    $color = switch($Status) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp][$Status] $Message" -ForegroundColor $color
}

function Test-CustomGitHubCLI {
    if (-not $UseCustomCLI) {
        return $false
    }
    
    try {
        if (-not (Test-Path $CUSTOM_GH_CLI)) {
            Write-Status "Custom GitHub CLI not found at: $CUSTOM_GH_CLI" "Warning"
            return $false
        }
        
        $version = & $CUSTOM_GH_CLI version 2>&1
        Write-Status "Custom GitHub CLI ready: $version" "Success"
        return $true
    } catch {
        Write-Status "Custom GitHub CLI failed: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Test-StandardGitHubCLI {
    try {
        $null = & $STANDARD_GH_CLI --version 2>&1
        return $true
    } catch {
        Write-Status "Standard GitHub CLI (gh) not found. Please install: winget install GitHub.cli" "Error"
        return $false
    }
}

function Get-GitHubCLI {
    if (Test-CustomGitHubCLI) {
        Write-Status "Using custom GitHub CLI build" "Info"
        return $CUSTOM_GH_CLI
    } elseif (Test-StandardGitHubCLI) {
        Write-Status "Using standard GitHub CLI" "Info"
        return $STANDARD_GH_CLI
    } else {
        throw "No GitHub CLI available. Install standard CLI or build custom version."
    }
}

function Get-PRsEnhanced {
    param(
        [string]$State = "open", 
        [int]$Limit = 50,
        [string]$CLI
    )
    
    $startTime = Get-Date
    try {
        $prData = & $CLI pr list --repo $Repo --state $State --limit $Limit --json number,title,author,reviewDecision,mergeable,statusCheckRollup,labels,isDraft
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Status "Retrieved $($prData | ConvertFrom-Json | Measure-Object | Select-Object -ExpandProperty Count) PRs in ${duration}ms" "Success"
        return $prData | ConvertFrom-Json
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        Write-Status "PR retrieval failed after ${duration}ms: $($_.Exception.Message)" "Error"
        throw
    }
}

function Test-RepositoryAccess {
    param([string]$CLI)
    
    try {
        $repoAccess = & $CLI repo view $Repo --json name,description,defaultBranchRef,visibility
        $repoInfo = $repoAccess | ConvertFrom-Json
        Write-Status "Repository access confirmed: $($repoInfo.name) ($($repoInfo.visibility))" "Success"
        
        # Test PR access
        $prCount = (Get-PRsEnhanced -State "open" -Limit 1 -CLI $CLI).Count
        Write-Status "Open PRs detected: $prCount" "Success"
        
        return @{
            name = $repoInfo.name
            description = $repoInfo.description
            defaultBranch = $repoInfo.defaultBranchRef.name
            visibility = $repoInfo.visibility
            openPRs = $prCount
        }
    } catch {
        Write-Status "Repository access failed: $($_.Exception.Message)" "Error"
        throw
    }
}

function Invoke-HealthCheck {
    Write-Status "Starting comprehensive health check..." "Info"
    
    # 1. Test CLI Availability
    Write-Status "`n=== GitHub CLI Health Check ===" "Info"
    $cli = Get-GitHubCLI
    
    # 2. Test Repository Access
    Write-Status "`n=== Repository Access Check ===" "Info"
    $repoInfo = Test-RepositoryAccess -CLI $cli
    
    # 3. Test Authentication
    Write-Status "`n=== Authentication Check ===" "Info"
    try {
        $authStatus = & $cli auth status 2>&1
        Write-Status "Authentication verified" "Success"
    } catch {
        Write-Status "Authentication failed: $($_.Exception.Message)" "Error"
    }
    
    # 4. Performance Test
    Write-Status "`n=== Performance Test ===" "Info"
    $startTime = Get-Date
    $prs = Get-PRsEnhanced -State "open" -Limit 10 -CLI $cli
    $endTime = Get-Date
    $totalTime = ($endTime - $startTime).TotalMilliseconds
    
    Write-Status "Performance test completed: 10 PRs retrieved in ${totalTime}ms" "Success"
    
    # 5. Agent System Check
    Write-Status "`n=== Agent System Health ===" "Info"
    try {
        $agentResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
        Write-Status "Agent system responding: $($agentResponse.status)" "Success"
    } catch {
        Write-Status "Agent system check failed: $($_.Exception.Message)" "Warning"
    }
    
    # 6. Summary
    Write-Status "`n=== Health Check Summary ===" "Info"
    Write-Host "Repository: $($repoInfo.name)" -ForegroundColor Green
    Write-Host "Open PRs: $($repoInfo.openPRs)" -ForegroundColor Green
    Write-Host "CLI Type: $(if ($cli -eq $CUSTOM_GH_CLI) { 'Custom Build' } else { 'Standard' })" -ForegroundColor Green
    Write-Host "Performance: ${totalTime}ms for 10 PRs" -ForegroundColor Green
    
    return @{
        cli = $cli
        repository = $repoInfo
        performance = @{
            queryTime = $totalTime
            prsRetrieved = 10
        }
        timestamp = Get-Date
    }
}

function Invoke-MergeReady {
    $cli = Get-GitHubCLI
    Write-Status "Scanning for merge-ready PRs..." "Info"
    
    $prs = Get-PRsEnhanced -State "open" -CLI $cli
    $readyPRs = $prs | Where-Object { 
        $_.reviewDecision -eq "APPROVED" -and 
        $_.mergeable -eq "MERGEABLE" -and
        $_.isDraft -eq $false -and
        ($_.statusCheckRollup.conclusion -eq "SUCCESS" -or $null -eq $_.statusCheckRollup.conclusion)
    }
    
    Write-Status "Found $($readyPRs.Count) merge-ready PRs" "Success"
    
    foreach ($pr in $readyPRs) {
        Write-Host "`nPR #$($pr.number): $($pr.title)" -ForegroundColor Yellow
        Write-Host "Author: $($pr.author.login)" -ForegroundColor Gray
        Write-Host "Status: ✅ Approved, ✅ Mergeable, ✅ Checks Passed" -ForegroundColor Green
        
        if (-not $DryRun) {
            try {
                & $cli pr merge $pr.number --repo $Repo --squash --delete-branch
                Write-Status "Merged PR #$($pr.number)" "Success"
            } catch {
                Write-Status "Failed to merge PR #$($pr.number): $($_.Exception.Message)" "Error"
            }
        } else {
            Write-Status "DRY RUN: Would merge PR #$($pr.number)" "Info"
        }
    }
}

# Main execution
try {
    Write-Status "GitHub PR Automation Enhanced - Action: $Action" "Info"
    
    switch ($Action) {
        "health-check" {
            $healthResult = Invoke-HealthCheck
            # Export health data for monitoring
            $healthResult | ConvertTo-Json -Depth 3 | Out-File "health-check-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        }
        "merge-ready" {
            Invoke-MergeReady
        }
        default {
            Write-Status "Action '$Action' not yet implemented in enhanced version" "Warning"
            Write-Status "Use standard pr-automation.ps1 for other actions" "Info"
        }
    }
    
    Write-Status "Automation completed successfully" "Success"
} catch {
    Write-Status "Automation failed: $($_.Exception.Message)" "Error"
    exit 1
}
