# GitHub PR Manager - Post-Deploy Checklist
# Run this after every production deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$TargetHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 3001,
    
    [Parameter(Mandatory=$false)]
    [string]$RedisUrl = $env:REDIS_URL,
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = $env:DATABASE_URL
)

$BaseUrl = "http://${TargetHost}:${Port}"
$testResults = @()

function Write-TestResult {
    param($name, $passed, $details = "", $duration = 0)
    
    $icon = if ($passed) { "✅" } else { "❌" }
    $color = if ($passed) { "Green" } else { "Red" }
    
    Write-Host "$icon $name" -ForegroundColor $color
    if ($details) {
        Write-Host "   $details" -ForegroundColor Gray
    }
    if ($duration -gt 0) {
        Write-Host "   Duration: ${duration}ms" -ForegroundColor Gray
    }
    
    $script:testResults += @{
        Test = $name
        Passed = $passed
        Details = $details
        Duration = $duration
    }
}

Write-Host "🚀 GitHub PR Manager - Post-Deploy Checklist" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Target: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# 1. Health & Connectivity Tests
Write-Host "🏥 Testing health & connectivity..." -ForegroundColor Yellow

$healthTests = @(
    @{ Path = "health"; Name = "Health check" },
    @{ Path = "ready"; Name = "Readiness check" },
    @{ Path = "metrics"; Name = "Prometheus metrics" },
    @{ Path = "webhook/events"; Name = "SSE events endpoint" },
    @{ Path = "webhook/stats"; Name = "Webhook statistics" }
)

foreach ($test in $healthTests) {
    try {
        $startTime = Get-Date
        
        if ($test.Path -eq "webhook/events") {
            # Special handling for SSE endpoint
            $response = Invoke-WebRequest -Uri "$BaseUrl/$($test.Path)" -TimeoutSec 5 -Method GET
            $passed = $response.StatusCode -eq 200 -and $response.Headers.'Content-Type' -match 'text/event-stream'
        } else {
            $response = Invoke-RestMethod -Uri "$BaseUrl/$($test.Path)" -TimeoutSec 5
            $passed = $true
        }
        
        $duration = (Get-Date) - $startTime
        Write-TestResult $test.Name $true "HTTP 200" $duration.TotalMilliseconds
        
        # Additional validation for specific endpoints
        if ($test.Path -eq "health" -and $response.status) {
            Write-Host "   Status: $($response.status)" -ForegroundColor Gray
            Write-Host "   Uptime: $($response.uptime)" -ForegroundColor Gray
            Write-Host "   AI Enabled: $($response.ai_enabled)" -ForegroundColor Gray
        }
        
        if ($test.Path -eq "metrics" -and $response -match "github_") {
            Write-Host "   GitHub metrics present" -ForegroundColor Gray
        }
        
    } catch {
        $duration = if ($startTime) { ((Get-Date) - $startTime).TotalMilliseconds } else { 0 }
        Write-TestResult $test.Name $false $_.Exception.Message $duration
    }
}

# 2. Prometheus Metrics Validation
Write-Host "`n📊 Validating Prometheus metrics..." -ForegroundColor Yellow

try {
    $metrics = Invoke-RestMethod -Uri "$BaseUrl/metrics" -TimeoutSec 10
    
    $requiredMetrics = @(
        "github_webhooks_total",
        "github_webhook_processing_duration_seconds",
        "github_webhook_queue_length",
        "github_agent_active_connections",
        "github_sse_connections_total"
    )
    
    $foundMetrics = @()
    foreach ($metric in $requiredMetrics) {
        if ($metrics -match $metric) {
            $foundMetrics += $metric
        }
    }
    
    $allPresent = $foundMetrics.Count -eq $requiredMetrics.Count
    Write-TestResult "Required metrics present" $allPresent "$($foundMetrics.Count)/$($requiredMetrics.Count) metrics found"
    
    if (-not $allPresent) {
        $missing = $requiredMetrics | Where-Object { $_ -notin $foundMetrics }
        Write-Host "   Missing: $($missing -join ', ')" -ForegroundColor Red
    }
    
} catch {
    Write-TestResult "Metrics validation" $false $_.Exception.Message
}

