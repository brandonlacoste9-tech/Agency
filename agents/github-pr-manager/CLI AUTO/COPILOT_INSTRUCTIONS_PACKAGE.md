# Complete Copilot Instructions Package - Session Archive

## What We Built

This session created a complete surgical AI guidance system for the AdgenXAI stack with automated deployment across 6 repositories.

## 1. Main Copilot Instructions (.github/copilot-instructions.md)

```markdown
# Copilot Instructions

## Repo Context
This repo: **GitHub PR Manager**  
Role in stack: AI-powered GitHub automation for PR analysis and workflow management  
Primary runtime: Node 20 / ES6 modules + CommonJS agents  
Deployment: PM2 cluster / Docker with monitoring

## Architecture Hints
- **Module system**: Mixed: src/*.js uses ES6 imports, root *.js uses CommonJS
- **Key folders**: src/ (main service), agents/ (specialized workers), monitoring/ (ops)
- **Integration points**: GitHub webhooks → AI service (SmolLM2) → agent delegation → GitHub updates
- **Circuit breakers required**: All external calls (GitHub API, AI service) must use resilience patterns

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Extend existing agents before creating new ones
- All network calls must include circuit breakers, retries, and fallback logic
- Test both AI-enabled and fallback modes before PR submission

## Example
When adding PR comment features, extend src/ai-service.js → analyzePR() method rather than creating a separate comment handler.
```

## 2. Deployment Script (deploy-copilot-instructions.ps1)

