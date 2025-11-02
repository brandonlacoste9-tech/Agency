# Claude Automation Suite 🤖

Safe AI-assisted code changes with interactive review and validation.

## Quick Start (2 minutes)

```bash
# 1. Generate patches for Sora references (safe dry-run)
./scripts/claude-autofix.sh "sora|sora-client"

# 2. Inspect generated patches
ls /tmp/claude-patches.*
less /tmp/claude-patches.*/somefile.patch

# 3. Apply after review (only if patches look good)
CLAUDE_DRY_RUN=false ./scripts/claude-autofix.sh "sora|sora-client" "claude/autofix-sora"
```

## Files Overview

- **`scripts/claude-autofix.sh`** - Main interactive automation script
- **`scripts/claude-apply-and-pr.sh`** - Helper for applying single patches  
- **`scripts/claude-selection.sh`** - Process text selections with Claude
- **`claude-prompts.txt`** - Template prompts for consistent output
- **`.github/workflows/claude-autofix.yml`** - GitHub Actions workflow
- **`.vscode/tasks.json`** - VS Code tasks (Ctrl+Alt+C/T/P)
- **`.vscode/keybindings.json`** - Keyboard shortcuts

## Safety Features 🛡️

- **Dry-run by default** - No changes without explicit confirmation
- **Human review required** - All patches must be inspected
- **Test validation** - Runs `npm test` before committing
- **Git validation** - Uses `git apply --check` to validate patches

## VS Code Integration

1. Open any file in VS Code
2. Press **Ctrl+Alt+C** → Claude reviews the file
3. Press **Ctrl+Alt+T** → Generate unit test patch
4. Press **Ctrl+Alt+P** → Generate git patch for changes

## GitHub Actions

1. Go to Actions tab → "Claude Autofix (dry-run)"
2. Enter pattern (e.g., `sora|sora-client`)
3. Download `claude-patches` artifact
4. Review and apply manually

## Examples

### Find and fix deprecated APIs
```bash
./scripts/claude-autofix.sh "deprecated|legacy"
```

### Generate tests for components
```bash
./scripts/claude-autofix.sh "\.tsx$" "claude/add-tests"
```

### Process code selection
```bash
echo "function buggyCode() { ... }" | ./scripts/claude-selection.sh
```

## Safety First 🚨

- **Never run with `CLAUDE_DRY_RUN=false` without reviewing patches**
- **Always inspect patches before applying**: `git apply --check patch.file`
- **Test thoroughly**: `npm test && npm run build`
- **No auto-merge**: All PRs require human approval

Ready to use! Start with dry-run mode to explore safely. 🚀