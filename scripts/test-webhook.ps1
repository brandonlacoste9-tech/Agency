# scripts/test-webhook.ps1
# PowerShell script for testing webhook with signature computation

param(
    [string]$WebhookUrl = "http://localhost:3001/webhook",
    [string]$Secret = "test",
    [string]$PayloadFile = "tests/integration/payload.json",
    [string]$EventType = "push"
)

Write-Host "🔧 GitHub Webhook Test Script" -ForegroundColor Green
Write-Host "═══════════════════════════════════" -ForegroundColor Green

# Check if payload file exists
if (-not (Test-Path $PayloadFile)) {
    Write-Host "❌ Payload file not found: $PayloadFile" -ForegroundColor Red
    Write-Host "💡 Create the file with a sample GitHub webhook payload" -ForegroundColor Yellow
    exit 1
}

# Read payload
Write-Host "📄 Reading payload from: $PayloadFile" -ForegroundColor Cyan
$payload = Get-Content $PayloadFile -Raw -Encoding UTF8

# Compute HMAC-SHA256 signature
Write-Host "🔐 Computing HMAC-SHA256 signature..." -ForegroundColor Cyan
$secretBytes = [System.Text.Encoding]::UTF8.GetBytes($Secret)
$payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$hmac = [System.Security.Cryptography.HMACSHA256]::new($secretBytes)
$hashBytes = $hmac.ComputeHash($payloadBytes)
$signature = "sha256=" + ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLower()
$hmac.Dispose()

Write-Host "✅ Signature: $($signature.Substring(0, 20))..." -ForegroundColor Green

# Prepare headers
$delivery = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$headers = @{
    'Content-Type'        = 'application/json'
    'X-GitHub-Event'      = $EventType
    'X-Hub-Signature-256' = $signature
    'X-GitHub-Delivery'   = $delivery
    'User-Agent'          = 'GitHub-Hookshot/powershell-test'
}

Write-Host "📡 Posting webhook to: $WebhookUrl" -ForegroundColor Cyan
Write-Host "📦 Delivery ID: $delivery" -ForegroundColor Gray

try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    # Make the request
    $response = Invoke-RestMethod -Uri $WebhookUrl -Method POST -Body $payload -Headers $headers -TimeoutSec 30
    
    $stopwatch.Stop()
    $duration = $stopwatch.ElapsedMilliseconds
    
    Write-Host "✅ Request successful!" -ForegroundColor Green
    Write-Host "⏱️  Response time: ${duration}ms" -ForegroundColor Gray
    
    if ($response) {
        Write-Host "📋 Response:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "❌ Request failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Message -like "*connection*refused*") {
        Write-Host "💡 Is the webhook server running?" -ForegroundColor Yellow
        Write-Host "   docker-compose -f docker-compose-basic.yml up github-pr-manager" -ForegroundColor Gray
    }
    
    exit 1
}

# Optional: Check health endpoint
try {
    $healthUrl = $WebhookUrl -replace '/webhook$', '/health'
    Write-Host "🏥 Checking health endpoint: $healthUrl" -ForegroundColor Cyan
    
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 10
    Write-Host "✅ Health check passed" -ForegroundColor Green
    
    if ($healthResponse.checks) {
        Write-Host "📊 Service status:" -ForegroundColor Cyan
        $healthResponse.checks | ConvertTo-Json | Write-Host -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "⚠️  Health check failed (this is optional)" -ForegroundColor Yellow
}

# Optional: Check metrics endpoint
try {
    $metricsUrl = $WebhookUrl -replace '/webhook$', '/metrics'
    Write-Host "📊 Checking metrics endpoint: $metricsUrl" -ForegroundColor Cyan
    
    $metricsResponse = Invoke-RestMethod -Uri $metricsUrl -Method GET -TimeoutSec 10
    $metricsLines = $metricsResponse -split "`n" | Where-Object { $_ -match "github_webhook" }
    
    if ($metricsLines.Count -gt 0) {
        Write-Host "✅ Metrics endpoint accessible" -ForegroundColor Green
        Write-Host "📈 Key metrics:" -ForegroundColor Cyan
        $metricsLines | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    }
    
}
catch {
    Write-Host "⚠️  Metrics check failed (this is optional)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Webhook test completed!" -ForegroundColor Green
Write-Host "💡 Check the webhook server logs for processing details" -ForegroundColor Yellow