```powershell
# Cross-Repo Copilot Instructions Deployment Script
param(
    [string]$TargetRepo = (Get-Location).Path
)

Write-Host "🚀 Deploying Copilot Instructions..." -ForegroundColor Green

# Create .github directory if it doesn't exist
$githubDir = Join-Path $TargetRepo ".github"
if (-not (Test-Path $githubDir)) {
    New-Item -ItemType Directory -Path $githubDir -Force | Out-Null
    Write-Host "✓ Created .github directory" -ForegroundColor Green
}

# Detect repository type from folder name or package.json
$repoName = Split-Path $TargetRepo -Leaf
$packageJsonPath = Join-Path $TargetRepo "package.json"

$repoType = "unknown"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    $name = $packageJson.name
    
    if ($name -match "beehive") { $repoType = "beehive" }
    elseif ($name -match "adgenai.*core" -or $repoName -match "core") { $repoType = "core" }
    elseif ($name -match "website" -or $repoName -match "adgenai\.ca") { $repoType = "website" }
    elseif ($name -match "2\.0" -or $repoName -match "2\.0") { $repoType = "v2" }
    elseif ($name -match "dashboard" -or $repoName -match "nv.*dashboard") { $repoType = "dashboard" }
    elseif ($name -match "github.*pr" -or $repoName -match "github.*pr") { $repoType = "github-pr" }
}

# Content templates for each repo type
$templates = @{
    "beehive" = @"
# Copilot Instructions

## Repo Context
This repo: **Beehive**  
Role in stack: Central orchestration hub for AI agent coordination  
Primary runtime: Node 20 / TypeScript  
Deployment: Docker with Kubernetes

## Architecture Hints
- **Module system**: ES6 modules with TypeScript
- **Key folders**: src/ (core services), agents/ (workers), k8s/ (deployment)
- **Integration points**: Agent APIs, message queues, service discovery
- **Service mesh communication**: Required for all inter-service calls

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- New services go in src/services/ with full TypeScript
- Agent communication uses message bus (not direct HTTP)
- All services must register with discovery service

## Example
When adding a new service, extend src/services/ with proper interfaces rather than creating standalone microservices without discovery.
"@

    "core" = @"
# Copilot Instructions

## Repo Context
This repo: **AdgenAI Core**  
Role in stack: Core AI processing engine for content generation and analysis  
Primary runtime: Python 3.11 / FastAPI  
Deployment: Docker with GPU support

## Architecture Hints
- **Module system**: Python modules with async/await patterns
- **Key folders**: src/ (core AI), models/ (ML models), api/ (FastAPI routes)
- **Integration points**: OpenAI API, local models, vector databases, caching layer
- **Async processing with task queues**: Required for all AI operations

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use dependency injection for model loading
- All AI calls must have timeout and retry logic
- Model responses must be validated before returning

## Example
When adding a new AI model, extend src/models/ with proper interface rather than hardcoding model calls in route handlers.
"@

    "website" = @"
# Copilot Instructions

## Repo Context
This repo: **Adgenai.ca Website**  
Role in stack: Public-facing marketing website and user portal  
Primary runtime: Next.js 14 / TypeScript  
Deployment: Netlify with edge functions

## Architecture Hints
- **Module system**: ES6 modules with Next.js App Router
- **Key folders**: app/ (routes), components/ (UI), lib/ (utilities)
- **Integration points**: AdgenAI API, authentication, payment processing, analytics
- **Server components with client interactivity boundaries**: Use server-first approach

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use server components by default, client only when needed
- API routes in app/api/ with proper error handling
- All external API calls must use the centralized client

## Example
When adding a new page, create app/[route]/page.tsx with proper metadata rather than mixing server and client logic in components.
"@

    "v2" = @"
# Copilot Instructions

## Repo Context
This repo: **AdgenXAI 2.0**  
Role in stack: Next-generation AI platform with enhanced capabilities  
Primary runtime: Node 20 / TypeScript  
Deployment: Docker with microservices

## Architecture Hints
- **Module system**: ES6 modules with strict TypeScript
- **Key folders**: packages/ (monorepo), services/ (microservices), shared/ (common)
- **Integration points**: GraphQL federation, event sourcing, distributed caching
- **Microservices with event-driven architecture**: Required for all state changes

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Follow monorepo structure with proper package boundaries
- Use GraphQL for inter-service communication
- All state changes must emit events

## Example
When adding a new microservice, create packages/service-name with shared types rather than direct database access from other services.
"@

    "dashboard" = @"
# Copilot Instructions

## Repo Context
This repo: **NV Dashboard**  
Role in stack: Administrative dashboard for system monitoring and control  
Primary runtime: React 18 / TypeScript  
Deployment: Netlify with backend APIs

## Architecture Hints
- **Module system**: ES6 modules with Vite bundling
- **Key folders**: src/ (React app), components/ (UI), hooks/ (logic), api/ (backend calls)
- **Integration points**: Multiple backend APIs, real-time websockets, authentication
- **React Query for state management and caching**: Required for all server state

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use React Query for all server state
- Custom hooks for business logic
- Components should be purely presentational

## Example
When adding a new dashboard widget, create components/widgets/ with proper data hooks rather than fetching data directly in components.
"@

    "github-pr" = @"
# Copilot Instructions

## Repo Context
This repo: **GitHub PR Manager**  
Role in stack: AI-powered GitHub automation for PR analysis and workflow management  
Primary runtime: Node 20 / ES6 modules + CommonJS agents  
Deployment: PM2 cluster / Docker with monitoring

## Architecture Hints
- **Module system**: Mixed: src/*.js uses ES6 imports, root *.js uses CommonJS
- **Key folders**: src/ (main service), agents/ (specialized workers), monitoring/ (ops)
- **Integration points**: GitHub webhooks → AI service (SmolLM2) → agent delegation → GitHub updates
- **Circuit breakers required**: All external calls (GitHub API, AI service) must use resilience patterns

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Extend existing agents before creating new ones
- All network calls must include circuit breakers, retries, and fallback logic
- Test both AI-enabled and fallback modes before PR submission

## Example
When adding PR comment features, extend src/ai-service.js → analyzePR() method rather than creating a separate comment handler.
"@
}

# Select appropriate template
$content = $templates[$repoType]
if (-not $content) {
    Write-Host "⚠️  Unknown repo type: $repoType, using generic template" -ForegroundColor Yellow
    $content = $templates["github-pr"]  # Default fallback
}

# Write the file
$outputPath = Join-Path $githubDir "copilot-instructions.md"
$content | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "✓ Deployed copilot instructions for repo type: $repoType" -ForegroundColor Green
Write-Host "✓ File created: .github/copilot-instructions.md" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the generated file" -ForegroundColor White
Write-Host "2. Commit: git add .github/copilot-instructions.md" -ForegroundColor White
Write-Host "3. Commit: git commit -m `"ci: add copilot instructions for AI guidance`"" -ForegroundColor White
Write-Host "4. Push: git push origin main" -ForegroundColor White
```

## 3. Complete Deployment Kit (DEPLOYMENT_KIT.md)

```markdown
# Cross-Repo Copilot Instructions Deployment Kit

This package contains everything needed to deploy surgical Copilot instructions across the AdgenXAI stack.

## Quick Deploy

1. Copy this entire folder to the target repo root
2. Run: `.\deploy-copilot-instructions.ps1`
3. Commit with: `git commit -m "ci: add copilot instructions for AI guidance"`

## Files Included

- `copilot-instructions-template.md` - Base template with placeholders
- `deploy-copilot-instructions.ps1` - Automated deployment script
- Pre-configured contexts for all 6 repos in the stack

