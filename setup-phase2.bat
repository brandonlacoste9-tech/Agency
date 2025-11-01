@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   AdGenXAI Phase-2 Setup Script (Windows)
echo ========================================
echo.

REM Check if gh CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] GitHub CLI (gh) not found. Please install it first:
    echo            https://cli.github.com/
    exit /b 1
)

echo [INFO] Creating GitHub labels...

REM Create labels (2>nul suppresses errors if label exists)
gh label create "PR-3: Providers" --description "AI provider integration tasks" --color ff5733 2>nul
gh label create "PR-1: Supabase" --description "Database & real-time features" --color 33ff57 2>nul
gh label create "PR-5: Auth" --description "Authentication + RLS" --color 5743ff 2>nul
gh label create "Aurora Theme" --description "UI/UX consistency" --color ff33d4 2>nul
gh label create "BEE-SHIP" --description "Deployment infrastructure" --color 33d4ff 2>nul

echo [SUCCESS] Labels created!
echo.

echo [INFO] Creating Phase-2 project...

REM Get repo name
for /f "tokens=*" %%i in ('gh repo view --json nameWithOwner -q .nameWithOwner') do set REPO_NAME=%%i

REM Create project (skip if exists)
gh project list --owner "%REPO_NAME:*/=%" --format json | findstr /C:"Phase-2" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Phase-2 project already exists, skipping...
) else (
    for /f "tokens=1 delims=/" %%a in ("%REPO_NAME%") do set OWNER=%%a
    gh project create "Phase-2" --owner "!OWNER!" --body "Automated tracking for Phase-2 PRs (Providers, Supabase, Auth)."
    echo [SUCCESS] Phase-2 project created!
)
echo.

echo [INFO] Creating provider system structure...

REM Create lib/providers directory
if not exist lib\providers mkdir lib\providers

REM Create provider README
(
echo # AdGenXAI Provider System
echo.
echo Following the Sensory Cortex pattern, providers are external AI adapters.
echo.
echo ## Supported Providers
echo.
echo ### OpenAI ^(Primary^)
echo - Real streaming via Server-Sent Events ^(SSE^)
echo - Function calling support
echo - Token-based rate limiting
echo - Error handling with exponential backoff
echo.
echo ### GitHub Models ^(Fallback^)
echo - Completion API
echo - Basic streaming support
echo - Rate limit awareness
echo - Automatic failover from OpenAI
echo.
echo ## Configuration
echo.
echo Set the `AI_PROVIDER` environment variable to choose:
echo.
echo ```bash
echo AI_PROVIDER=openai    # Use OpenAI ^(default^)
echo AI_PROVIDER=github    # Use GitHub Models
echo ```
echo.
echo ## Phase-2 Implementation TODO
echo.
echo - [ ] Define Provider interface ^(`interface.ts`^)
echo - [ ] Implement OpenAI adapter with real streaming
echo - [ ] Implement GitHub Models adapter with fallback logic
echo - [ ] Add feature flag system ^(`AI_PROVIDER` env var^)
echo - [ ] Implement error handling + exponential backoff
echo - [ ] Add rate limiting logic
echo - [ ] Create provider factory
echo - [ ] Write integration tests
echo - [ ] Update documentation ^(PROVIDER_INTEGRATION.md^)
echo - [ ] Add provider metrics/telemetry
) > lib\providers\README.md

echo [SUCCESS] Provider system structure created!
echo.

echo [INFO] Checking for existing Phase-2 branches...

REM Check if phase2 branch already exists
git show-ref --verify --quiet refs/heads/feat/phase2-kickoff >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Branch 'feat/phase2-kickoff' already exists.
    echo            Skipping branch creation. Delete it first if you want to recreate:
    echo            git branch -D feat/phase2-kickoff
) else (
    echo [INFO] Creating kickoff branch...

    REM Get current branch
    for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

    REM Create and switch to new branch
    git checkout -b feat/phase2-kickoff

    REM Stage the provider README
    git add lib\providers\README.md

    REM Commit
    git commit -m "feat(phase2): kickoff providers system to trigger CCR + agent" -m "This PR initializes the provider system architecture following the Sensory Cortex pattern. It sets up the foundation for PR-3 (Providers), PR-1 (Supabase), and PR-5 (Auth) implementations." -m "Phase-2 Implementation Plan: Provider interface with OpenAI + GitHub Models adapters, Real streaming with SSE, Feature flag system (AI_PROVIDER env var), Error handling with exponential backoff, Rate limiting and fallback logic, Integration tests" -m "This commit will trigger: 1. Phase-2 CI/CD workflow, 2. Auto-labeling (PR-3: Providers), 3. Copilot Code Review, 4. Claude planning comments, 5. Automated stacked PR generation"

    echo [SUCCESS] Kickoff branch created!
    echo.
    echo [INFO] Pushing to origin...

    REM Push to origin
    git push -u origin feat/phase2-kickoff

    echo [SUCCESS] Branch pushed!
    echo.

    REM Switch back to original branch
    git checkout !CURRENT_BRANCH!

    echo [INFO] Next steps:
    echo    1. Open a PR from 'feat/phase2-kickoff' to 'main'
    echo    2. The Phase-2 workflow will automatically:
    echo       - Run CI (lint, typecheck, test, build)
    echo       - Apply labels based on changed paths
    echo       - Request Copilot Code Review
    echo       - Ask Claude to propose implementation plans
    echo    3. Review the automated comments and suggestions
    echo    4. Copilot/agents will open stacked PRs with fixes
    echo.
    echo [SUCCESS] Phase-2 setup complete!
)

echo.
echo [INFO] Additional Setup (if needed):
echo.
echo Set these secrets in GitHub Settings -^> Secrets -^> Actions:
echo   * OPENAI_API_KEY
echo   * SUPABASE_URL
echo   * SUPABASE_ANON_KEY
echo   * SUPABASE_SERVICE_ROLE_KEY
echo   * NETLIFY_AUTH_TOKEN
echo   * NETLIFY_SITE_ID
echo.
echo Set this environment variable in Netlify:
echo   * AI_PROVIDER=openai (or 'github' for fallback)
echo.
echo All set! 🚀

endlocal
