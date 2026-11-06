#!/usr/bin/env bash
# Runs every check CI runs. Usage: scripts/verify.sh
set -euo pipefail
cd "$(dirname "$0")/.."

run() {
  echo "▸ $*"
  "$@"
}

run npx prettier --check .
run npx eslint . --max-warnings 0
run npx tsc --noEmit
run npx vitest run
run npx next build
echo "✓ All checks passed"
