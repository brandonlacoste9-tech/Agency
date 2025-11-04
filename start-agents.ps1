#!/usr/bin/env pwsh
# Quick Agent Startup Script
# Usage: .\start-agents.ps1

param(
    [switch]$SetupEnv,
    [switch]$TestMode
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param($Message, $Status = "Info")
    $color = switch ($Status) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        default { "Cyan" }
    }
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp][$Status] $Message" -ForegroundColor $color
}

function Set-AgentEnvironment {
    Write-Status "Setting up agent environment..." "Info"
    
    # Check if .env exists
    $envFile = "agents\.env"
    if (-not (Test-Path $envFile)) {
        Write-Status "Creating default .env file..." "Info"
        $envContent = @"
# GitHub Agent Configuration
GITHUB_REPOSITORY=brandonlacoste9-tech/adgenxai
GITHUB_TOKEN=placeholder_token
WEBHOOK_SECRET=test_secret_123
AI_API_KEY=placeholder_key
DB_PASSWORD=github_agent_pass
GRAFANA_PASSWORD=admin
PORT=3001
AGENTS_ENABLED=true
ENABLE_AI_ANALYSIS=false
PROMOTE_DRAFTS=false
"@
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Status "Created default .env file at $envFile" "Success"
    }
    
    # Set Node environment
    $env:NODE_ENV = "development"
    Write-Status "Environment setup complete" "Success"
}

function Test-AgentDependencies {
    Write-Status "Checking agent dependencies..." "Info"
    
    $agentDir = "agents\github-pr-manager"
    if (-not (Test-Path "$agentDir\node_modules")) {
        Write-Status "Installing agent dependencies..." "Warning"
        Push-Location $agentDir
        try {
            npm install
            Write-Status "Dependencies installed successfully" "Success"
        }
        catch {
            Write-Status "Failed to install dependencies: $($_.Exception.Message)" "Error"
            throw
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Status "Dependencies already installed" "Success"
    }
}

function Start-GitHubAgent {
    Write-Status "Starting GitHub PR Manager Agent..." "Info"
    
    Push-Location "agents\github-pr-manager"
    try {
        if ($TestMode) {
            # Simple test mode - just check if the main file can load
            Write-Status "Running in test mode..." "Info"
            node -e "console.log('Node.js can execute JavaScript'); process.exit(0);"
            Write-Status "Node.js test passed" "Success"
            
            # Test module loading
            Write-Status "Testing module imports..." "Info"
            $testScript = @"
import express from 'express';
console.log('Express imported successfully');
console.log('Test completed successfully');
process.exit(0);
"@
            $testScript | Out-File -FilePath "test-imports.mjs" -Encoding UTF8
            node test-imports.mjs
            Remove-Item "test-imports.mjs" -Force
            Write-Status "Module imports test passed" "Success"
        }
        else {
            # Full startup
            Write-Status "Starting full agent..." "Info"
            node src/index.js
        }
    }
    catch {
        Write-Status "Agent startup failed: $($_.Exception.Message)" "Error"
        throw
    }
    finally {
        Pop-Location
    }
}

# Main execution
try {
    Write-Status "GitHub Agent Startup Script" "Info"
    
    if ($SetupEnv) {
        Set-AgentEnvironment
    }
    
    Test-AgentDependencies
    Start-GitHubAgent
    
    if (-not $TestMode) {
        Write-Status "Agent startup completed" "Success"
    }
}
catch {
    Write-Status "Startup failed: $($_.Exception.Message)" "Error"
    exit 1
}
