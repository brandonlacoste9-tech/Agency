#!/bin/bash
set -e

echo "🚀 AdGenXAI Phase-2 Setup Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found. Please install it first:${NC}"
    echo "   https://cli.github.com/"
    exit 1
fi

echo -e "${BLUE}📋 Creating GitHub labels...${NC}"

# Create labels (|| true ensures script continues if label exists)
gh label create "PR-3: Providers" \
  --description "AI provider integration tasks" \
  --color ff5733 || true

gh label create "PR-1: Supabase" \
  --description "Database & real-time features" \
  --color 33ff57 || true

gh label create "PR-5: Auth" \
  --description "Authentication + RLS" \
  --color 5743ff || true

gh label create "Aurora Theme" \
  --description "UI/UX consistency" \
  --color ff33d4 || true

gh label create "BEE-SHIP" \
  --description "Deployment infrastructure" \
  --color 33d4ff || true

echo -e "${GREEN}✅ Labels created!${NC}"
echo ""

echo -e "${BLUE}📊 Creating Phase-2 project...${NC}"

# Get repo name
REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Create project (skip if exists)
if gh project list --owner "$(echo $REPO_NAME | cut -d'/' -f1)" --format json | grep -q "Phase-2"; then
    echo -e "${YELLOW}ℹ️  Phase-2 project already exists, skipping...${NC}"
else
    gh project create "Phase-2" \
      --owner "$(echo $REPO_NAME | cut -d'/' -f1)" \
      --body "Automated tracking for Phase-2 PRs (Providers, Supabase, Auth)."
    echo -e "${GREEN}✅ Phase-2 project created!${NC}"
fi
echo ""

echo -e "${BLUE}📁 Creating provider system structure...${NC}"

# Create lib/providers directory
mkdir -p lib/providers

# Create provider README
cat > lib/providers/README.md << 'EOF'
# AdGenXAI Provider System

Following the Sensory Cortex pattern, providers are external AI adapters.

## Supported Providers

### OpenAI (Primary)
- Real streaming via Server-Sent Events (SSE)
- Function calling support
- Token-based rate limiting
- Error handling with exponential backoff

### GitHub Models (Fallback)
- Completion API
- Basic streaming support
- Rate limit awareness
- Automatic failover from OpenAI

## Configuration

Set the `AI_PROVIDER` environment variable to choose:

```bash
AI_PROVIDER=openai    # Use OpenAI (default)
AI_PROVIDER=github    # Use GitHub Models
```

## Architecture

```
lib/providers/
├── README.md          (this file)
├── interface.ts       (Provider interface definition)
├── openai.ts          (OpenAI adapter)
├── github.ts          (GitHub Models adapter)
├── factory.ts         (Provider factory)
└── __tests__/         (Integration tests)
```

## Phase-2 Implementation TODO

- [ ] Define Provider interface (`interface.ts`)
- [ ] Implement OpenAI adapter with real streaming
- [ ] Implement GitHub Models adapter with fallback logic
- [ ] Add feature flag system (`AI_PROVIDER` env var)
- [ ] Implement error handling + exponential backoff
- [ ] Add rate limiting logic
- [ ] Create provider factory
- [ ] Write integration tests
- [ ] Update documentation (PROVIDER_INTEGRATION.md)
- [ ] Add provider metrics/telemetry

## Usage Example

```typescript
import { createProvider } from '@/lib/providers/factory';

const provider = createProvider(process.env.AI_PROVIDER);

const stream = await provider.streamCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
});

for await (const chunk of stream) {
  console.log(chunk.content);
}
```

## Error Handling

All providers implement consistent error handling:
- Network errors: Retry with exponential backoff
- Rate limits: Wait and retry with jitter
- Auth errors: Fail fast with clear message
- Model errors: Log and fallback to alternate provider

## Testing

Run provider integration tests:

```bash
npm run test:providers          # All providers
npm run test:providers:openai   # OpenAI only
npm run test:providers:github   # GitHub Models only
```

## Related Documentation

- [PROVIDER_INTEGRATION.md](../../docs/PROVIDER_INTEGRATION.md) - Detailed integration guide
- [INTEGRATION_QUICKSTART.md](../../docs/INTEGRATION_QUICKSTART.md) - Quick setup guide
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - Development patterns
EOF

echo -e "${GREEN}✅ Provider system structure created!${NC}"
echo ""

echo -e "${BLUE}🔍 Checking for existing Phase-2 branches...${NC}"

# Check if phase2 branch already exists
if git show-ref --verify --quiet refs/heads/feat/phase2-kickoff; then
    echo -e "${YELLOW}⚠️  Branch 'feat/phase2-kickoff' already exists.${NC}"
    echo -e "${YELLOW}   Skipping branch creation. Delete it first if you want to recreate:${NC}"
    echo -e "${YELLOW}   git branch -D feat/phase2-kickoff${NC}"
else
    echo -e "${BLUE}🌿 Creating kickoff branch...${NC}"

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)

    # Create and switch to new branch
    git checkout -b feat/phase2-kickoff

    # Stage the provider README
    git add lib/providers/README.md

    # Commit
    git commit -m "feat(phase2): kickoff providers system to trigger CCR + agent

This PR initializes the provider system architecture following the Sensory
Cortex pattern. It sets up the foundation for PR-3 (Providers), PR-1 (Supabase),
and PR-5 (Auth) implementations.

Phase-2 Implementation Plan:
- Provider interface with OpenAI + GitHub Models adapters
- Real streaming with SSE
- Feature flag system (AI_PROVIDER env var)
- Error handling with exponential backoff
- Rate limiting and fallback logic
- Integration tests

This commit will trigger:
1. Phase-2 CI/CD workflow
2. Auto-labeling (PR-3: Providers)
3. Copilot Code Review
4. Claude planning comments
5. Automated stacked PR generation"

    echo -e "${GREEN}✅ Kickoff branch created!${NC}"
    echo ""
    echo -e "${BLUE}📤 Pushing to origin...${NC}"

    # Push to origin
    git push -u origin feat/phase2-kickoff

    echo -e "${GREEN}✅ Branch pushed!${NC}"
    echo ""

    # Switch back to original branch
    git checkout "$CURRENT_BRANCH"

    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "   1. Open a PR from 'feat/phase2-kickoff' to 'main'"
    echo "   2. The Phase-2 workflow will automatically:"
    echo "      - Run CI (lint, typecheck, test, build)"
    echo "      - Apply labels based on changed paths"
    echo "      - Request Copilot Code Review"
    echo "      - Ask Claude to propose implementation plans"
    echo "   3. Review the automated comments and suggestions"
    echo "   4. Copilot/agents will open stacked PRs with fixes"
    echo ""
    echo -e "${GREEN}🎉 Phase-2 setup complete!${NC}"
fi

echo ""
echo -e "${BLUE}📚 Additional Setup (if needed):${NC}"
echo ""
echo -e "Set these secrets in GitHub Settings → Secrets → Actions:"
echo "  • OPENAI_API_KEY"
echo "  • SUPABASE_URL"
echo "  • SUPABASE_ANON_KEY"
echo "  • SUPABASE_SERVICE_ROLE_KEY"
echo "  • NETLIFY_AUTH_TOKEN"
echo "  • NETLIFY_SITE_ID"
echo ""
echo -e "Set this environment variable in Netlify:"
echo "  • AI_PROVIDER=openai (or 'github' for fallback)"
echo ""
echo -e "${GREEN}All set! 🚀${NC}"
