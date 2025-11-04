#!/usr/bin/env pwsh
# GitHub Automation Service for 24/7 Monitoring
# Production deployment with health monitoring, alerts, and auto-recovery

param(
    [ValidateSet("start", "stop", "restart", "status", "health", "logs", "config")]
    [string]$Action = "status",
    [string]$ConfigFile = "service-config.json",
    [int]$Port = 8080,
    [switch]$Daemon,
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param($Message, $Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp][$Level] $Message"
    
    $color = switch($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    
    Write-Host $logEntry -ForegroundColor $color
    
    # Log to file
    $logFile = "automation-service.log"
    $logEntry | Out-File $logFile -Append -Encoding UTF8
}

function Get-ServiceConfig {
    if (Test-Path $ConfigFile) {
        return Get-Content $ConfigFile | ConvertFrom-Json
    }
    
    # Default configuration
    $defaultConfig = @{
        repository = "brandonlacoste9-tech/adgenxai"
        monitoring = @{
            interval_minutes = 15
            health_check_timeout = 30
            max_failures = 3
        }
        automation = @{
            auto_merge_enabled = $true
            smart_labeling = $true
            stale_pr_cleanup = $true
            performance_tracking = $true
        }
        alerts = @{
            email_enabled = $false
            webhook_url = ""
            slack_channel = ""
        }
        github = @{
            custom_cli_path = "C:\Users\north\gh-cli\bin\gh.exe"
            api_timeout = 30
            retry_count = 3
        }
    }
    
    $defaultConfig | ConvertTo-Json -Depth 10 | Out-File $ConfigFile -Encoding UTF8
    Write-Log "Created default configuration: $ConfigFile" "INFO"
    return $defaultConfig
}

function Test-GitHubConnection {
    param($Config)
    
    try {
        Write-Log "Testing GitHub connection..." "INFO"
        
        # Test authentication
        $authTest = & $Config.github.custom_cli_path auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "GitHub authentication failed: $authTest" "ERROR"
            return $false
        }
        
        # Test repository access
        $repoTest = & $Config.github.custom_cli_path repo view $Config.repository --json name 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Repository access failed: $repoTest" "ERROR"
            return $false
        }
        
        Write-Log "✅ GitHub connection successful" "SUCCESS"
        return $true
    } catch {
        Write-Log "GitHub connection test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-MonitoringLoop {
    param($Config)
    
    $failureCount = 0
    $lastHealthCheck = Get-Date
    
    Write-Log "🚀 Starting monitoring loop (interval: $($Config.monitoring.interval_minutes) minutes)" "INFO"
    
    while ($true) {
        try {
            $startTime = Get-Date
            
            # Health check
            if ((Get-Date) - $lastHealthCheck -gt [TimeSpan]::FromMinutes(60)) {
                if (-not (Test-GitHubConnection -Config $Config)) {
                    $failureCount++
                    Write-Log "Health check failed ($failureCount/$($Config.monitoring.max_failures))" "WARN"
                    
                    if ($failureCount -ge $Config.monitoring.max_failures) {
                        Write-Log "Maximum failures reached, restarting service..." "ERROR"
                        Send-Alert -Config $Config -Message "GitHub automation service failing, attempting restart"
                        Start-Sleep -Seconds 30
                        $failureCount = 0
                    }
                } else {
                    $failureCount = 0
                }
                $lastHealthCheck = Get-Date
            }
            
            # Run automation tasks
            if ($Config.automation.performance_tracking) {
                $perfResults = Invoke-PerformanceTest -Config $Config
                Write-Log "Performance check: $($perfResults.summary)" "INFO"
            }
            
            if ($Config.automation.smart_labeling) {
                $labelResults = Invoke-SmartLabeling -Config $Config
                Write-Log "Smart labeling: $($labelResults.processed) PRs processed" "INFO"
            }
            
            if ($Config.automation.stale_pr_cleanup) {
                $cleanupResults = Invoke-StaleCleanup -Config $Config
                Write-Log "Stale cleanup: $($cleanupResults.cleaned) items processed" "INFO"
            }
            
            # Auto-merge check
            if ($Config.automation.auto_merge_enabled) {
                $mergeResults = Invoke-AutoMerge -Config $Config
                Write-Log "Auto-merge: $($mergeResults.merged) PRs merged" "INFO"
            }
            
            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalSeconds
            Write-Log "Monitoring cycle completed in ${duration}s" "INFO"
            
            # Update metrics
            Update-ServiceMetrics -Duration $duration -Success $true
            
            # Wait for next cycle
            Start-Sleep -Seconds ($Config.monitoring.interval_minutes * 60)
            
        } catch {
            Write-Log "Monitoring loop error: $($_.Exception.Message)" "ERROR"
            $failureCount++
            
            if ($failureCount -ge $Config.monitoring.max_failures) {
                Write-Log "Too many failures, stopping service" "ERROR"
                break
            }
            
            Start-Sleep -Seconds 60
        }
    }
}

