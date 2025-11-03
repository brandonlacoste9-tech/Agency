# GitHub Webhook Testing and Operational PowerShell Scripts
# For production operations and troubleshooting

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3001",
    
    [Parameter(Mandatory=$false)]
    [string]$WebhookSecret = $env:WEBHOOK_SECRET,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("test-signature", "test-endpoints", "send-webhook", "health-check", "metrics-check", "emergency-restart", "queue-status")]
    [string]$Operation = "health-check"
)

# Color output functions
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }

function Generate-GitHubSignature {
    param($payload, $secret)
    
    if (-not $secret) {
        Write-Error "Webhook secret not provided. Set WEBHOOK_SECRET environment variable or use -WebhookSecret parameter"
        return $null
    }
    
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($secret)
    $hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
    return "sha256=" + ([System.BitConverter]::ToString($hash) -replace '-','').ToLower()
}

function Test-Signature {
    Write-Info "Testing PowerShell HMAC-SHA256 signature generation..."
    
    $testPayload = '{"test":"signature_validation","timestamp":"' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '"}'
    $signature = Generate-GitHubSignature -payload $testPayload -secret $WebhookSecret
    
    if ($signature) {
        Write-Success "Generated signature: $signature"
        Write-Info "Payload: $testPayload"
        Write-Info "Test this with:"
        Write-Host "curl -X POST '$BaseUrl/webhook' \\" -ForegroundColor White
        Write-Host "  -H `"Content-Type: application/json`" \\" -ForegroundColor White
        Write-Host "  -H `"X-GitHub-Event: ping`" \\" -ForegroundColor White
        Write-Host "  -H `"X-Hub-Signature-256: $signature`" \\" -ForegroundColor White
        Write-Host "  -H `"X-GitHub-Delivery: $((New-Guid).ToString())`" \\" -ForegroundColor White
        Write-Host "  --data '$testPayload'" -ForegroundColor White
    }
}

function Test-Endpoints {
    Write-Info "Testing all service endpoints..."
    
    $endpoints = @(
        @{Path = "health"; Description = "Service health check"},
        @{Path = "ready"; Description = "Deployment readiness"},
        @{Path = "metrics"; Description = "Prometheus metrics"},
        @{Path = "webhook/stats"; Description = "Webhook statistics"}
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/$($endpoint.Path)" -TimeoutSec 10
            Write-Success "$($endpoint.Description) - OK"
            
            if ($endpoint.Path -eq "health") {
                Write-Host "   Status: $($response.status)" -ForegroundColor Gray
            }
            elseif ($endpoint.Path -eq "metrics") {
                $metricsText = $response
                $webhookMetrics = $metricsText | Select-String "github_webhooks_total|github_webhook_queue_length"
                if ($webhookMetrics) {
                    Write-Host "   Found webhook metrics" -ForegroundColor Gray
                }
            }
        }
        catch {
            Write-Error "$($endpoint.Description) - FAILED: $($_.Exception.Message)"
        }
    }
}

function Send-TestWebhook {
    Write-Info "Sending test webhook..."
    
    if (-not $WebhookSecret) {
        Write-Error "Webhook secret required for sending webhooks"
        return
    }
    
    $payload = @{
        action = "opened"
        number = 999
        pull_request = @{
            id = 999
            number = 999
            title = "PowerShell operational test webhook"
            body = "This is a test webhook sent from PowerShell operational script"
            state = "open"
            user = @{
                login = "ops-script"
                id = 99999
            }
        }
        repository = @{
            name = "test-repo"
            full_name = "ops/test-repo"
            owner = @{
                login = "ops"
                id = 99999
            }
        }
        sender = @{
            login = "ops-script"
            id = 99999
        }
    } | ConvertTo-Json -Depth 10
    
    $signature = Generate-GitHubSignature -payload $payload -secret $WebhookSecret
    
    if (-not $signature) {
        return
    }
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
            'X-GitHub-Event' = 'pull_request'
            'X-Hub-Signature-256' = $signature
            'X-GitHub-Delivery' = [guid]::NewGuid().ToString()
            'User-Agent' = 'PowerShell-OpsScript/1.0'
        }
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/webhook" -Method POST -Headers $headers -Body $payload -TimeoutSec 30
        Write-Success "Test webhook sent successfully"
        Write-Info "Response: $($response | ConvertTo-Json)"
    }
    catch {
        Write-Error "Failed to send webhook: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Error "HTTP Status: $statusCode"
        }
    }
}

function Test-HealthCheck {
    Write-Info "Performing comprehensive health check..."
    
    # Service availability
    try {
        $health = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 10
        Write-Success "Service is running"
        Write-Host "   Status: $($health.status)" -ForegroundColor Gray
        Write-Host "   Uptime: $($health.uptime)" -ForegroundColor Gray
    }
    catch {
        Write-Error "Service is DOWN: $($_.Exception.Message)"
        return
    }
    
    # Check readiness
    try {
        $ready = Invoke-RestMethod -Uri "$BaseUrl/ready" -TimeoutSec 10
        Write-Success "Service is ready"
    }
    catch {
        Write-Warning "Service not ready: $($_.Exception.Message)"
    }
    
    # Check metrics
    try {
        $metrics = Invoke-RestMethod -Uri "$BaseUrl/metrics" -TimeoutSec 10
        if ($metrics -match "github_webhooks_total") {
            Write-Success "Prometheus metrics available"
        } else {
            Write-Warning "Webhook metrics not found"
        }
    }
    catch {
        Write-Error "Metrics endpoint failed: $($_.Exception.Message)"
    }
    
    # Test signature generation
    if ($WebhookSecret) {
        $testSig = Generate-GitHubSignature -payload "test" -secret $WebhookSecret
        if ($testSig) {
            Write-Success "Signature generation working"
        }
    } else {
        Write-Warning "No webhook secret - cannot test signature generation"
    }
}

