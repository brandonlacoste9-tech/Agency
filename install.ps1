#!/usr/bin/env pwsh
<#
.SYNOPSIS
    AdGenXAI Installation Script
.DESCRIPTION
    Automated installation and setup for AdGenXAI - AI-powered advertising solution
.PARAMETER SkipPrerequisites
    Skip prerequisite checks (not recommended)
.PARAMETER ClonePath
    Custom path for cloning the repository (default: current directory)
.PARAMETER AutoSetup
    Automatically configure with default values
.EXAMPLE
    irm https://claude.ai/install.ps1 | iex
.EXAMPLE
    .\install.ps1 -AutoSetup
.LINK
    https://github.com/brandonlacoste9-tech/adgenxai
#>

param(
    [switch]$SkipPrerequisites,
    [string]$ClonePath = ".",
    [switch]$AutoSetup
)

# Script configuration
$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/brandonlacoste9-tech/adgenxai.git"
$RequiredNodeVersion = 18
$ScriptVersion = "1.0.0"

# Color output helpers
function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Error-Custom($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Banner {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                                                            ║" -ForegroundColor Magenta
    Write-Host "║                    AdGenXAI Installer                      ║" -ForegroundColor Magenta
    Write-Host "║         AI-Powered Advertising Solution v$ScriptVersion          ║" -ForegroundColor Magenta
    Write-Host "║                                                            ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
}

function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Test-NodeVersion {
    try {
        $nodeVersionOutput = node --version 2>&1
        if ($nodeVersionOutput -match 'v(\d+)\.') {
            $majorVersion = [int]$matches[1]
            return $majorVersion -ge $RequiredNodeVersion
        }
    } catch {
        return $false
    }
    return $false
}

function Install-Prerequisites {
    Write-Info "Checking prerequisites..."

    $missing = @()

    # Check Node.js
    if (-not (Test-Command "node")) {
        $missing += "Node.js $RequiredNodeVersion+"
        Write-Warning-Custom "Node.js not found"
    } elseif (-not (Test-NodeVersion)) {
        $currentVersion = node --version
        Write-Warning-Custom "Node.js version $currentVersion found, but v$RequiredNodeVersion+ is required"
        $missing += "Node.js $RequiredNodeVersion+ (upgrade needed)"
    } else {
        $nodeVersion = node --version
        Write-Success "Node.js $nodeVersion detected"
    }

    # Check npm
    if (-not (Test-Command "npm")) {
        $missing += "npm"
        Write-Warning-Custom "npm not found"
    } else {
        $npmVersion = npm --version
        Write-Success "npm v$npmVersion detected"
    }

    # Check git
    if (-not (Test-Command "git")) {
        $missing += "git"
        Write-Warning-Custom "git not found (required for cloning repository)"
    } else {
        $gitVersion = git --version
        Write-Success "git detected: $gitVersion"
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Error-Custom "Missing prerequisites:"
        foreach ($item in $missing) {
            Write-Host "  • $item" -ForegroundColor Red
        }
        Write-Host ""
        Write-Info "Please install missing prerequisites:"
        Write-Host "  • Node.js: https://nodejs.org/ (v$RequiredNodeVersion LTS or later)" -ForegroundColor White
        Write-Host "  • npm: Included with Node.js" -ForegroundColor White
        Write-Host "  • git: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host ""
        Write-Info "Alternative: Use winget (Windows Package Manager):"
        Write-Host "  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
        Write-Host "  winget install Git.Git" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }

    Write-Success "All prerequisites met!"
    Write-Host ""
}

function Get-ProjectDirectory {
    $isInRepo = $false

    # Check if we're already in the adgenxai directory
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($packageJson.name -eq "adgenxai") {
            $isInRepo = $true
            Write-Success "Already in AdGenXAI directory"
            return (Get-Location).Path
        }
    }

    # Check if adgenxai directory exists in current location
    if (Test-Path "adgenxai") {
        Write-Info "Found existing 'adgenxai' directory"
        $useExisting = Read-Host "Use existing directory? (Y/n)"
        if ($useExisting -eq "" -or $useExisting -eq "Y" -or $useExisting -eq "y") {
            Set-Location "adgenxai"
            return (Get-Location).Path
        }
    }

    # Clone the repository
    Write-Info "Cloning AdGenXAI repository..."
    try {
        git clone $RepoUrl
        if ($LASTEXITCODE -ne 0) {
            throw "Git clone failed with exit code $LASTEXITCODE"
        }
        Set-Location "adgenxai"
        Write-Success "Repository cloned successfully"
        return (Get-Location).Path
    } catch {
        Write-Error-Custom "Failed to clone repository: $_"
        Write-Info "You can manually clone from: $RepoUrl"
        exit 1
    }
}

function Install-Dependencies {
    Write-Info "Installing npm dependencies..."
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    Write-Host ""

    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
        Write-Host ""
        Write-Success "Dependencies installed successfully"
    } catch {
        Write-Error-Custom "Failed to install dependencies: $_"
        Write-Info "Try running 'npm install' manually"
        exit 1
    }
}

