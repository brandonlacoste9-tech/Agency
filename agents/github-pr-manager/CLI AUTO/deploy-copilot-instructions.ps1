# Deploy Copilot Instructions Across Repos
#
# Usage: .\deploy-copilot-instructions.ps1
# Applies the template to each repo with appropriate context

param(
    [switch]$DryRun = $false
)

# Repo configurations for the AdgenXAI stack
$repos = @(
    @{
        name = "Beehive"
        path = "..\..\Beehive"
        description = "Central orchestration hub for AI agent coordination"
        runtime = "Node 20 / TypeScript"
        deployment = "Docker with Kubernetes"
        moduleSystem = "ES6 modules with TypeScript"
        keyFolders = "src/ (core services), agents/ (workers), k8s/ (deployment)"
        integrationPoints = "Agent APIs, message queues, service discovery"
        specificPatterns = "Service mesh communication"
        specificRules = "- New services go in src/services/ with full TypeScript\n- Agent communication uses message bus (not direct HTTP)\n- All services must register with discovery service"
        commonTask = "adding a new service"
        preferredApproach = "extend src/services/ with proper interfaces"
        antiPattern = "creating standalone microservices without discovery"
    },
    @{
        name = "GitHub PR Manager"
        path = "."
        description = "AI-powered GitHub automation for PR analysis and workflow management"
        runtime = "Node 20 / ES6 modules + CommonJS agents"
        deployment = "PM2 cluster / Docker with monitoring"
        moduleSystem = "Mixed: src/*.js uses ES6 imports, root *.js uses CommonJS"
        keyFolders = "src/ (main service), agents/ (specialized workers), monitoring/ (ops)"
        integrationPoints = "GitHub webhooks → AI service (SmolLM2) → agent delegation → GitHub updates"
        specificPatterns = "Circuit breakers required for all external calls"
        specificRules = "- Extend existing agents before creating new ones\n- All network calls must include circuit breakers, retries, and fallback logic\n- Test both AI-enabled and fallback modes before PR submission"
        commonTask = "adding PR comment features"
        preferredApproach = "extend src/ai-service.js → analyzePR() method"
        antiPattern = "creating a separate comment handler"
    },
    @{
        name = "AdgenAI Core"
        path = "..\..\..\adgenai"
        description = "Core AI processing engine for content generation and analysis"
        runtime = "Python 3.11 / FastAPI"
        deployment = "Docker with GPU support"
        moduleSystem = "Python modules with async/await patterns"
        keyFolders = "src/ (core AI), models/ (ML models), api/ (FastAPI routes)"
        integrationPoints = "OpenAI API, local models, vector databases, caching layer"
        specificPatterns = "Async processing with task queues"
        specificRules = "- Use dependency injection for model loading\n- All AI calls must have timeout and retry logic\n- Model responses must be validated before returning"
        commonTask = "adding a new AI model"
        preferredApproach = "extend src/models/ with proper interface"
        antiPattern = "hardcoding model calls in route handlers"
    },
    @{
        name = "Adgenai.ca Website"
        path = "..\..\..\Adgenai.ca"
        description = "Public-facing marketing website and user portal"
        runtime = "Next.js 14 / TypeScript"
        deployment = "Netlify with edge functions"
        moduleSystem = "ES6 modules with Next.js App Router"
        keyFolders = "app/ (routes), components/ (UI), lib/ (utilities)"
        integrationPoints = "AdgenAI API, authentication, payment processing, analytics"
        specificPatterns = "Server components with client interactivity boundaries"
        specificRules = "- Use server components by default, client only when needed\n- API routes in app/api/ with proper error handling\n- All external API calls must use the centralized client"
        commonTask = "adding a new page"
        preferredApproach = "create app/[route]/page.tsx with proper metadata"
        antiPattern = "mixing server and client logic in components"
    },
    @{
        name = "AdgenXAI 2.0"
        path = "..\..\..\adgenxai-2.0"
        description = "Next-generation AI platform with enhanced capabilities"
        runtime = "Node 20 / TypeScript"
        deployment = "Docker with microservices"
        moduleSystem = "ES6 modules with strict TypeScript"
        keyFolders = "packages/ (monorepo), services/ (microservices), shared/ (common)"
        integrationPoints = "GraphQL federation, event sourcing, distributed caching"
        specificPatterns = "Microservices with event-driven architecture"
        specificRules = "- Follow monorepo structure with proper package boundaries\n- Use GraphQL for inter-service communication\n- All state changes must emit events"
        commonTask = "adding a new microservice"
        preferredApproach = "create packages/service-name with shared types"
        antiPattern = "direct database access from other services"
    },
    @{
        name = "NV Dashboard"
        path = "..\..\..\nv-dashboard"
        description = "Administrative dashboard for system monitoring and control"
        runtime = "React 18 / TypeScript"
        deployment = "Netlify with backend APIs"
        moduleSystem = "ES6 modules with Vite bundling"
        keyFolders = "src/ (React app), components/ (UI), hooks/ (logic), api/ (backend calls)"
        integrationPoints = "Multiple backend APIs, real-time websockets, authentication"
        specificPatterns = "React Query for state management and caching"
        specificRules = "- Use React Query for all server state\n- Custom hooks for business logic\n- Components should be purely presentational"
        commonTask = "adding a new dashboard widget"
        preferredApproach = "create components/widgets/ with proper data hooks"
        antiPattern = "fetching data directly in components"
    }
)

