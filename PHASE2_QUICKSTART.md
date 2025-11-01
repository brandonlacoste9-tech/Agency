# Phase-2 Quickstart — Three Ways to Launch

## 🚀 Pick Your Path

### Option 1: 🎯 ONE-COMMAND COMPLETE SETUP (Recommended)

**Use this if**: You want everything automated — files, commits, labels, project, branch, PR.

**Windows**:
```cmd
phase2-complete-setup.bat
```

**Mac/Linux**:
```bash
chmod +x phase2-complete-setup.sh
./phase2-complete-setup.sh
```

**What it does**:
1. ✅ Commits Phase-2 files to current branch
2. ✅ Pushes to origin
3. ✅ Creates 5 GitHub labels (PR-3, PR-1, PR-5, Aurora, BEE-SHIP)
4. ✅ Creates Phase-2 project
5. ✅ Creates `lib/providers/` structure + README
6. ✅ Creates & pushes `feat/phase2-kickoff` branch
7. ✅ (Optional) Opens PR automatically

**Time**: ~2 minutes

---

### Option 2: ⚙️ FILES FIRST, AUTOMATION LATER

**Use this if**: You want to review/modify files before creating labels/project.

**Windows**:
```cmd
setup-phase2.bat
```

**Mac/Linux**:
```bash
chmod +x setup-phase2.sh
./setup-phase2.sh
```

**What it does**:
1. ✅ Creates 5 GitHub labels
2. ✅ Creates Phase-2 project
3. ✅ Creates `lib/providers/` structure + README
4. ✅ Creates & pushes `feat/phase2-kickoff` branch
5. ⏭️  Assumes files are already committed

**Time**: ~1 minute

**Before running**: Commit Phase-2 files manually:
```bash
git add .github/workflows/phase2.yml
git add .github/labeler.yml
git add copilot-instructions.md
git add COPILOT_GUARDRAILS.md
git add .github/pull_request_template.md
git commit -m "feat(phase2): add autonomous PR workflow infrastructure"
git push origin main
```

---

### Option 3: 🛠️ MANUAL SETUP (Full Control)

**Use this if**: You want complete control over each step.

**Step-by-step guide**: See `PHASE2_SETUP_GUIDE.md` under "Manual Setup"

**Time**: ~5-10 minutes

---

## 📋 Pre-Flight Checklist

Before running any script:

- [ ] **GitHub CLI installed**: Run `gh --version` (if not: https://cli.github.com/)
- [ ] **Git configured**: Run `git config user.name` and `git config user.email`
- [ ] **Working directory**: You're in the repo root (`adgenxai-2/`)
- [ ] **Secrets configured** (for agents to work):
  - GitHub Settings → Secrets → Actions:
    - `OPENAI_API_KEY`
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `NETLIFY_AUTH_TOKEN`
    - `NETLIFY_SITE_ID`
  - Netlify Dashboard → Environment Variables:
    - `AI_PROVIDER=openai` (or `github`)

---

## 🎬 What Happens After Setup

### Immediately (< 30 seconds):
1. ✅ GitHub labels exist (`gh label list`)
2. ✅ Phase-2 project exists (`gh project list`)
3. ✅ Provider structure exists (`lib/providers/README.md`)
4. ✅ Kickoff branch pushed (`git branch -r | grep phase2-kickoff`)

### After Opening PR (< 2 minutes):
1. 🤖 **CI runs**: lint → typecheck → test → build
2. 🏷️ **Label applied**: `PR-3: Providers`
3. 🤝 **Copilot comment**: Requests code review
4. 🧠 **Claude comment**: Asks for implementation plans

### Within 5-10 minutes:
1. 📝 **Copilot analyzes**: Posts review findings
2. 📊 **Claude posts**: Structured plans for PR-3, PR-1, PR-5
3. 🔄 **Agents open stacked PRs** (if needed):
   - `[stack] PR-3: Implement OpenAI streaming adapter`
   - `[stack] PR-1: Add Supabase RPC views`
   - `[stack] PR-5: Enforce RLS on API routes`

---

## ✅ Verification

Run these commands to verify setup:

```bash
# Check labels
gh label list | grep -E "PR-3|PR-1|PR-5|Aurora|BEE-SHIP"

# Check project
gh project list | grep "Phase-2"

# Check provider structure
cat lib/providers/README.md

# Check kickoff branch
git branch -r | grep phase2-kickoff

# Check PR (after opening)
gh pr list --head feat/phase2-kickoff
```

---

## 🐛 Troubleshooting

### "gh: command not found"
**Solution**: Install GitHub CLI: https://cli.github.com/

### "Permission denied" (Unix/Linux/macOS)
**Solution**: Run `chmod +x phase2-complete-setup.sh` or `chmod +x setup-phase2.sh`

### Workflow not triggering
**Solution**: Check PR targets `main` branch and touches files in workflow `paths`

### Labels not applying
**Solution**: Verify `.github/labeler.yml` patterns match your file structure

### Copilot not responding
**Solution**: Ensure Copilot is enabled for repo and PR is not draft

### Script fails on Windows
**Solution**: Use Git Bash or check line endings (`git config core.autocrlf false`)

---

## 📊 Success Indicators

Your Phase-2 setup is **fully operational** when:

✅ Opening a PR automatically applies correct labels
✅ CI workflow completes in < 5 minutes
✅ Copilot posts code review within 2 minutes
✅ Claude posts implementation plans in comments
✅ Agents open stacked PRs with relevant changes
✅ All PRs link to Phase-2 project
✅ BEE-SHIP deployment scripts still work

---

## 🎯 Quick Decision Guide

**Choose Option 1** (one-command complete setup) if:
- ✅ You trust automation
- ✅ You want the fastest path
- ✅ You're okay with automatic PR creation

**Choose Option 2** (files first, automation later) if:
- ✅ You want to review files before setup
- ✅ You want to modify files before committing
- ✅ You prefer step-by-step control

**Choose Option 3** (manual setup) if:
- ✅ You want full control over every step
- ✅ Scripts are failing for some reason
- ✅ You need to customize the process

---

## 📚 Full Documentation

- **`PHASE2_SETUP_GUIDE.md`** - Comprehensive 400-line guide
- **`PHASE2_FILES_CREATED.md`** - Complete file manifest
- **`.github/copilot-instructions.md`** - 785-line dev patterns
- **`copilot-instructions.md`** - Code review instructions
- **`COPILOT_GUARDRAILS.md`** - Agent constraints

---

## 🚢 Ready to Ship?

**Windows**:
```cmd
phase2-complete-setup.bat
```

**Mac/Linux**:
```bash
chmod +x phase2-complete-setup.sh && ./phase2-complete-setup.sh
```

Then watch the autonomous loop activate! ✨

---

**Questions?** Check `PHASE2_SETUP_GUIDE.md` or open an issue.

**Generated with** [Claude Code](https://claude.com/claude-code) 🤖
