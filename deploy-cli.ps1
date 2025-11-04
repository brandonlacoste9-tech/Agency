#!/usr/bin/env pwsh
# Cross-Platform GitHub CLI Deployment Package
# Builds and deploys custom GitHub CLI to multiple platforms

param(
    [ValidateSet("windows", "linux-arm", "linux-x64", "darwin", "all")]
    [string]$Platform = "all",
    [string]$OutputDir = "deploy",
    [switch]$Deploy,
    [string]$RemoteHost = "",
    [switch]$Package
)

$ErrorActionPreference = "Stop"

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

function Build-GitHubCLI {
    param(
        [string]$GOOS,
        [string]$GOARCH,
        [string]$GOARM = "",
        [string]$OutputName
    )
    
    Write-Status "Building GitHub CLI for $GOOS/$GOARCH..." "Info"
    
    Push-Location "C:\Users\north\gh-cli"
    try {
        # Set environment variables
        $env:GOOS = $GOOS
        $env:GOARCH = $GOARCH
        if ($GOARM) { $env:GOARM = $GOARM }
        $env:CGO_ENABLED = "0"
        
        # Build
        $buildCmd = "go build -o bin/$OutputName ./cmd/gh"
        Write-Status "Executing: $buildCmd" "Info"
        
        $startTime = Get-Date
        Invoke-Expression $buildCmd
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if (Test-Path "bin/$OutputName") {
            $fileSize = (Get-Item "bin/$OutputName").Length
            Write-Status "✅ Build successful: $OutputName ($(([Math]::Round($fileSize/1MB, 2)))MB) in ${duration}s" "Success"
            return $true
        } else {
            Write-Status "❌ Build failed: Output file not found" "Error"
            return $false
        }
    } catch {
        Write-Status "❌ Build failed: $($_.Exception.Message)" "Error"
        return $false
    } finally {
        # Clean up environment
        Remove-Item Env:GOOS -ErrorAction SilentlyContinue
        Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
        Remove-Item Env:GOARM -ErrorAction SilentlyContinue
        Remove-Item Env:CGO_ENABLED -ErrorAction SilentlyContinue
        Pop-Location
    }
}