function Deploy-CopilotInstructions {
    param($repo, [bool]$dryRun)
    
    Write-Host "🔄 Processing: $($repo.name)" -ForegroundColor Cyan
    
    if (-not (Test-Path $repo.path)) {
        Write-Host "⚠️  Path not found: $($repo.path)" -ForegroundColor Yellow
        return
    }
    
    $githubDir = Join-Path $repo.path ".github"
    $targetFile = Join-Path $githubDir "copilot-instructions.md"
    
    # Create .github directory if it doesn't exist
    if (-not (Test-Path $githubDir) -and -not $dryRun) {
        New-Item -ItemType Directory -Path $githubDir -Force | Out-Null
    }
    
    # Generate content from template
    $template = Get-Content ".\.github\copilot-instructions-template.md" -Raw
    $content = $template -replace '\{\{repo_name\}\}', $repo.name
    $content = $content -replace '\{\{one-line description\}\}', $repo.description
    $content = $content -replace 'Node 20 / TypeScript', $repo.runtime
    $content = $content -replace '\{\{Netlify \| Docker \| PM2\}\}', $repo.deployment
    $content = $content -replace '\{\{ES6 modules \| CommonJS \| Mixed\}\}', $repo.moduleSystem
    $content = $content -replace '\{\{list main directories\}\}', $repo.keyFolders
    $content = $content -replace '\{\{external APIs, services, databases\}\}', $repo.integrationPoints
    $content = $content -replace '\{\{Framework-specific patterns\}\}', $repo.specificPatterns
    $content = $content -replace '\{\{Repo-specific rules\}\}', $repo.specificRules
    $content = $content -replace '\{\{common task\}\}', $repo.commonTask
    $content = $content -replace '\{\{preferred approach\}\}', $repo.preferredApproach
    $content = $content -replace '\{\{anti-pattern\}\}', $repo.antiPattern
    
    if ($dryRun) {
        Write-Host "📄 Would create: $targetFile" -ForegroundColor Gray
        Write-Host "Content preview:" -ForegroundColor Gray
        Write-Host ($content.Split("`n")[0..10] -join "`n") -ForegroundColor DarkGray
        Write-Host "..." -ForegroundColor DarkGray
    } else {
        Set-Content -Path $targetFile -Value $content -Encoding UTF8
        Write-Host "✅ Created: $targetFile" -ForegroundColor Green
        
        # Add link to README if it exists and doesn't already have it
        $readmePath = Join-Path $repo.path "README.md"
        if (Test-Path $readmePath) {
            $readmeContent = Get-Content $readmePath -Raw
            if ($readmeContent -notmatch "copilot-instructions\.md") {
                # Find the first paragraph break and insert the link
                $lines = $readmeContent.Split("`n")
                $insertIndex = 1
                for ($i = 1; $i -lt $lines.Length; $i++) {
                    if ($lines[$i] -eq "") {
                        $insertIndex = $i
                        break
                    }
                }
                
                $newLines = $lines[0..($insertIndex-1)] + 
                           "" + 
                           "> 🤖 See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI guidelines." + 
                           $lines[$insertIndex..($lines.Length-1)]
                
                Set-Content -Path $readmePath -Value ($newLines -join "`n") -Encoding UTF8
                Write-Host "📝 Updated README.md with link" -ForegroundColor Blue
            }
        }
    }
}

# Main execution
if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
}

Write-Host "🚀 Deploying Copilot Instructions across AdgenXAI stack..." -ForegroundColor Magenta

foreach ($repo in $repos) {
    Deploy-CopilotInstructions -repo $repo -dryRun $DryRun
    Write-Host ""
}

if ($DryRun) {
    Write-Host "✨ Dry run complete. Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host "✨ Deployment complete! All repos now have surgical Copilot instructions." -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review generated files in each repo" -ForegroundColor White
    Write-Host "  2. Customize repo-specific rules as needed" -ForegroundColor White
    Write-Host "  3. Commit with: git commit -m 'ci: add copilot instructions for AI guidance'" -ForegroundColor White
}