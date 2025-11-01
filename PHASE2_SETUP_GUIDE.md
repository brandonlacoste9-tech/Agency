# Phase-2 Setup Guide — Autonomous PR Workflows

This guide explains the Phase-2 automation infrastructure that enables Copilot Code Review (CCR), coding agents, and Claude integration to autonomously generate and manage PRs.

## 🎯 What's Included

### 1. GitHub Actions Workflow (`.github/workflows/phase2.yml`)

**Automated CI/CD orchestrator** that runs on every PR to `main`:

- **CI Job**: Runs lint, typecheck, test, and build
- **Label Job**: Auto-applies labels based on changed file paths
- **Copilot Review Job**: Posts a comment requesting @copilot to run Code Review
- **Claude Brief Job**: Posts a comment asking @claude to draft implementation plans

**Triggers**:
- PR opened, synchronized, reopened, or marked ready for review
- Manual dispatch via GitHub Actions UI

**Permissions**: Reads code, writes to PRs/issues/checks

---

### 2. Auto-Labeler Configuration (`.github/labeler.yml`)

**Path-based label assignment** that automatically tags PRs:

| Label | Triggered by changes in |
|-------|------------------------|
| `PR-3: Providers` | `app/api/chat/`, `lib/providers/`, webhook functions, provider docs |
| `PR-1: Supabase` | `lib/db/`, `lib/supabase/`, dashboard, database docs |
| `PR-5: Auth` | `lib/auth/`, auth pages, layouts, middleware |
| `Aurora Theme` | UI components, globals.css, Tailwind config |
| `BEE-SHIP` | Deployment scripts, netlify.toml |

---

### 3. Copilot Code Review Instructions (`copilot-instructions.md`)

**Agent guidance document** at the repo root that instructs Copilot on:

- **Priorities**: Security (RLS, auth, webhooks) → Correctness → Quality
- **Repo context**: Provider architecture, Supabase patterns, Auth requirements
- **Rules**: PR size limits (<400 LOC), no secrets, test/doc updates required
- **Fix workflow**: Open stacked PRs by scope, apply labels, link to Phase-2 project

---

### 4. Agent Guardrails (`COPILOT_GUARDRAILS.md`)

**Strict constraints** for autonomous agents:

- PRs must be < 400 LOC net change
- Never commit secrets (use `process.env`)
- ESLint clean + TypeScript strict required
- Tests & docs must be updated with behavior changes
- Propose plan before broad edits
- Apply scope-specific labels and link to Phase-2 project

---

### 5. Enhanced PR Template (`.github/pull_request_template.md`)

**Comprehensive PR checklist** covering:

- **AdGenXAI Checklist**: ESLint, tests, docs, secrets, Aurora theme, BEE-SHIP, Sensory Cortex patterns
- **Phase-2 Integration**: Scoped labels, project linking, provider/RLS/webhook testing
- **Risk & Rollback**: Risk level, rollback strategy, external dependencies
- **Agent Handoff**: Structured request for Copilot Code Review with focus areas

---

### 6. Setup Automation Scripts

**One-command setup** for the entire Phase-2 infrastructure:

#### Unix/Linux/macOS: `setup-phase2.sh`

```bash
chmod +x setup-phase2.sh
./setup-phase2.sh
```

#### Windows: `setup-phase2.bat`

```cmd
setup-phase2.bat
```

**What the scripts do**:
1. ✅ Create GitHub labels (PR-3, PR-1, PR-5, Aurora Theme, BEE-SHIP)
2. ✅ Create Phase-2 project for tracking
3. ✅ Create `lib/providers/` directory structure
4. ✅ Generate comprehensive provider system README
5. ✅ Create `feat/phase2-kickoff` branch
6. ✅ Commit provider README with detailed commit message
7. ✅ Push to origin and trigger Phase-2 workflow

---

### 7. Provider System Foundation (`lib/providers/README.md`)

**Architecture documentation** for the provider system:

- **Supported providers**: OpenAI (primary), GitHub Models (fallback)
- **Configuration**: `AI_PROVIDER` environment variable
- **Architecture**: Interface → Adapters → Factory pattern
- **Phase-2 TODO**: Detailed implementation checklist
- **Usage examples**: Code snippets for integration
- **Error handling**: Retry logic, rate limiting, fallback strategies
- **Testing guide**: Provider-specific test commands

