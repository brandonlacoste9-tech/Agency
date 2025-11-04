#!/usr/bin/env pwsh
# GitHub PR Manager with AI Integration Setup Script
# Usage: .\setup-ai-integration.ps1

param(
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$Repository = $env:GITHUB_REPOSITORY,
    [string]$WebhookSecret = $env:WEBHOOK_SECRET,
    [switch]$EnableAI = $true,
    [switch]$Docker = $false,
    [switch]$Development = $false
)

Set-StrictMode -Version Latest
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

function Test-Prerequisites {
    Write-Status "Checking prerequisites..." "Info"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Status "✅ Node.js: $nodeVersion" "Success"
    } catch {
        Write-Status "❌ Node.js not found. Please install Node.js 18+" "Error"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Status "✅ npm: v$npmVersion" "Success"
    } catch {
        Write-Status "❌ npm not found" "Error"
        return $false
    }
    
    # Check Docker (if requested)
    if ($Docker) {
        try {
            $dockerVersion = docker --version
            Write-Status "✅ Docker: $dockerVersion" "Success"
        } catch {
            Write-Status "❌ Docker not found. Please install Docker Desktop" "Error"
            return $false
        }
        
        try {
            $composeVersion = docker compose version
            Write-Status "✅ Docker Compose: $composeVersion" "Success"
        } catch {
            Write-Status "❌ Docker Compose not found" "Error"
            return $false
        }
    }
    
    return $true
}

function Set-Environment {
    Write-Status "Setting up environment..." "Info"
    
    if (-not $GitHubToken) {
        Write-Status "⚠️  GITHUB_TOKEN not provided. Some features will be limited." "Warning"
    } else {
        $env:GITHUB_TOKEN = $GitHubToken
        Write-Status "✅ GitHub token configured" "Success"
    }
    
    if ($Repository) {
        $env:GITHUB_REPOSITORY = $Repository
        Write-Status "✅ Repository: $Repository" "Success"
    } else {
        Write-Status "⚠️  GITHUB_REPOSITORY not specified" "Warning"
    }
    
    if ($WebhookSecret) {
        $env:WEBHOOK_SECRET = $WebhookSecret
        Write-Status "✅ Webhook secret configured" "Success"
    }
    
    $env:ENABLE_AI_ANALYSIS = if ($EnableAI) { "true" } else { "false" }
    $env:AI_SERVICE_URL = "http://localhost:8000"
    $env:NODE_ENV = if ($Development) { "development" } else { "production" }
    $env:PORT = "3001"
    
    Write-Status "Environment configured for $(if($Development){'development'}else{'production'}) mode" "Success"
}