function Check-Metrics {
    Write-Info "Checking key metrics..."
    
    try {
        $metrics = Invoke-RestMethod -Uri "$BaseUrl/metrics" -TimeoutSec 10
        
        # Parse key metrics
        $queueLength = [regex]::Match($metrics, 'github_webhook_queue_length\s+(\d+)').Groups[1].Value
        $totalWebhooks = [regex]::Match($metrics, 'github_webhooks_total\s+(\d+)').Groups[1].Value
        $totalErrors = [regex]::Match($metrics, 'github_webhook_errors_total\s+(\d+)').Groups[1].Value
        
        Write-Host "📊 Current Metrics:" -ForegroundColor Cyan
        Write-Host "   Queue Length: $queueLength" -ForegroundColor White
        Write-Host "   Total Webhooks: $totalWebhooks" -ForegroundColor White
        Write-Host "   Total Errors: $totalErrors" -ForegroundColor White
        
        # Calculate error rate
        if ($totalWebhooks -gt 0) {
            $errorRate = [math]::Round(($totalErrors / $totalWebhooks) * 100, 2)
            Write-Host "   Error Rate: $errorRate%" -ForegroundColor $(if ($errorRate -gt 5) {"Red"} else {"Green"})
        }
        
        # Alerts
        if ($queueLength -gt 100) {
            Write-Warning "High queue length detected! ($queueLength items)"
        }
        
        if ($totalErrors -gt 0 -and $totalWebhooks -gt 0) {
            $errorRate = ($totalErrors / $totalWebhooks) * 100
            if ($errorRate -gt 5) {
                Write-Warning "High error rate detected! ($errorRate%)"
            }
        }
        
    }
    catch {
        Write-Error "Failed to retrieve metrics: $($_.Exception.Message)"
    }
}

function Emergency-Restart {
    Write-Warning "Performing emergency restart..."
    
    Write-Info "Stopping Docker containers..."
    try {
        & docker-compose -f docker-compose.production.yml stop github-pr-manager
        Write-Success "Service stopped"
    }
    catch {
        Write-Error "Failed to stop service: $($_.Exception.Message)"
    }
    
    Write-Info "Starting service..."
    try {
        & docker-compose -f docker-compose.production.yml up -d github-pr-manager
        Write-Success "Service started"
    }
    catch {
        Write-Error "Failed to start service: $($_.Exception.Message)"
        return
    }
    
    Write-Info "Waiting for service to be ready..."
    $maxAttempts = 30
    $attempt = 0
    
    do {
        Start-Sleep -Seconds 2
        $attempt++
        try {
            $health = Invoke-RestMethod -Uri "$BaseUrl/health" -TimeoutSec 5
            if ($health.status -eq "healthy") {
                Write-Success "Service is healthy after restart"
                return
            }
        }
        catch {
            # Service not ready yet, continue waiting
        }
        
        Write-Host "." -NoNewline
    } while ($attempt -lt $maxAttempts)
    
    Write-Error "Service did not become healthy within $($maxAttempts * 2) seconds"
}

function Check-QueueStatus {
    Write-Info "Checking queue and processing status..."
    
    try {
        # Get metrics
        $metrics = Invoke-RestMethod -Uri "$BaseUrl/metrics" -TimeoutSec 10
        
        # Extract queue metrics
        $queueLength = [regex]::Match($metrics, 'github_webhook_queue_length\s+(\d+)').Groups[1].Value
        $processed = [regex]::Match($metrics, 'github_webhooks_total\s+(\d+)').Groups[1].Value
        
        Write-Host "🔄 Queue Status:" -ForegroundColor Cyan
        Write-Host "   Current Queue Length: $queueLength" -ForegroundColor White
        Write-Host "   Total Processed: $processed" -ForegroundColor White
        
        # Check stats endpoint if available
        try {
            $stats = Invoke-RestMethod -Uri "$BaseUrl/webhook/stats" -TimeoutSec 10
            Write-Host "   Recent Activity:" -ForegroundColor White
            $stats | ConvertTo-Json | Write-Host -ForegroundColor Gray
        }
        catch {
            Write-Warning "Stats endpoint not available"
        }
        
        if ([int]$queueLength -gt 50) {
            Write-Warning "Queue is backing up! Consider scaling up workers."
            Write-Info "To scale up: docker-compose -f docker-compose.production.yml up -d --scale github-pr-manager=3"
        }
        elseif ([int]$queueLength -eq 0) {
            Write-Success "Queue is empty - processing is keeping up"
        }
        else {
            Write-Success "Queue length is normal ($queueLength items)"
        }
        
    }
    catch {
        Write-Error "Failed to check queue status: $($_.Exception.Message)"
    }
}

# Main execution
Write-Host "🔧 GitHub PR Manager - PowerShell Operations Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Operation: $Operation" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "Secret configured: $($WebhookSecret -ne $null -and $WebhookSecret -ne '')" -ForegroundColor Cyan
Write-Host ""

switch ($Operation) {
    "test-signature" { Test-Signature }
    "test-endpoints" { Test-Endpoints }
    "send-webhook" { Send-TestWebhook }
    "health-check" { Test-HealthCheck }
    "metrics-check" { Check-Metrics }
    "emergency-restart" { Emergency-Restart }
    "queue-status" { Check-QueueStatus }
    default { 
        Write-Error "Unknown operation: $Operation"
        Write-Info "Available operations: test-signature, test-endpoints, send-webhook, health-check, metrics-check, emergency-restart, queue-status"
    }
}

Write-Host ""
Write-Host "🏁 Operation completed" -ForegroundColor Green