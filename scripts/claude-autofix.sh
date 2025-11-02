#!/usr/bin/env bash
set -euo pipefail

# scripts/claude-autofix.sh
# Interactive demo: ask Claude to produce patches for files matching a pattern,
# let you inspect them, and optionally apply, test, commit, and open a PR.

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "$ROOT_DIR"

PATTERN="${1:-sora|sora-client}"   # default pattern to search for
BRANCH="${2:-claude/autofix-$(date +%Y%m%d%H%M%S)}"
DRY_RUN="${CLAUDE_DRY_RUN:-true}"  # default dry-run to true
CLAUDE_CMD="${CLAUDE_CMD:-claude}" # path to claude CLI

echo "Root: $ROOT_DIR"
echo "Searching files matching pattern: $PATTERN"
echo "Output branch: $BRANCH"
echo "Dry run: $DRY_RUN"
echo

# Check basic tools
command -v git >/dev/null || { echo "git not found"; exit 1; }
command -v "$CLAUDE_CMD" >/dev/null || { echo "'$CLAUDE_CMD' not found in PATH. Install Claude CLI."; exit 1; }

# Gather candidate files
mapfile -t FILES < <(git grep -IlE "$PATTERN" || true)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No files matched pattern. Try another pattern."
  exit 0
fi

echo "Found ${#FILES[@]} files:"
for f in "${FILES[@]}"; do
  echo " - $f"
done
echo

# Create a working branch
git checkout -b "$BRANCH"

PATCHES_DIR="$(mktemp -d /tmp/claude-patches.XXXXXX)"
echo "Patches will be placed in: $PATCHES_DIR"
echo

# For each file, ask Claude to generate a git patch
for file in "${FILES[@]}"; do
  out="$PATCHES_DIR/$(basename "$file").claude.patch"
  echo "Generating patch for: $file -> $out"
  # Use generate-patch so Claude returns a git-style patch
  # If generate-patch isn't available, fall back to generate-test or review
  if "$CLAUDE_CMD" generate-patch "$file" > "$out" 2>/dev/null; then
    echo "  -> patch saved"
  else
    echo "  -> 'generate-patch' failed; trying 'claude review' output as hint"
    "$CLAUDE_CMD" review "$file" > "$out".review || true
    echo "  -> review saved to $out.review"
    rm -f "$out" || true
  fi
done

echo
echo "Patches generated. Inspect them now:"
ls -1 "$PATCHES_DIR"
echo
echo "Open a patch (less) or use 'git apply --check' to validate."

# Validation and interactive apply
for p in "$PATCHES_DIR"/*.patch; do
  [ -e "$p" ] || continue
  echo
  echo "----- $p -----"
  # Sanity-check: is it a proper git patch?
  if git apply --check "$p" 2>/dev/null; then
    echo "Patch appears to apply cleanly (git apply --check OK)."
    echo "Preview head of patch:"
    sed -n '1,200p' "$p" | sed -n '1,40p'
    if [ "$DRY_RUN" = "true" ]; then
      echo "DRY_RUN=yes: not applying $p"
    else
      read -p "Apply patch $p? [y/N] " yn
      if [[ "$yn" =~ ^[Yy]$ ]]; then
        git apply "$p"
        echo "Applied $p"
      else
        echo "Skipped $p"
      fi
    fi
  else
    echo "Patch did NOT pass git apply --check. Inspect $p manually."
  fi
done

# If we applied any patches, run tests and optionally commit
if git status --porcelain | grep -q '^'; then
  echo
  echo "Local changes detected."
  if [ "$DRY_RUN" = "true" ]; then
    echo "DRY_RUN=yes: not running tests/committing."
    echo "If you want to run tests and commit, run with CLAUDE_DRY_RUN=false"
    echo "Example: CLAUDE_DRY_RUN=false ./scripts/claude-autofix.sh \"$PATTERN\" \"$BRANCH\""
    exit 0
  fi

  echo "Running tests: npm test"
  set +e
  npm test
  TEST_RC=$?
  set -e
  if [ $TEST_RC -ne 0 ]; then
    echo "Tests failed. Inspect changes and fix before committing."
    exit 2
  fi

  git add -A
  git commit -m "chore(claude): apply Claude suggested patches for pattern '$PATTERN'"
  git push -u origin "$BRANCH"
  echo "Changes pushed to branch $BRANCH"

  # Create PR
  if command -v gh >/dev/null; then
    gh pr create --fill --title "chore(claude): suggested fixes for $PATTERN" --body "Automated suggestions produced by Claude. Please review." || true
    echo "PR created (if GH CLI is configured)."
  else
    echo "gh CLI not found; please open a PR manually for branch $BRANCH"
  fi
else
  echo "No changes applied. Nothing to commit."
fi

echo "Done. Patches: $PATCHES_DIR"