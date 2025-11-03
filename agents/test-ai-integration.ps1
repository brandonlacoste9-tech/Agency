#!/usr/bin/env pwsh
# Test AI Integration for GitHub PR Manager
# Usage: .\test-ai-integration.ps1

param(
    [string]$ServiceUrl = "http://localhost:3001",
    [string]$AIServiceUrl = "http://localhost:8000",
    [switch]$Verbose
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Test {
    param($Test, $Status, $Details = "")
    $color = switch($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "White" }
    }
    
    $symbol = switch($Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "SKIP" { "⏭️" }
        default { "🔍" }
    }
    
    Write-Host "$symbol $Test" -ForegroundColor $color -NoNewline
    if ($Details) {
        Write-Host " - $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

function Test-ServiceHealth {
    param($Url, $ServiceName)
    
    try {
        $response = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.status -eq "healthy") {
            Write-Test "$ServiceName Health Check" "PASS" "Status: $($response.status)"
            return $true
        } else {
            Write-Test "$ServiceName Health Check" "FAIL" "Status: $($response.status)"
            return $false
        }
    } catch {
        Write-Test "$ServiceName Health Check" "FAIL" "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-AIServiceConnection {
    try {
        # Test basic AI service connectivity
        $testPrompt = @{
            model = "ai/smollm2"
            messages = @(
                @{
                    role = "user"
                    content = "Test connection. Respond with 'OK' only."
                }
            )
            max_tokens = 10
            temperature = 0.1
        }
        
        $response = Invoke-RestMethod -Uri "$AIServiceUrl/v1/chat/completions" -Method POST -Body ($testPrompt | ConvertTo-Json -Depth 10) -ContentType "application/json" -TimeoutSec 15 -ErrorAction Stop
        
        if ($response.choices -and $response.choices[0].message.content) {
            Write-Test "AI Service API Test" "PASS" "Response received"
            return $true
        } else {
            Write-Test "AI Service API Test" "FAIL" "Invalid response format"
            return $false
        }
    } catch {
        Write-Test "AI Service API Test" "FAIL" "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-PRAnalysisEndpoint {
    # This would test the actual PR analysis if we had a test endpoint
    # For now, we'll check if the GitHub agent is properly configured
    
    try {
        $health = Invoke-RestMethod -Uri "$ServiceUrl/health" -TimeoutSec 10
        
        $aiEnabled = $health.ai_enabled
        $aiService = $health.ai_service
        
        if ($aiEnabled -eq $true) {
            Write-Test "AI Analysis Configuration" "PASS" "AI enabled: $aiEnabled, Service: $aiService"
            return $true
        } else {
            Write-Test "AI Analysis Configuration" "SKIP" "AI disabled in configuration"
            return $false
        }
    } catch {
        Write-Test "AI Analysis Configuration" "FAIL" "Cannot check configuration"
        return $false
    }
}

function Test-EnvironmentVariables {
    $required = @("GITHUB_TOKEN", "GITHUB_REPOSITORY")
    $optional = @("WEBHOOK_SECRET", "ENABLE_AI_ANALYSIS", "AI_SERVICE_URL")
    $allGood = $true
    
    foreach ($var in $required) {
        if (Get-Variable -Name "env:$var" -ErrorAction SilentlyContinue) {
            Write-Test "Required Env Var: $var" "PASS" "Set"
        } else {
            Write-Test "Required Env Var: $var" "FAIL" "Not set"
            $allGood = $false
        }
    }
    
    foreach ($var in $optional) {
        if (Get-Variable -Name "env:$var" -ErrorAction SilentlyContinue) {
            Write-Test "Optional Env Var: $var" "PASS" "Set"
        } else {
            Write-Test "Optional Env Var: $var" "SKIP" "Not set"
        }
    }
    
    return $allGood
}

function Test-NetworkConnectivity {
    $endpoints = @{
        "GitHub Agent" = $ServiceUrl
        "AI Service" = $AIServiceUrl
    }
    
    $allGood = $true
    
    foreach ($endpoint in $endpoints.GetEnumerator()) {
        try {
            $uri = [System.Uri]$endpoint.Value
            $connection = Test-NetConnection -ComputerName $uri.Host -Port $uri.Port -WarningAction SilentlyContinue -ErrorAction Stop
            
            if ($connection.TcpTestSucceeded) {
                Write-Test "$($endpoint.Key) Network" "PASS" "$($uri.Host):$($uri.Port)"
            } else {
                Write-Test "$($endpoint.Key) Network" "FAIL" "Cannot connect to $($uri.Host):$($uri.Port)"
                $allGood = $false
            }
        } catch {
            Write-Test "$($endpoint.Key) Network" "FAIL" "Error testing connection"
            $allGood = $false
        }
    }
    
    return $allGood
}

function Test-GitHubAPIAccess {
    if (-not $env:GITHUB_TOKEN) {
        Write-Test "GitHub API Access" "SKIP" "No token provided"
        return $false
    }
    
    try {
        $headers = @{
            "Authorization" = "Bearer $env:GITHUB_TOKEN"
            "Accept" = "application/vnd.github.v3+json"
            "User-Agent" = "GitHub-PR-Manager-Test"
        }
        
        $response = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -TimeoutSec 10
        
        Write-Test "GitHub API Access" "PASS" "Authenticated as: $($response.login)"
        return $true
    } catch {
        Write-Test "GitHub API Access" "FAIL" "Authentication failed: $($_.Exception.Message)"
        return $false
    }
}

function Run-IntegrationTests {
    Write-Host "`n🧪 Running Integration Tests..." -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    $testResults = @{
        NetworkConnectivity = Test-NetworkConnectivity
        EnvironmentVariables = Test-EnvironmentVariables
        GitHubAgentHealth = Test-ServiceHealth -Url $ServiceUrl -ServiceName "GitHub Agent"
        AIServiceHealth = Test-ServiceHealth -Url $AIServiceUrl -ServiceName "AI Service"
        AIServiceAPI = Test-AIServiceConnection
        AIConfiguration = Test-PRAnalysisEndpoint
        GitHubAPI = Test-GitHubAPIAccess
    }
    
    Write-Host "`n📊 Test Results Summary:" -ForegroundColor Yellow
    Write-Host "=" * 30 -ForegroundColor Yellow
    
    $passed = 0
    $failed = 0
    $skipped = 0
    
    foreach ($test in $testResults.GetEnumerator()) {
        if ($test.Value -eq $true) {
            Write-Host "✅ $($test.Key)" -ForegroundColor Green
            $passed++
        } elseif ($test.Value -eq $false) {
            Write-Host "❌ $($test.Key)" -ForegroundColor Red
            $failed++
        } else {
            Write-Host "⏭️ $($test.Key)" -ForegroundColor Yellow
            $skipped++
        }
    }
    
    Write-Host "`nResults: $passed passed, $failed failed, $skipped skipped" -ForegroundColor White
    
    if ($failed -eq 0) {
        Write-Host "`n🎉 All critical tests passed! AI integration is ready." -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n⚠️ Some tests failed. Check the configuration and service status." -ForegroundColor Yellow
        return $false
    }
}

function Show-SystemStatus {
    Write-Host "`n📊 System Status:" -ForegroundColor Cyan
    
    try {
        $health = Invoke-RestMethod -Uri "$ServiceUrl/health" -TimeoutSec 5
        
        Write-Host "  Service: " -NoNewline
        Write-Host $health.status -ForegroundColor Green
        Write-Host "  Repository: " -NoNewline
        Write-Host ($health.repo ?? "Not configured") -ForegroundColor Cyan
        Write-Host "  AI Enabled: " -NoNewline
        Write-Host $health.ai_enabled -ForegroundColor $(if($health.ai_enabled){"Green"}else{"Yellow"})
        Write-Host "  AI Service: " -NoNewline
        Write-Host $health.ai_service -ForegroundColor Cyan
        Write-Host "  Environment: " -NoNewline
        Write-Host $health.mode -ForegroundColor White
        Write-Host "  Timestamp: " -NoNewline
        Write-Host $health.timestamp -ForegroundColor Gray
        
    } catch {
        Write-Host "  Status: " -NoNewline
        Write-Host "Unable to retrieve" -ForegroundColor Red
    }
    
    Write-Host "`n🔗 Service Endpoints:" -ForegroundColor Cyan
    Write-Host "  GitHub Agent: $ServiceUrl/health" -ForegroundColor White
    Write-Host "  AI Service: $AIServiceUrl" -ForegroundColor White
    
    if ($Verbose) {
        Write-Host "`n🌍 Environment Variables:" -ForegroundColor Cyan
        $envVars = @("GITHUB_REPOSITORY", "ENABLE_AI_ANALYSIS", "AI_SERVICE_URL", "NODE_ENV")
        foreach ($var in $envVars) {
            $value = [Environment]::GetEnvironmentVariable($var)
            Write-Host "  $var: " -NoNewline
            Write-Host ($value ?? "Not set") -ForegroundColor $(if($value){"Green"}else{"Yellow"})
        }
    }
}

# Main execution
try {
    Write-Host "🤖 GitHub PR Manager AI Integration Test Suite" -ForegroundColor Green
    Write-Host "=" * 55 -ForegroundColor Green
    
    Show-SystemStatus
    
    $success = Run-IntegrationTests
    
    if ($success) {
        Write-Host "`n🚀 Recommendations:" -ForegroundColor Green
        Write-Host "  • System is ready for production use" -ForegroundColor White
        Write-Host "  • Configure webhook in GitHub repository settings" -ForegroundColor White
        Write-Host "  • Monitor logs: npx pm2 logs github-pr-manager" -ForegroundColor White
        Write-Host "  • Test with a real PR to verify AI analysis" -ForegroundColor White
    } else {
        Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
        Write-Host "  • Fix failed tests before proceeding" -ForegroundColor White
        Write-Host "  • Check service logs for detailed error information" -ForegroundColor White
        Write-Host "  • Verify environment variables are set correctly" -ForegroundColor White
        Write-Host "  • Ensure all services are running and accessible" -ForegroundColor White
    }
    
} catch {
    Write-Host "`n❌ Test suite failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}