# 3. SSE Functionality Test
Write-Host "`n🔄 Testing SSE events..." -ForegroundColor Yellow

try {
    # Test SSE connection (quick check)
    $sseResponse = Invoke-WebRequest -Uri "$BaseUrl/webhook/events" -TimeoutSec 3 -Method GET
    $sseWorking = $sseResponse.StatusCode -eq 200 -and 
                  $sseResponse.Headers.'Content-Type' -match 'text/event-stream'
    
    Write-TestResult "SSE endpoint accessible" $sseWorking "Content-Type: $($sseResponse.Headers.'Content-Type')"
    
    # Check for snapshot data (simplified)
    if ($sseWorking) {
        Write-Host "   📡 SSE stream available (snapshot + heartbeats)" -ForegroundColor Gray
    }
    
} catch {
    Write-TestResult "SSE endpoint test" $false $_.Exception.Message
}

# 4. Database Connectivity (if configured)
if ($DatabaseUrl) {
    Write-Host "`n🗄️ Testing database connectivity..." -ForegroundColor Yellow
    
    try {
        if ($DatabaseUrl -match "postgresql://") {
            # Test PostgreSQL connection
            $psqlTest = & psql $DatabaseUrl -c "SELECT 1" 2>&1
            $dbConnected = $LASTEXITCODE -eq 0
            Write-TestResult "PostgreSQL connection" $dbConnected ($psqlTest | Out-String).Trim()
        } else {
            Write-TestResult "Database test" $false "Unsupported database URL format"
        }
    } catch {
        Write-TestResult "Database connection" $false $_.Exception.Message
    }
}

# 5. Redis Connectivity (if configured)
if ($RedisUrl) {
    Write-Host "`n🔴 Testing Redis connectivity..." -ForegroundColor Yellow
    
    try {
        # Extract Redis host and port from URL
        if ($RedisUrl -match "redis://([^:]+):?(\d+)?") {
            $redisHost = $Matches[1]
            $redisPort = if ($Matches[2]) { $Matches[2] } else { 6379 }
            
            $redisTest = & redis-cli -h $redisHost -p $redisPort ping 2>&1
            $redisConnected = $redisTest -eq "PONG"
            Write-TestResult "Redis ping" $redisConnected $redisTest
            
            if ($redisConnected) {
                # Check webhook queue
                $queueLength = & redis-cli -h $redisHost -p $redisPort LLEN queue:github-webhook 2>&1
                if ($queueLength -match "\d+") {
                    Write-TestResult "Webhook queue accessible" $true "Queue length: $queueLength"
                } else {
                    Write-TestResult "Webhook queue check" $false $queueLength
                }
            }
        } else {
            Write-TestResult "Redis URL parsing" $false "Invalid Redis URL format"
        }
    } catch {
        Write-TestResult "Redis connection" $false $_.Exception.Message
    }
}

# 6. Security Validation
Write-Host "`n🔐 Security validation..." -ForegroundColor Yellow

# Check if webhook signature validation is enabled
try {
    $testPayload = '{"test":"security_validation"}'
    $invalidSigResponse = Invoke-WebRequest -Uri "$BaseUrl/webhook" -Method POST `
        -Headers @{'Content-Type'='application/json'; 'X-GitHub-Event'='ping'; 'X-Hub-Signature-256'='sha256=invalid'} `
        -Body $testPayload -ErrorAction SilentlyContinue
    
    $signatureValidationEnabled = $invalidSigResponse.StatusCode -eq 401
    Write-TestResult "Webhook signature validation" $signatureValidationEnabled "HTTP $($invalidSigResponse.StatusCode)"
    
} catch {
    # 401 errors are expected and good
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-TestResult "Webhook signature validation" $true "HTTP 401 (correctly rejected)"
    } else {
        Write-TestResult "Webhook signature validation" $false $_.Exception.Message
    }
}