function Invoke-PerformanceTest {
    param($Config)
    
    try {
        $testStart = Get-Date
        
        # Test CLI responsiveness
        $authTime = Measure-Command { 
            & $Config.github.custom_cli_path auth status | Out-Null 
        }
        
        $repoTime = Measure-Command {
            & $Config.github.custom_cli_path repo view $Config.repository --json name | Out-Null
        }
        
        $prTime = Measure-Command {
            & $Config.github.custom_cli_path pr list --repo $Config.repository --limit 5 --json number | Out-Null
        }
        
        $totalTime = (Get-Date) - $testStart
        
        return @{
            auth_ms = [int]$authTime.TotalMilliseconds
            repo_ms = [int]$repoTime.TotalMilliseconds
            pr_ms = [int]$prTime.TotalMilliseconds
            total_ms = [int]$totalTime.TotalMilliseconds
            summary = "Auth: $([int]$authTime.TotalMilliseconds)ms, Repo: $([int]$repoTime.TotalMilliseconds)ms, PR: $([int]$prTime.TotalMilliseconds)ms"
        }
    } catch {
        Write-Log "Performance test failed: $($_.Exception.Message)" "ERROR"
        return @{ summary = "FAILED" }
    }
}

function Invoke-SmartLabeling {
    param($Config)
    
    try {
        # Get open PRs
        $prs = & $Config.github.custom_cli_path pr list --repo $Config.repository --json number,title,labels,draft
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get PRs"
        }
        
        $prData = $prs | ConvertFrom-Json
        $processed = 0
        
        foreach ($pr in $prData) {
            # Smart labeling logic
            $labels = @()
            
            if ($pr.draft -eq $true) {
                $labels += "draft"
            }
            
            if ($pr.title -match "fix|bug") {
                $labels += "bug"
            }
            
            if ($pr.title -match "feat|feature") {
                $labels += "enhancement"
            }
            
            if ($pr.title -match "docs|documentation") {
                $labels += "documentation"
            }
            
            # Apply labels if needed
            if ($labels.Count -gt 0) {
                $currentLabels = $pr.labels | ForEach-Object { $_.name }
                $newLabels = $labels | Where-Object { $_ -notin $currentLabels }
                
                if ($newLabels.Count -gt 0) {
                    $labelStr = $newLabels -join ","
                    & $Config.github.custom_cli_path pr edit $pr.number --repo $Config.repository --add-label $labelStr
                    Write-Log "Added labels to PR #$($pr.number): $labelStr" "INFO"
                }
            }
            
            $processed++
        }
        
        return @{ processed = $processed }
    } catch {
        Write-Log "Smart labeling failed: $($_.Exception.Message)" "ERROR"
        return @{ processed = 0 }
    }
}

function Invoke-StaleCleanup {
    param($Config)
    
    try {
        # Find stale PRs (older than 30 days with no activity)
        $staleDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
        $stalePRs = & $Config.github.custom_cli_path pr list --repo $Config.repository --search "updated:<$staleDate" --json number,title,updatedAt
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get stale PRs"
        }
        
        $staleData = $stalePRs | ConvertFrom-Json
        $cleaned = 0
        
        foreach ($pr in $staleData) {
            # Add stale label
            & $Config.github.custom_cli_path pr edit $pr.number --repo $Config.repository --add-label "stale"
            Write-Log "Marked PR #$($pr.number) as stale" "INFO"
            $cleaned++
        }
        
        return @{ cleaned = $cleaned }
    } catch {
        Write-Log "Stale cleanup failed: $($_.Exception.Message)" "ERROR"
        return @{ cleaned = 0 }
    }
}

function Invoke-AutoMerge {
    param($Config)
    
    try {
        # Get PRs ready for merge (approved, passing checks)
        $readyPRs = & $Config.github.custom_cli_path pr list --repo $Config.repository --search "is:open review:approved status:success" --json number,title,mergeable
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to get ready PRs"
        }
        
        $readyData = $readyPRs | ConvertFrom-Json
        $merged = 0
        
        foreach ($pr in $readyData) {
            if ($pr.mergeable -eq "MERGEABLE") {
                # Auto-merge with squash
                & $Config.github.custom_cli_path pr merge $pr.number --repo $Config.repository --squash --delete-branch
                Write-Log "Auto-merged PR #$($pr.number): $($pr.title)" "SUCCESS"
                $merged++
            }
        }
        
        return @{ merged = $merged }
    } catch {
        Write-Log "Auto-merge failed: $($_.Exception.Message)" "ERROR"
        return @{ merged = 0 }
    }
}