---

## 🚀 Quick Start

### Prerequisites

1. **GitHub CLI installed**: https://cli.github.com/
2. **Git configured**: `git config user.name` and `user.email` set
3. **Repo cloned**: Working directory is repo root

### One-Command Setup

**Windows**:
```cmd
setup-phase2.bat
```

**Unix/Linux/macOS**:
```bash
chmod +x setup-phase2.sh
./setup-phase2.sh
```

### Manual Setup (if scripts fail)

1. **Create labels**:
```bash
gh label create "PR-3: Providers" -d "AI provider integration tasks" --color ff5733
gh label create "PR-1: Supabase" -d "Database & real-time features" --color 33ff57
gh label create "PR-5: Auth" -d "Authentication + RLS" --color 5743ff
gh label create "Aurora Theme" -d "UI/UX consistency" --color ff33d4
gh label create "BEE-SHIP" -d "Deployment infrastructure" --color 33d4ff
```

2. **Create Phase-2 project**:
```bash
gh project create "Phase-2" \
  --repo "$(gh repo view --json nameWithOwner -q .nameWithOwner)" \
  --body "Automated tracking for Phase-2 PRs (Providers, Supabase, Auth)."
```

3. **Create provider structure**:
```bash
mkdir -p lib/providers
# Copy content from PHASE2_SETUP_GUIDE.md or setup script
```

4. **Create kickoff branch**:
```bash
git checkout -b feat/phase2-kickoff
git add lib/providers/README.md
git commit -m "feat(phase2): kickoff providers system to trigger CCR + agent"
git push -u origin feat/phase2-kickoff
```

5. **Open PR**: Go to GitHub and open a PR from `feat/phase2-kickoff` to `main`

---

## 🔄 How the Autonomous Loop Works

### Phase 1: PR Opened
1. Developer (or script) pushes `feat/phase2-kickoff` branch
2. Developer opens PR to `main`

### Phase 2: CI/CD Workflow Triggers
1. **CI Job** runs: lint → typecheck → test → build
2. **Label Job** runs: Applies `PR-3: Providers` label (based on `lib/providers/` changes)

### Phase 3: Agent Activation
1. **Copilot Review Job**: Posts comment mentioning @copilot with focus areas
2. **Claude Brief Job**: Posts comment asking @claude for implementation plans

### Phase 4: Copilot Code Review
- Copilot analyzes the PR with tool-calling
- Checks security (RLS, auth, webhooks), ESLint, provider patterns, etc.
- Identifies issues and proposes fixes

### Phase 5: Stacked PR Generation
- If fixes are safe and non-trivial, Copilot/agents open **stacked PRs**:
  - `[stack] PR-3: Implement OpenAI streaming adapter`
  - `[stack] PR-1: Add Supabase RPC views for dashboard`
  - `[stack] PR-5: Enforce RLS on API routes`
- Each stacked PR:
  - References the original PR
  - Applies appropriate label (PR-3, PR-1, or PR-5)
  - Links to Phase-2 project
  - Includes diff summary, test notes, and assumptions

### Phase 6: Claude Planning
- Claude drafts concise plans + diffs for each scope (PR-3, PR-1, PR-5)
- Plans include:
  - File list
  - Implementation approach
  - Test strategy
  - Doc updates needed

### Phase 7: Iterative Refinement
- Developers review automated PRs
- Approve/merge or request changes
- Agents respond to feedback and iterate

---

## 📋 Environment Setup

### GitHub Secrets (Settings → Secrets → Actions)

Add these secrets for provider integrations:

| Secret | Description | Example |
|--------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJxxx...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJxxx...` |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | `xxx...` |
| `NETLIFY_SITE_ID` | Netlify site ID | `xxx-xxx-xxx` |

### Netlify Environment Variables

Set in Netlify dashboard (Site settings → Environment variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `AI_PROVIDER` | `openai` or `github` | Primary AI provider |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API key |
| `GITHUB_TOKEN` | `ghp_...` | GitHub PAT for GitHub Models |

---

## 🎨 Copilot Agent Master Prompt

**Copy-paste this into the Copilot agent pane** to activate autonomous Phase-2 execution:

```
AdGenXAI Phase-2 Execution

