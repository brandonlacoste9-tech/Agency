#!/usr/bin/env bash
set -e

TMPFILE="$(mktemp /tmp/claude-selection.XXXXXX).md"
echo "Reading stdin into: $TMPFILE"
cat - > "$TMPFILE"

echo "Calling Claude..."
claude review "$TMPFILE" > "${TMPFILE}.out" || true
echo "Output written to: ${TMPFILE}.out"

# Open in VS Code if available
if command -v code >/dev/null 2>&1; then
  code --reuse-window "${TMPFILE}.out" || true
else
  echo "Open the file manually: ${TMPFILE}.out"
fi

exit 0