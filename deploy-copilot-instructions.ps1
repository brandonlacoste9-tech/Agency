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
        path = "..\..\..\..\Beehive"
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
        name = "AdgenXAI Core"
        path = "..\..\..\..\adgenxai"
        description = "Main AdgenXAI platform and agent coordination"
        runtime = "Node 20 / TypeScript + Next.js"
        deployment = "Netlify with agent services"
        moduleSystem = "ES6 modules with Next.js App Router"
        keyFolders = "app/ (Next.js), agents/ (AI workers), scripts/ (automation)"
        integrationPoints = "GitHub APIs, AI services, webhook processing, dashboard"
        specificPatterns = "Agent orchestration with fallback patterns"
        specificRules = "- Use existing agent patterns in agents/ directory\n- All external calls need error handling and timeouts\n- Maintain separation between UI (app/) and agents"
        commonTask = "adding a new agent"
        preferredApproach = "create agents/new-agent/ with proper structure"
        antiPattern = "mixing agent logic with UI components"
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