function Create-DeploymentPackage {
    param([string]$Platform, [string]$BinaryName)
    
    Write-Status "Creating deployment package for $Platform..." "Info"
    
    $packageDir = "$OutputDir/$Platform"
    New-Item -ItemType Directory -Path $packageDir -Force | Out-Null
    
    # Copy binary
    $sourceBinary = "C:\Users\north\gh-cli\bin\$BinaryName"
    $targetBinary = "$packageDir/gh$(if ($Platform -eq 'windows') { '.exe' } else { '' })"
    
    if (Test-Path $sourceBinary) {
        Copy-Item $sourceBinary $targetBinary -Force
        Write-Status "✅ Binary copied to $targetBinary" "Success"
    } else {
        Write-Status "❌ Source binary not found: $sourceBinary" "Error"
        return $false
    }
    
    # Create deployment script
    if ($Platform -eq "windows") {
        $deployScript = @"
@echo off
echo Installing GitHub CLI to %USERPROFILE%\bin\
if not exist "%USERPROFILE%\bin" mkdir "%USERPROFILE%\bin"
copy gh.exe "%USERPROFILE%\bin\gh-custom.exe"
echo.
echo GitHub CLI installed to %USERPROFILE%\bin\gh-custom.exe
echo Add %USERPROFILE%\bin to your PATH to use gh-custom command
pause
"@
        $deployScript | Out-File "$packageDir\install.bat" -Encoding ASCII
    } else {
        $deployScript = @"
#!/bin/bash
echo "Installing GitHub CLI to /usr/local/bin/"
sudo cp gh /usr/local/bin/gh-custom
sudo chmod +x /usr/local/bin/gh-custom
echo ""
echo "GitHub CLI installed to /usr/local/bin/gh-custom"
echo "You can now use 'gh-custom' command"
"@
        $deployScript | Out-File "$packageDir/install.sh" -Encoding UTF8
    }
    
    # Create README
    $readme = @"
# GitHub CLI Custom Build - $Platform

## Installation

### Windows
Run install.bat as administrator

### Linux/macOS
```bash
chmod +x install.sh
./install.sh
```

## Usage

The binary will be installed as 'gh-custom' to avoid conflicts with standard GitHub CLI.

### Basic Commands
```bash
gh-custom auth login
gh-custom pr list --repo owner/repo
gh-custom pr view 123
```

## Build Information
- Platform: $Platform
- Build Date: $(Get-Date)
- Source: https://github.com/cli/cli
- Custom Features: Enhanced performance, cross-compilation support

## Automation Integration

This custom build integrates with the AdGenXAI automation system:

```powershell
# Use in PowerShell automation
.\pr-automation-v2.ps1 -Action full-audit -UseCustomCLI
```

```bash
# Use in bash scripts
export GH_CUSTOM="/usr/local/bin/gh-custom"
`$GH_CUSTOM pr list --repo brandonlacoste9-tech/adgenxai
```
"@
    $readme | Out-File "$packageDir/README.md" -Encoding UTF8
    
    Write-Status "✅ Deployment package created in $packageDir" "Success"
    return $true
}

function Create-AutomationPackage {
    Write-Status "Creating automation integration package..." "Info"
    
    $automationDir = "$OutputDir/automation"
    New-Item -ItemType Directory -Path $automationDir -Force | Out-Null
    
    # Copy automation scripts
    $scripts = @(
        "pr-automation-enhanced.ps1",
        "pr-automation-v2.ps1",
        "start-agents.ps1"
    )
    
    foreach ($script in $scripts) {
        if (Test-Path $script) {
            Copy-Item $script "$automationDir/" -Force
            Write-Status "✅ Copied $script" "Success"
        }
    }
    
    # Copy agent integration module
    $agentFile = "agents\github-pr-manager\src\enhanced-cli-integration.js"
    if (Test-Path $agentFile) {
        Copy-Item $agentFile "$automationDir/" -Force
        Write-Status "✅ Copied CLI integration module" "Success"
    }
    
    # Create integration guide
    $integrationGuide = @"
# GitHub CLI Automation Integration Guide

## Quick Start

1. Install custom GitHub CLI for your platform
2. Configure authentication: ``gh-custom auth login``
3. Run automation scripts

## Available Scripts

### PowerShell (Windows)
- ``pr-automation-enhanced.ps1`` - Enhanced PR automation with custom CLI
- ``pr-automation-v2.ps1`` - Advanced automation with smart merge and health dashboard
- ``start-agents.ps1`` - Agent system startup with environment setup

### Usage Examples

```powershell
# Health check with custom CLI
.\pr-automation-v2.ps1 -Action health-dashboard

# Smart merge with priority scoring
.\pr-automation-v2.ps1 -Action smart-merge -DryRun

# Performance testing
.\pr-automation-v2.ps1 -Action performance-test

# Full repository audit
.\pr-automation-v2.ps1 -Action full-audit
```

## Node.js Integration

```javascript
import { EnhancedGitHubCLI } from './enhanced-cli-integration.js';

const cli = new EnhancedGitHubCLI({
    customCliPath: '/usr/local/bin/gh-custom'
});

await cli.initialize();
const prs = await cli.getAllPRs('owner/repo');
```

## Features

- ✅ Custom GitHub CLI builds for multiple platforms
- ✅ Performance monitoring and metrics
- ✅ Smart merge with priority scoring
- ✅ Health dashboard and auditing
- ✅ Cross-platform automation scripts
- ✅ Agent system integration
- ✅ Batch operations and error handling

## Configuration

Set environment variables:
- ``GITHUB_TOKEN`` - Your GitHub personal access token
- ``GITHUB_REPOSITORY`` - Default repository (owner/repo format)
- ``CUSTOM_GH_CLI`` - Path to custom CLI binary
"@
    $integrationGuide | Out-File "$automationDir/INTEGRATION_GUIDE.md" -Encoding UTF8
    
    Write-Status "✅ Automation package created in $automationDir" "Success"
}

# Main execution
try {
    Write-Status "🚀 GitHub CLI Cross-Platform Deployment" "Info"
    
    # Create output directory
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    
    $builds = @()
    
    if ($Platform -eq "all" -or $Platform -eq "windows") {
        if (Build-GitHubCLI -GOOS "windows" -GOARCH "amd64" -OutputName "gh-windows-amd64.exe") {
            $builds += @{ Platform = "windows"; Binary = "gh-windows-amd64.exe" }
        }
    }
    
    if ($Platform -eq "all" -or $Platform -eq "linux-arm") {
        if (Build-GitHubCLI -GOOS "linux" -GOARCH "arm" -GOARM "7" -OutputName "gh-linux-arm7") {
            $builds += @{ Platform = "linux-arm"; Binary = "gh-linux-arm7" }
        }
    }
    
    if ($Platform -eq "all" -or $Platform -eq "linux-x64") {
        if (Build-GitHubCLI -GOOS "linux" -GOARCH "amd64" -OutputName "gh-linux-amd64") {
            $builds += @{ Platform = "linux-x64"; Binary = "gh-linux-amd64" }
        }
    }
    
    if ($Platform -eq "all" -or $Platform -eq "darwin") {
        if (Build-GitHubCLI -GOOS "darwin" -GOARCH "amd64" -OutputName "gh-darwin-amd64") {
            $builds += @{ Platform = "darwin"; Binary = "gh-darwin-amd64" }
        }
    }
    
    if ($Package) {
        Write-Status "`n📦 Creating deployment packages..." "Info"
        foreach ($build in $builds) {
            Create-DeploymentPackage -Platform $build.Platform -BinaryName $build.Binary
        }
        
        Create-AutomationPackage
    }
    
    # Summary
    Write-Status "`n📊 Build Summary:" "Success"
    Write-Host "Total Builds: $($builds.Count)" -ForegroundColor Green
    foreach ($build in $builds) {
        Write-Host "  ✅ $($build.Platform): $($build.Binary)" -ForegroundColor Green
    }
    
    if ($Package) {
        Write-Host "`nPackages created in: $OutputDir" -ForegroundColor Cyan
        Write-Host "  📁 Platform-specific packages with installers" -ForegroundColor Gray
        Write-Host "  📁 Automation integration scripts" -ForegroundColor Gray
        Write-Host "  📁 Documentation and usage guides" -ForegroundColor Gray
    }
    
    Write-Status "🎉 Cross-platform deployment completed!" "Success"
} catch {
    Write-Status "💥 Deployment failed: $($_.Exception.Message)" "Error"
    exit 1
}
