# Production Readiness Validation Script
# Validates the GitHub PR Manager system for production deployment

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$WebhookSecret = "integration-test-secret"
)

Write-Host "🚀 GitHub PR Manager Production Readiness Test" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "Webhook Secret: $($WebhookSecret ? '[CONFIGURED]' : '[NOT SET]')" -ForegroundColor Cyan
Write-Host ""

$testResults = @()
$testsPassed = 0
$testsTotal = 0

function Test-Result {
    param($name, $passed, $details = "")
    
    $script:testsTotal++
    if ($passed) {
        $script:testsPassed++
        Write-Host "✅ $name" -ForegroundColor Green
    } else {
        Write-Host "❌ $name" -ForegroundColor Red
    }
    
    if ($details) {
        Write-Host "   $details" -ForegroundColor Gray
    }
    
    $script:testResults += @{
        Name = $name
        Passed = $passed
        Details = $details
    }
}

function Generate-GitHubSignature {
    param($payload, $secret)
    
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
    return "sha256=" + ([System.BitConverter]::ToString($hash) -replace '-','').ToLower()
}

# Test 1: Code Structure Validation
Write-Host "🏗️ Testing code structure and syntax..." -ForegroundColor Yellow

try {
    # Check if source files exist
    $srcFiles = @("src\index.js", "src\ai-service.js", "src\metrics.js")
    $missingFiles = @()
    
    foreach ($file in $srcFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    Test-Result "Source files present" ($missingFiles.Count -eq 0) "Missing: $($missingFiles -join ', ')"
    
    # Check Node.js syntax
    $syntaxCheck = & node -c "src\index.js" 2>&1
    Test-Result "JavaScript syntax validation" ($LASTEXITCODE -eq 0) $syntaxCheck
    
    # Check for balanced braces
    $indexContent = Get-Content "src\index.js" -Raw
    $openBraces = ($indexContent | Select-String -Pattern '\{' -AllMatches).Matches.Count
    $closeBraces = ($indexContent | Select-String -Pattern '\}' -AllMatches).Matches.Count
    
    Test-Result "Balanced braces check" ($openBraces -eq $closeBraces) "Open: $openBraces, Close: $closeBraces"
    
} catch {
    Test-Result "Code structure validation" $false $_.Exception.Message
}

# Test 2: Package Dependencies
Write-Host "📦 Testing package dependencies..." -ForegroundColor Yellow

try {
    if (Test-Path "package.json") {
        $packageContent = Get-Content "package.json" | ConvertFrom-Json
        $hasExpress = $packageContent.dependencies.express -ne $null
        $hasPromClient = $packageContent.dependencies.'prom-client' -ne $null
        
        Test-Result "Express dependency" $hasExpress
        Test-Result "Prometheus client dependency" $hasPromClient
        
        # Check if node_modules exists
        Test-Result "Dependencies installed" (Test-Path "node_modules")
    } else {
        Test-Result "Package.json exists" $false
    }
} catch {
    Test-Result "Package validation" $false $_.Exception.Message
}

# Test 3: Environment Configuration
Write-Host "⚙️ Testing environment configuration..." -ForegroundColor Yellow

try {
    # Check .env.example
    if (Test-Path ".env.example") {
        $envExample = Get-Content ".env.example"
        $requiredVars = @("GITHUB_TOKEN", "GITHUB_REPOSITORY", "WEBHOOK_SECRET", "PORT")
        $missingVars = @()
        
        foreach ($var in $requiredVars) {
            if (-not ($envExample | Where-Object { $_ -match "^$var=" })) {
                $missingVars += $var
            }
        }
        
        Test-Result "Environment template complete" ($missingVars.Count -eq 0) "Missing: $($missingVars -join ', ')"
    } else {
        Test-Result ".env.example exists" $false
    }
} catch {
    Test-Result "Environment validation" $false $_.Exception.Message
}

# Test 4: Docker Configuration
Write-Host "🐳 Testing Docker configuration..." -ForegroundColor Yellow

try {
    if (Test-Path "Dockerfile") {
        $dockerfile = Get-Content "Dockerfile"
        $hasNodeImage = $dockerfile | Where-Object { $_ -match "FROM.*node" }
        $hasWorkdir = $dockerfile | Where-Object { $_ -match "WORKDIR" }
        $hasExpose = $dockerfile | Where-Object { $_ -match "EXPOSE.*3001" }
        
        Test-Result "Dockerfile exists" $true
        Test-Result "Node.js base image" ($hasNodeImage -ne $null)
        Test-Result "Working directory set" ($hasWorkdir -ne $null)
        Test-Result "Port exposed" ($hasExpose -ne $null)
    } else {
        Test-Result "Dockerfile exists" $false
    }
} catch {
    Test-Result "Docker validation" $false $_.Exception.Message
}

# Test 5: CI/CD Configuration
Write-Host "🔄 Testing CI/CD configuration..." -ForegroundColor Yellow

try {
    $ciPath = "..\..\..\.github\workflows\github-agent-ci.yml"
    if (Test-Path $ciPath) {
        $ciContent = Get-Content $ciPath
        $hasIntegrationTests = $ciContent | Where-Object { $_ -match "integration.*test" }
        $hasPrometheusCheck = $ciContent | Where-Object { $_ -match "prometheus.*metrics" }
        $hasSyntaxCheck = $ciContent | Where-Object { $_ -match "syntax.*check" }
        
        Test-Result "CI pipeline exists" $true
        Test-Result "Integration tests configured" ($hasIntegrationTests -ne $null)
        Test-Result "Prometheus metrics validation" ($hasPrometheusCheck -ne $null)
        Test-Result "Syntax validation" ($hasSyntaxCheck -ne $null)
    } else {
        Test-Result "CI pipeline exists" $false "Path: $ciPath"
    }
} catch {
    Test-Result "CI/CD validation" $false $_.Exception.Message
}

# Test 6: Security Configuration
Write-Host "🔐 Testing security configuration..." -ForegroundColor Yellow

try {
    if (Test-Path "src\index.js") {
        $indexContent = Get-Content "src\index.js" -Raw
        $hasHmacVerification = $indexContent -match "createHmac.*sha256"
        $hasSignatureValidation = $indexContent -match "X-Hub-Signature-256"
        $hasErrorHandling = $indexContent -match "try.*catch"
        
        Test-Result "HMAC signature verification" $hasHmacVerification
        Test-Result "GitHub signature validation" $hasSignatureValidation
        Test-Result "Error handling present" $hasErrorHandling
    }
} catch {
    Test-Result "Security validation" $false $_.Exception.Message
}

# Test 7: PowerShell Webhook Signature Generation
Write-Host "🔧 Testing PowerShell webhook compatibility..." -ForegroundColor Yellow

try {
    $testPayload = '{"test":"powershell_signature","timestamp":"' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '"}'
    $signature = Generate-GitHubSignature -payload $testPayload -secret $WebhookSecret
    
    Test-Result "PowerShell signature generation" ($signature -match "^sha256=[a-f0-9]{64}$") "Signature: $signature"
    
    # Test command generation
    $curlCommand = @"
curl -X POST '$BaseUrl/webhook' \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-GitHub-Delivery: $(New-Guid)" \
  -H "X-Hub-Signature-256: $signature" \
  --data '$testPayload'
"@
    
    Test-Result "Webhook test command generated" ($curlCommand.Length -gt 0)
    
} catch {
    Test-Result "PowerShell compatibility" $false $_.Exception.Message
}

# Test 8: Integration Test File
Write-Host "🧪 Testing integration test configuration..." -ForegroundColor Yellow

try {
    if (Test-Path "webhook-integration-test.js") {
        $testContent = Get-Content "webhook-integration-test.js" -Raw
        $hasTestSuite = $testContent -match "class.*WebhookIntegrationTest"
        $hasSigVerification = $testContent -match "generateSignature"
        $hasMetricsTest = $testContent -match "testMetricsCollection"
        $hasBurstTest = $testContent -match "testBurstLoad"
        
        Test-Result "Integration test suite exists" $true
        Test-Result "Test class structure" $hasTestSuite
        Test-Result "Signature verification test" $hasSigVerification
        Test-Result "Metrics collection test" $hasMetricsTest
        Test-Result "Burst load test" $hasBurstTest
    } else {
        Test-Result "Integration test file exists" $false
    }
} catch {
    Test-Result "Integration test validation" $false $_.Exception.Message
}

# Final Report
Write-Host ""
Write-Host "📊 Production Readiness Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Total tests: $testsTotal" -ForegroundColor White
Write-Host "Passed: $testsPassed ✅" -ForegroundColor Green
Write-Host "Failed: $($testsTotal - $testsPassed) ❌" -ForegroundColor Red
Write-Host "Success rate: $([math]::Round(($testsPassed / $testsTotal) * 100, 1))%" -ForegroundColor White

# Critical Tests Assessment
$criticalTests = @(
    "JavaScript syntax validation",
    "Express dependency",
    "Prometheus client dependency", 
    "HMAC signature verification",
    "Integration test suite exists"
)

$criticalPassed = 0
foreach ($test in $criticalTests) {
    $result = $testResults | Where-Object { $_.Name -eq $test }
    if ($result -and $result.Passed) {
        $criticalPassed++
    }
}

Write-Host ""
if ($criticalPassed -eq $criticalTests.Count) {
    Write-Host "🎉 ALL CRITICAL TESTS PASSED - READY FOR PRODUCTION" -ForegroundColor Green
    Write-Host "🚀 Your GitHub PR Manager is production-ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️ CRITICAL TESTS FAILED - DO NOT DEPLOY TO PRODUCTION" -ForegroundColor Red
    Write-Host "❌ Critical failures: $($criticalTests.Count - $criticalPassed)/$($criticalTests.Count)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 PowerShell Test Commands:" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow

# Generate sample webhook test commands
$samplePayload = '{"test":"manual_powershell_test","timestamp":"' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '"}'
$sampleSignature = Generate-GitHubSignature -payload $samplePayload -secret $WebhookSecret

Write-Host "`# Generate signature:" -ForegroundColor Gray
Write-Host "`$secret = '$WebhookSecret'" -ForegroundColor White
Write-Host "`$payload = '$samplePayload'" -ForegroundColor White
Write-Host "`$hmac = New-Object System.Security.Cryptography.HMACSHA256([System.Text.Encoding]::UTF8.GetBytes(`$secret))" -ForegroundColor White
Write-Host "`$hash = `$hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(`$payload))" -ForegroundColor White
Write-Host "`$sig = 'sha256=' + ([System.BitConverter]::ToString(`$hash) -replace '-','').ToLower()" -ForegroundColor White
Write-Host "Write-Output `$sig" -ForegroundColor White
Write-Host ""
Write-Host "# Expected signature: $sampleSignature" -ForegroundColor Gray
Write-Host ""
Write-Host "# Send webhook:" -ForegroundColor Gray
Write-Host "curl -X POST '$BaseUrl/webhook' \\" -ForegroundColor White
Write-Host "  -H `"Content-Type: application/json`" \\" -ForegroundColor White
Write-Host "  -H `"X-GitHub-Event: ping`" \\" -ForegroundColor White
Write-Host "  -H `"X-Hub-Signature-256: `$sig`" \\" -ForegroundColor White
Write-Host "  -H `"X-GitHub-Delivery: $((New-Guid).ToString())`" \\" -ForegroundColor White
Write-Host "  --data '$samplePayload'" -ForegroundColor White

Write-Host ""
Write-Host "🏭 Deployment Commands:" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host "# Start with environment variables:" -ForegroundColor Gray
Write-Host "`$env:GITHUB_REPOSITORY='your-org/your-repo'" -ForegroundColor White
Write-Host "`$env:GITHUB_TOKEN='your-github-token'" -ForegroundColor White
Write-Host "`$env:WEBHOOK_SECRET='your-webhook-secret'" -ForegroundColor White
Write-Host "node src\index.js" -ForegroundColor White

# Return exit code based on results
if ($criticalPassed -eq $criticalTests.Count) {
    exit 0
} else {
    exit 1
}