function Install-Dependencies {
    Write-Status "Installing dependencies..." "Info"
    
    Push-Location "agents/github-pr-manager"
    
    try {
        if (Test-Path "package-lock.json") {
            npm ci
        } else {
            npm install
        }
        Write-Status "✅ Dependencies installed" "Success"
    } catch {
        Write-Status "❌ Failed to install dependencies: $($_.Exception.Message)" "Error"
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

function Build-Application {
    Write-Status "Building application..." "Info"
    
    Push-Location "agents/github-pr-manager"
    
    try {
        npm run build
        
        if (Test-Path "dist/index.js") {
            Write-Status "✅ Build completed successfully" "Success"
        } else {
            Write-Status "❌ Build failed - dist/index.js not found" "Error"
            Pop-Location
            return $false
        }
    } catch {
        Write-Status "❌ Build failed: $($_.Exception.Message)" "Error"
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

function Start-DockerServices {
    Write-Status "Starting Docker services..." "Info"
    
    Push-Location "agents"
    
    try {
        # Create environment file for Docker
        $envContent = @"
GITHUB_TOKEN=$env:GITHUB_TOKEN
GITHUB_REPOSITORY=$env:GITHUB_REPOSITORY
WEBHOOK_SECRET=$env:WEBHOOK_SECRET
ENABLE_AI_ANALYSIS=$env:ENABLE_AI_ANALYSIS
NODE_ENV=$env:NODE_ENV
DB_PASSWORD=github_agent_secure_pass
GRAFANA_PASSWORD=admin_secure_pass
"@
        Set-Content -Path ".env" -Value $envContent
        
        # Start services
        docker compose -f docker-compose-ai.yml up -d
        
        Write-Status "✅ Docker services started" "Success"
        Write-Status "Waiting for services to be ready..." "Info"
        
        # Wait for health checks
        Start-Sleep -Seconds 30
        
        # Check service health
        $healthChecks = @{
            "GitHub Agent" = "http://localhost:3001/health"
            "AI Service" = "http://localhost:8000/health"
            "Redis" = "redis://localhost:6379"
        }
        
        foreach ($service in $healthChecks.GetEnumerator()) {
            try {
                if ($service.Value.StartsWith("http")) {
                    $response = Invoke-RestMethod -Uri $service.Value -TimeoutSec 10
                    Write-Status "✅ $($service.Key): Healthy" "Success"
                } else {
                    # For Redis, just check if port is open
                    $connection = Test-NetConnection -ComputerName "localhost" -Port 6379 -WarningAction SilentlyContinue
                    if ($connection.TcpTestSucceeded) {
                        Write-Status "✅ Redis: Connected" "Success"
                    } else {
                        Write-Status "⚠️  Redis: Connection failed" "Warning"
                    }
                }
            } catch {
                Write-Status "⚠️  $($service.Key): Health check failed" "Warning"
            }
        }
        
    } catch {
        Write-Status "❌ Failed to start Docker services: $($_.Exception.Message)" "Error"
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

function Start-LocalServices {
    Write-Status "Starting local services..." "Info"
    
    # Check if PM2 is available
    try {
        $pm2Version = npx pm2 --version
        Write-Status "Using PM2 v$pm2Version" "Info"
        
        Push-Location "agents/github-pr-manager"
        
        # Stop any existing processes
        npx pm2 delete github-pr-manager 2>$null | Out-Null
        
        # Start with ecosystem file
        npx pm2 start ecosystem.config.js --env production --update-env
        npx pm2 save
        
        Write-Status "✅ PM2 services started" "Success"
        
        Pop-Location
        
    } catch {
        Write-Status "PM2 not available, starting with Node.js directly..." "Warning"
        
        Push-Location "agents/github-pr-manager"
        
        # Start the application directly
        Start-Process -FilePath "node" -ArgumentList "dist/index.js" -NoNewWindow
        
        Write-Status "✅ Application started with Node.js" "Success"
        
        Pop-Location
    }
}

function Test-Integration {
    Write-Status "Testing integration..." "Info"
    
    Start-Sleep -Seconds 5
    
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 10
        
        Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
        Write-Host "  Status: $($health.status)" -ForegroundColor Green
        Write-Host "  Repository: $($health.repo)" -ForegroundColor Cyan
        Write-Host "  AI Enabled: $($health.ai_enabled)" -ForegroundColor $(if($health.ai_enabled -eq $true){'Green'}else{'Yellow'})
        Write-Host "  AI Service: $($health.ai_service)" -ForegroundColor Cyan
        Write-Host "  Mode: $($health.mode)" -ForegroundColor White
        
        Write-Status "✅ Integration test passed" "Success"
        return $true
        
    } catch {
        Write-Status "❌ Integration test failed: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Show-NextSteps {
    Write-Host "`n🎉 GitHub PR Manager with AI Integration is ready!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    
    Write-Host "`n📊 Service URLs:" -ForegroundColor Yellow
    Write-Host "  • GitHub Agent: http://localhost:3001/health" -ForegroundColor Cyan
    Write-Host "  • AI Service: http://localhost:8000" -ForegroundColor Cyan
    if ($Docker) {
        Write-Host "  • Grafana Dashboard: http://localhost:3000 (admin/admin)" -ForegroundColor Cyan
        Write-Host "  • Prometheus: http://localhost:9090" -ForegroundColor Cyan
    }
    
    Write-Host "`n🚀 Available Features:" -ForegroundColor Yellow
    Write-Host "  • Automatic PR analysis with AI" -ForegroundColor White
    Write-Host "  • Risk assessment and labeling" -ForegroundColor White
    Write-Host "  • Intelligent review comments" -ForegroundColor White
    Write-Host "  • Issue categorization" -ForegroundColor White
    Write-Host "  • Webhook integration ready" -ForegroundColor White
    
    Write-Host "`n📋 Management Commands:" -ForegroundColor Yellow
    Write-Host "  • View logs: npx pm2 logs github-pr-manager" -ForegroundColor Gray
    Write-Host "  • Restart: npx pm2 restart github-pr-manager" -ForegroundColor Gray
    Write-Host "  • Stop: npx pm2 stop github-pr-manager" -ForegroundColor Gray
    if ($Docker) {
        Write-Host "  • View Docker logs: docker compose -f agents/docker-compose-ai.yml logs -f" -ForegroundColor Gray
        Write-Host "  • Stop Docker: docker compose -f agents/docker-compose-ai.yml down" -ForegroundColor Gray
    }
    
    Write-Host "`n⚙️  Configuration:" -ForegroundColor Yellow
    Write-Host "  • Repository: $($env:GITHUB_REPOSITORY)" -ForegroundColor White
    Write-Host "  • AI Analysis: $($env:ENABLE_AI_ANALYSIS)" -ForegroundColor White
    Write-Host "  • Environment: $($env:NODE_ENV)" -ForegroundColor White
    
    if (-not $GitHubToken) {
        Write-Host "`n⚠️  Note: Set GITHUB_TOKEN for full functionality:" -ForegroundColor Yellow
        Write-Host "   `$env:GITHUB_TOKEN = 'your_token_here'" -ForegroundColor Gray
    }
}

# Main execution
try {
    Write-Host "🤖 GitHub PR Manager with AI Integration Setup" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Green
    
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    Set-Environment
    
    if (-not (Install-Dependencies)) {
        exit 1
    }
    
    if (-not (Build-Application)) {
        exit 1
    }
    
    if ($Docker) {
        if (-not (Start-DockerServices)) {
            exit 1
        }
    } else {
        Start-LocalServices
    }
    
    if (-not (Test-Integration)) {
        Write-Status "Service started but integration test failed. Check logs for details." "Warning"
    }
    
    Show-NextSteps
    
} catch {
    Write-Status "Setup failed: $($_.Exception.Message)" "Error"
    exit 1
}