## Manual Deployment (Alternative)

If you prefer manual deployment, copy the appropriate content below for each repo:

### Beehive
[Content as shown in deployment script above]

### AdgenAI Core  
[Content as shown in deployment script above]

### Adgenai.ca Website
[Content as shown in deployment script above]

### AdgenXAI 2.0
[Content as shown in deployment script above]

### NV Dashboard
[Content as shown in deployment script above]

## Deployment Order

Follow the specified rollout sequence:
1. ✅ **GitHub PR Manager** (completed)
2. **Beehive** 
3. **AdgenAI Core**
4. **Adgenai.ca Website**
5. **AdgenXAI 2.0**
6. **NV Dashboard**

This ensures dependencies and integration points are properly established.
```

## 4. Architecture Documentation (docs/architecture.md)

```markdown
# GitHub PR Manager Architecture

## System Overview

The GitHub PR Manager is an AI-powered automation system that analyzes pull requests and manages GitHub workflows through intelligent agent delegation.

## Core Components

### AI Service Layer (`src/ai-service.js`)
- SmolLM2 integration for PR analysis
- Circuit breaker patterns for reliability
- Fallback logic for service degradation

### Agent System (`agents/`)
- Specialized workers for different PR operations
- Event-driven communication
- Autonomous task execution

### Monitoring (`monitoring/`)
- Health checks and metrics collection
- Performance monitoring
- Alert management

## Deployment Architecture

### Production Environment
- **Runtime**: Node 20 with PM2 cluster mode
- **Containerization**: Docker with health checks
- **Monitoring**: Prometheus + Grafana
- **Circuit Breakers**: All external API calls

### Integration Points
```
GitHub Webhooks → AI Service (SmolLM2) → Agent Delegation → GitHub Updates
```

## Resilience Patterns

### Circuit Breakers
All external calls (GitHub API, AI service) must implement:
- Failure threshold detection
- Automatic fallback activation
- Recovery state management

### Retry Logic
- Exponential backoff for transient failures
- Maximum retry limits
- Dead letter queues for persistent failures

## Development Guidelines

### Module System
- `src/*.js`: ES6 modules with imports
- `root *.js`: CommonJS with require()
- Mixed system requires careful boundary management

### Commit Style
- `feat:` - New features
- `fix:` - Bug fixes  
- `ci:` - CI/CD changes
- `docs:` - Documentation updates

### Testing Requirements
- Test both AI-enabled and fallback modes
- Integration tests for all external APIs
- Load testing for circuit breaker thresholds
```

## 5. Session Summary

### What Was Accomplished
1. ✅ **Created surgical copilot instructions** - Focused, actionable AI guidance
2. ✅ **Built automated deployment system** - PowerShell script with repo detection
3. ✅ **Deployed to GitHub** - Live at `.github/copilot-instructions.md`
4. ✅ **Created cross-repo templates** - Ready for all 6 AdgenXAI repositories
5. ✅ **Validated deployment** - Confirmed working status

### Key Design Principles
- **Surgical over comprehensive** - Essential knowledge only
- **Actionable guidance** - Specific rules, not general advice  
- **Template-driven** - Consistent format across all repos
- **Automated deployment** - Minimal manual intervention

### Deployment Status
- ✅ **GitHub PR Manager** - Deployed and validated
- 🟡 **Remaining 5 repos** - Templates ready, manual deployment needed

### Files Created This Session
1. `.github/copilot-instructions.md` - Main instructions file
2. `deploy-copilot-instructions.ps1` - Deployment automation
3. `DEPLOYMENT_KIT.md` - Cross-repo templates
4. `docs/architecture.md` - Comprehensive documentation
5. `COPILOT_INSTRUCTIONS_PACKAGE.md` - This archive

## Usage Instructions

### To Deploy to New Repo:
1. Copy `deploy-copilot-instructions.ps1` to target repo
2. Run the script: `.\deploy-copilot-instructions.ps1`
3. Review generated `.github/copilot-instructions.md`
4. Commit and push to GitHub

### To Customize:
1. Edit the templates in `DEPLOYMENT_KIT.md`
2. Update the PowerShell script detection logic
3. Test with `.\deploy-copilot-instructions.ps1`

## Validation Checklist

✅ File exists at `.github/copilot-instructions.md`
✅ Contains 3 sections: Repo Context, Architecture Hints, AI Agent Rules
✅ Committed to git with proper message
✅ Pushed to GitHub successfully
✅ Accessible to GitHub Copilot system

**Status: DEPLOYMENT SUCCESSFUL** 🎉