# Check environment variables are not default values
$securityChecks = @(
    @{ Name = "WEBHOOK_SECRET set"; Check = ($env:WEBHOOK_SECRET -and $env:WEBHOOK_SECRET -ne "your-webhook-secret") },
    @{ Name = "GITHUB_TOKEN set"; Check = ($env:GITHUB_TOKEN -and $env:GITHUB_TOKEN -ne "your-github-token") },
    @{ Name = "NODE_ENV production"; Check = ($env:NODE_ENV -eq "production") }
)

foreach ($check in $securityChecks) {
    Write-TestResult $check.Name $check.Check
}

# 7. Process & Container Health
Write-Host "`n🐳 Process & container health..." -ForegroundColor Yellow

try {
    # Check if running in Docker
    $dockerPs = & docker ps --filter "name=github-pr-manager" --format "table {{.Names}}\t{{.Status}}" 2>&1
    if ($dockerPs -match "github-pr-manager" -and $dockerPs -match "Up") {
        Write-TestResult "Docker container status" $true "Container running"
        
        # Get container logs (last 10 lines)
        $logs = & docker logs github-pr-manager-enhanced_github-pr-manager_1 --tail 10 2>&1
        $noErrors = $logs -notmatch "ERROR|FATAL|💥"
        Write-TestResult "Container logs clean" $noErrors "Recent logs checked"
        
    } else {
        Write-TestResult "Docker container check" $false "Container not found or not running"
    }
} catch {
    Write-TestResult "Container health check" $false $_.Exception.Message
}

# 8. Performance Check
Write-Host "`n⚡ Performance validation..." -ForegroundColor Yellow

try {
    # Test response time for health endpoint
    $perfStart = Get-Date
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
    $responseTime = ((Get-Date) - $perfStart).TotalMilliseconds
    
    $performanceGood = $responseTime -lt 1000  # Under 1 second
    Write-TestResult "Health endpoint response time" $performanceGood "${responseTime}ms (target: <1000ms)"
    
} catch {
    Write-TestResult "Performance check" $false $_.Exception.Message
}

# Summary
Write-Host "`n📋 Post-Deploy Checklist Summary" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests

Write-Host "Total tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests ✅" -ForegroundColor Green  
Write-Host "Failed: $failedTests ❌" -ForegroundColor Red
Write-Host "Success rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor White

# Critical tests check
$criticalTests = @(
    "Health check",
    "Readiness check", 
    "Prometheus metrics",
    "Required metrics present",
    "Webhook signature validation"
)

$criticalPassed = 0
foreach ($test in $criticalTests) {
    $result = $testResults | Where-Object { $_.Test -eq $test }
    if ($result -and $result.Passed) {
        $criticalPassed++
    }
}

Write-Host ""
if ($criticalPassed -eq $criticalTests.Count) {
    Write-Host "🎉 ALL CRITICAL TESTS PASSED - DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
    $exitCode = 0
} else {
    Write-Host "⚠️ CRITICAL TESTS FAILED - INVESTIGATE BEFORE PROCEEDING" -ForegroundColor Red
    Write-Host "Critical failures: $($criticalTests.Count - $criticalPassed)/$($criticalTests.Count)" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Monitor metrics: curl -s $BaseUrl/metrics | grep github_" -ForegroundColor White
Write-Host "2. Watch SSE events: curl -N $BaseUrl/webhook/events" -ForegroundColor White
Write-Host "3. Send test webhook: ./ops-toolkit.ps1 -Operation send-webhook" -ForegroundColor White
Write-Host "4. Check Prometheus targets: http://prometheus:9090/targets" -ForegroundColor White

# Failed tests details
if ($failedTests -gt 0) {
    Write-Host ""
    Write-Host "❌ Failed Tests Details:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "   $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

exit $exitCode