function Setup-Environment {
    Write-Host ""
    Write-Info "Setting up environment configuration..."

    if (Test-Path ".env.local") {
        Write-Warning-Custom ".env.local already exists"
        $overwrite = Read-Host "Overwrite existing configuration? (y/N)"
        if ($overwrite -ne "Y" -and $overwrite -ne "y") {
            Write-Info "Keeping existing .env.local"
            return
        }
    }

    if (-not (Test-Path ".env.example")) {
        Write-Warning-Custom ".env.example not found, creating basic configuration"
        $envContent = @"
# AdGenXAI Environment Configuration
# Required API Keys and Configuration

# OpenAI API Key (required for AI features)
OPENAI_API_KEY=

# Supabase Configuration (required for database)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Provider (openai or github)
AI_PROVIDER=openai

# GitHub Token (optional, for GitHub Models fallback)
GITHUB_TOKEN=

# Webhook Configuration (optional)
GITHUB_WEBHOOK_SECRET=
GITHUB_PAT=

# Netlify Configuration (optional, for deployment)
NETLIFY_AUTH_TOKEN=
NETLIFY_SITE_ID=

# Environment
NODE_ENV=development
ENABLE_WEBHOOK_PROCESSING=false
"@
        Set-Content -Path ".env.local" -Value $envContent
    } else {
        Copy-Item ".env.example" ".env.local"
    }

    Write-Success "Created .env.local from template"
    Write-Host ""

    if ($AutoSetup) {
        Write-Info "Auto-setup mode: Using default values"
        return
    }

    Write-Info "Configure your environment variables:"
    Write-Host ""
    Write-Host "Required configuration:" -ForegroundColor Yellow
    Write-Host "  1. OPENAI_API_KEY - Get from https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "  2. SUPABASE_URL - Get from https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "  3. SUPABASE_ANON_KEY - From your Supabase project settings" -ForegroundColor White
    Write-Host "  4. SUPABASE_SERVICE_ROLE_KEY - From your Supabase project settings" -ForegroundColor White
    Write-Host ""

    $configureNow = Read-Host "Configure API keys now? (y/N)"

    if ($configureNow -eq "Y" -or $configureNow -eq "y") {
        $envContent = Get-Content ".env.local" -Raw

        Write-Host ""
        Write-Host "Enter your configuration values (press Enter to skip):" -ForegroundColor Cyan

        $openaiKey = Read-Host "OpenAI API Key"
        if ($openaiKey) {
            $envContent = $envContent -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$openaiKey"
        }

        $supabaseUrl = Read-Host "Supabase URL"
        if ($supabaseUrl) {
            $envContent = $envContent -replace 'SUPABASE_URL=.*', "SUPABASE_URL=$supabaseUrl"
        }

        $supabaseAnonKey = Read-Host "Supabase Anon Key"
        if ($supabaseAnonKey) {
            $envContent = $envContent -replace 'SUPABASE_ANON_KEY=.*', "SUPABASE_ANON_KEY=$supabaseAnonKey"
        }

        $supabaseServiceKey = Read-Host "Supabase Service Role Key"
        if ($supabaseServiceKey) {
            $envContent = $envContent -replace 'SUPABASE_SERVICE_ROLE_KEY=.*', "SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey"
        }

        Set-Content -Path ".env.local" -Value $envContent
        Write-Success "Configuration saved to .env.local"
    } else {
        Write-Info "You can edit .env.local manually later"
    }
}

function Show-NextSteps {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "║              Installation Complete! 🎉                     ║" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Configure your environment variables:" -ForegroundColor White
    Write-Host "     code .env.local  (or use your preferred editor)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. Start the development server:" -ForegroundColor White
    Write-Host "     npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  3. Open your browser to:" -ForegroundColor White
    Write-Host "     http://localhost:3000/dashboard" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available Commands:" -ForegroundColor Cyan
    Write-Host "  npm run dev        - Start development server" -ForegroundColor White
    Write-Host "  npm run build      - Build for production" -ForegroundColor White
    Write-Host "  npm run start      - Start production server" -ForegroundColor White
    Write-Host "  npm test           - Run tests" -ForegroundColor White
    Write-Host "  npm run typecheck  - Check TypeScript types" -ForegroundColor White
    Write-Host "  npm run deploy     - Deploy to Netlify" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "  Quick Start: docs/INTEGRATION_QUICKSTART.md" -ForegroundColor White
    Write-Host "  Setup Guide: PHASE2_SETUP_GUIDE.md" -ForegroundColor White
    Write-Host "  Dashboard:   docs/CREATOR_DASHBOARD.md" -ForegroundColor White
    Write-Host "  Repository:  https://github.com/brandonlacoste9-tech/adgenxai" -ForegroundColor White
    Write-Host ""
    Write-Success "Happy coding with AdGenXAI!"
    Write-Host ""
}

# Main installation flow
try {
    Write-Banner

    if (-not $SkipPrerequisites) {
        Install-Prerequisites
    }

    $projectDir = Get-ProjectDirectory
    Write-Host ""

    Install-Dependencies

    Setup-Environment

    Show-NextSteps

} catch {
    Write-Host ""
    Write-Error-Custom "Installation failed: $_"
    Write-Host ""
    Write-Info "For help, visit: https://github.com/brandonlacoste9-tech/adgenxai/issues"
    exit 1
}