function Send-Alert {
    param($Config, $Message)
    
    if ($Config.alerts.webhook_url) {
        try {
            $body = @{
                text = "🚨 GitHub Automation Alert: $Message"
                timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $Config.alerts.webhook_url -Method POST -Body $body -ContentType "application/json"
            Write-Log "Alert sent: $Message" "INFO"
        } catch {
            Write-Log "Failed to send alert: $($_.Exception.Message)" "ERROR"
        }
    }
}

function Update-ServiceMetrics {
    param($Duration, $Success)
    
    $metricsFile = "service-metrics.json"
    $metrics = @{
        last_run = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        duration_seconds = $Duration
        success = $Success
        uptime_hours = ((Get-Date) - (Get-Process -Id $PID).StartTime).TotalHours
    }
    
    $metrics | ConvertTo-Json | Out-File $metricsFile -Encoding UTF8
}

function Show-ServiceStatus {
    Write-Log "📊 GitHub Automation Service Status" "INFO"
    
    if (Test-Path "service-metrics.json") {
        $metrics = Get-Content "service-metrics.json" | ConvertFrom-Json
        Write-Host "Last Run: $($metrics.last_run)" -ForegroundColor Cyan
        Write-Host "Duration: $($metrics.duration_seconds)s" -ForegroundColor Cyan
        Write-Host "Success: $($metrics.success)" -ForegroundColor Cyan
        Write-Host "Uptime: $([Math]::Round($metrics.uptime_hours, 2)) hours" -ForegroundColor Cyan
    }
    
    # Process check
    $processes = Get-Process | Where-Object { $_.ProcessName -like "*automation*" -or $_.CommandLine -like "*github*" }
    if ($processes) {
        Write-Host "`nRunning Processes:" -ForegroundColor Green
        $processes | Format-Table Name, Id, CPU, WorkingSet -AutoSize
    } else {
        Write-Host "No automation processes found" -ForegroundColor Yellow
    }
}

# Main execution
try {
    switch ($Action) {
        "start" {
            Write-Log "🚀 Starting GitHub Automation Service" "INFO"
            $config = Get-ServiceConfig
            
            if (-not (Test-GitHubConnection -Config $config)) {
                Write-Log "❌ GitHub connection failed, cannot start service" "ERROR"
                exit 1
            }
            
            if ($Daemon) {
                Start-Job -ScriptBlock {
                    param($ConfigFile)
                    # Import this script's functions in the job
                    . $args[0]
                    Start-MonitoringLoop -Config (Get-ServiceConfig)
                } -ArgumentList $PSCommandPath
                Write-Log "✅ Service started in background mode" "SUCCESS"
            } else {
                Start-MonitoringLoop -Config $config
            }
        }
        
        "stop" {
            Write-Log "🛑 Stopping GitHub Automation Service" "INFO"
            Get-Job | Where-Object { $_.Name -like "*automation*" } | Stop-Job -PassThru | Remove-Job
            Write-Log "✅ Service stopped" "SUCCESS"
        }
        
        "restart" {
            & $PSCommandPath -Action stop
            Start-Sleep -Seconds 2
            & $PSCommandPath -Action start -Daemon:$Daemon
        }
        
        "status" {
            Show-ServiceStatus
        }
        
        "health" {
            $config = Get-ServiceConfig
            $healthy = Test-GitHubConnection -Config $config
            $perfResults = Invoke-PerformanceTest -Config $config
            
            Write-Log "🏥 Health Check Results" "INFO"
            Write-Host "Connection: $(if($healthy) { '✅ Healthy' } else { '❌ Failed' })" -ForegroundColor $(if($healthy) { 'Green' } else { 'Red' })
            Write-Host "Performance: $($perfResults.summary)" -ForegroundColor Cyan
        }
        
        "logs" {
            if (Test-Path "automation-service.log") {
                Get-Content "automation-service.log" -Tail 50
            } else {
                Write-Log "No log file found" "WARN"
            }
        }
        
        "config" {
            $config = Get-ServiceConfig
            Write-Log "📋 Current Configuration:" "INFO"
            $config | ConvertTo-Json -Depth 10
        }
    }
} catch {
    Write-Log "💥 Service error: $($_.Exception.Message)" "ERROR"
    exit 1
}