Constraints: PRs < 400 LOC; ESLint + TS strict; tests & docs updated; no secrets; Aurora mobile-first styling.

PR-3 (Providers): Real streaming via OpenAI with GitHub Models fallback (AI_PROVIDER=openai|github).
Implement adapter interface, adapters, feature flag, error handling, and tests.

PR-1 (Supabase): Replace mocks with Supabase views/RPC and real-time channels; preserve RLS; add types and integration tests.

PR-5 (Auth): Supabase Auth; RLS on all routes; user/tenant ownership; update dashboard to use session context.

Actions: Propose plan (file list) → open stacked PRs → apply labels (PR-3/PR-1/PR-5) → link Phase-2 →
request @copilot review → self-fix findings → keep BEE-SHIP deploy compatible.
```

---

## 🔍 Verification Checklist

Before opening the kickoff PR:

- [ ] GitHub CLI installed and authenticated (`gh auth status`)
- [ ] All Phase-2 files created (workflow, labeler, instructions, guardrails, template)
- [ ] Labels created in GitHub repo
- [ ] Phase-2 project exists
- [ ] Provider structure created (`lib/providers/README.md`)
- [ ] Secrets configured in GitHub Actions
- [ ] Environment variables set in Netlify
- [ ] Existing CI workflow is green (`.github/workflows/ci.yml`)
- [ ] `feat/phase2-kickoff` branch pushed to origin

---

## 🐛 Troubleshooting

### Labels not applying
- Check `.github/labeler.yml` glob patterns match your file structure
- Verify `actions/labeler@v5` has `pull-requests: write` permission
- Manually apply labels and re-run workflow

### Copilot not responding
- Ensure comment includes `@copilot` mention
- Check Copilot is enabled for your repo
- Verify PR is not in draft mode

### Workflow not triggering
- Check `on.pull_request.paths` matches changed files
- Ensure PR targets `main` branch
- Look for YAML syntax errors in workflow file

### Scripts fail on Windows
- Use Git Bash instead of CMD/PowerShell
- Ensure line endings are LF not CRLF (`git config core.autocrlf false`)
- Run as Administrator if permission errors

### Agent constraints violated
- PRs > 400 LOC: Split into smaller, focused PRs
- Secrets in code: Move to environment variables immediately
- ESLint errors: Run `npm run lint --fix` locally first

---

## 📚 Related Documentation

- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Comprehensive development guide
- [copilot-instructions.md](copilot-instructions.md) - Code review instructions
- [COPILOT_GUARDRAILS.md](COPILOT_GUARDRAILS.md) - Agent constraints
- [BEE_SHIP_QUICK_REF.md](BEE_SHIP_QUICK_REF.md) - Deployment guide
- [lib/providers/README.md](lib/providers/README.md) - Provider system architecture

---

## 🎯 Success Metrics

Your Phase-2 setup is working when:

✅ Opening a PR auto-applies correct labels (PR-3, PR-1, or PR-5)
✅ Copilot automatically posts code review within 1-2 minutes
✅ Claude posts implementation plans in comments
✅ Agents open stacked PRs with < 400 LOC changes
✅ All stacked PRs reference the original PR and link to Phase-2 project
✅ CI remains green throughout the process
✅ BEE-SHIP deploy scripts still work after changes

---

## 🚀 Next Steps

1. **Run setup script**: `./setup-phase2.sh` or `setup-phase2.bat`
2. **Open kickoff PR**: From `feat/phase2-kickoff` to `main`
3. **Watch the magic happen**: CI → labels → Copilot review → Claude plans → stacked PRs
4. **Review and merge**: Approve automated PRs or provide feedback
5. **Iterate**: Agents will respond to comments and refine their PRs

---

## 💡 Tips for Best Results

- **Clear commit messages**: Help agents understand intent
- **Small, focused changes**: Easier for agents to review and fix
- **Update docs proactively**: Reduces agent questions
- **Respond to agent comments**: Provides context for refinement
- **Link issues to PRs**: Helps agents understand requirements
- **Use conventional commits**: Enables better auto-labeling

---

**Questions?** Open an issue or check the docs: [.github/copilot-instructions.md](.github/copilot-instructions.md)

**Ready to ship?** Run `./setup-phase2.sh` and let the agents do the work! 🚢
