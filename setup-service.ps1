# Windows Service Setup for GitHub Agent 24/7 Operation
# This script sets up the GitHub Agent to run as a Windows service

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status
)

$ServiceName = "GitHubAgentAdGenXAI"
$ServiceDisplayName = "GitHub Agent - AdGenXAI Repository Automation"
$ServiceDescription = "24/7 GitHub automation agent for AdGenXAI repository management"

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin -and ($Install -or $Uninstall -or $Start -or $Stop)) {
    Write-Host "❌ This operation requires administrator privileges" -ForegroundColor Red
    Write-Host "💡 Run PowerShell as Administrator and try again" -ForegroundColor Yellow
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkingDir = $ScriptDir
$NodePath = (Get-Command node).Source
$PM2Path = "$env:APPDATA\npm\pm2.cmd"

if ($Install) {
    Write-Host "🚀 Installing GitHub Agent as Windows Service..." -ForegroundColor Cyan
    
    # Check if service already exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "⚠️  Service already exists. Uninstalling first..." -ForegroundColor Yellow
        & $MyInvocation.MyCommand.Path -Uninstall
    }
    
    # Create service using sc.exe
    $binPath = "`"$NodePath`" `"$WorkingDir\scripts\service-wrapper.js`""
    
    # Create service wrapper script
    $serviceWrapper = @"
#!/usr/bin/env node

// Windows Service Wrapper for GitHub Agent
const { spawn } = require('child_process');
const path = require('path');

process.chdir('$WorkingDir');

console.log('🚀 Starting GitHub Agent Windows Service...');

// Start PM2 with ecosystem configuration
const pm2Process = spawn('$PM2Path', ['start', 'ecosystem.config.cjs'], {
    stdio: 'inherit',
    cwd: '$WorkingDir'
});

pm2Process.on('error', (error) => {
    console.error('❌ Service error:', error);
    process.exit(1);
});

pm2Process.on('close', (code) => {
    console.log('🛑 PM2 process exited with code:', code);
    process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Service shutting down...');
    spawn('$PM2Path', ['stop', 'github-pr-manager'], { stdio: 'inherit' });
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Service terminated...');
    spawn('$PM2Path', ['stop', 'github-pr-manager'], { stdio: 'inherit' });
    process.exit(0);
});
"@
    
    $serviceWrapper | Set-Content "$WorkingDir\scripts\service-wrapper.js"
    
    # Create the service
    sc.exe create $ServiceName binPath= $binPath DisplayName= $ServiceDisplayName start= auto
    sc.exe description $ServiceName $ServiceDescription
    
    Write-Host "✅ Service installed successfully!" -ForegroundColor Green
    Write-Host "🔄 Starting service..." -ForegroundColor Yellow
    
    Start-Service -Name $ServiceName
    
    Write-Host "✅ GitHub Agent is now running as a Windows service!" -ForegroundColor Green
    Write-Host "🎯 Service will start automatically when Windows boots" -ForegroundColor Blue
}

if ($Uninstall) {
    Write-Host "🗑️  Uninstalling GitHub Agent service..." -ForegroundColor Yellow
    
    # Stop service if running
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force
    }
    
    # Delete service
    sc.exe delete $ServiceName
    
    # Clean up wrapper script
    if (Test-Path "$WorkingDir\scripts\service-wrapper.js") {
        Remove-Item "$WorkingDir\scripts\service-wrapper.js" -Force
    }
    
    Write-Host "✅ Service uninstalled successfully!" -ForegroundColor Green
}

if ($Start) {
    Write-Host "▶️  Starting GitHub Agent service..." -ForegroundColor Green
    Start-Service -Name $ServiceName
    Write-Host "✅ Service started!" -ForegroundColor Green
}

if ($Stop) {
    Write-Host "⏹️  Stopping GitHub Agent service..." -ForegroundColor Red
    Stop-Service -Name $ServiceName -Force
    Write-Host "✅ Service stopped!" -ForegroundColor Green
}

if ($Status -or (-not $Install -and -not $Uninstall -and -not $Start -and -not $Stop)) {
    Write-Host "📊 GitHub Agent Service Status" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Cyan
    
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Service Name: $($service.Name)" -ForegroundColor White
        Write-Host "Display Name: $($service.DisplayName)" -ForegroundColor White
        Write-Host "Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Red' })
        Write-Host "Start Type: $($service.StartType)" -ForegroundColor White
        
        if ($service.Status -eq 'Running') {
            Write-Host "`n🌐 Testing endpoints..." -ForegroundColor Blue
            try {
                $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
                Write-Host "✅ Health: $($health.status)" -ForegroundColor Green
                Write-Host "⏱️  Uptime: $([math]::Round($health.uptime)) seconds" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Health check failed - service may be starting" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ Service not installed" -ForegroundColor Red
        Write-Host "💡 Run with -Install to install the service" -ForegroundColor Yellow
    }
    
    Write-Host "`n📋 Available commands:" -ForegroundColor Cyan
    Write-Host "   .\setup-service.ps1 -Install    # Install service" -ForegroundColor White
    Write-Host "   .\setup-service.ps1 -Start      # Start service" -ForegroundColor White
    Write-Host "   .\setup-service.ps1 -Stop       # Stop service" -ForegroundColor White
    Write-Host "   .\setup-service.ps1 -Uninstall  # Remove service" -ForegroundColor White
}