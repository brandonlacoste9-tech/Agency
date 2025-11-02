#!/usr/bin/env bash
set -euo pipefail
PATCH="$1"
BRANCH="${2:-claude/autofix-$(date +%Y%m%d%H%M%S)}"
MSG="${3:-chore(claude): apply Claude patch}"

if [ -z "$PATCH" ]; then
  echo "Usage: $0 <patch-file> [branch] [commit-message]"
  exit 1
fi

git checkout -b "$BRANCH"
if git apply --check "$PATCH"; then
  git apply "$PATCH"
else
  echo "Patch failed git apply --check"
  exit 2
fi

npm test || { echo "Tests failed"; exit 3; }
git add -A
git commit -m "$MSG"
git push -u origin "$BRANCH"
if command -v gh >/dev/null; then
  gh pr create --fill --title "$MSG" --body "Applied Claude-generated patch: $PATCH"
  echo "PR created."
else
  echo "Pushed branch $BRANCH. Create a PR manually."
fi