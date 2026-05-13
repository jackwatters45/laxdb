#!/usr/bin/env bash
set -euo pipefail

TASK="${1:-}"
if [ -z "$TASK" ]; then
  echo "usage: $0 <lint-format|typecheck>" >&2
  exit 64
fi

. .buildkite/scripts/setup-bun.sh

echo "~~~ :package: Installing dependencies"
bun install --frozen-lockfile

case "$TASK" in
  lint-format)
    echo "~~~ :lint-roller: Lint"
    bun run lint
    echo "~~~ :paintbrush: Format check"
    bun run format
    ;;
  typecheck)
    echo "~~~ :page_facing_up: Generate marketing content collections"
    (cd packages/marketing && bun run gen:content-collections)
    echo "~~~ :typescript: Typecheck"
    bun run typecheck
    ;;
  *)
    echo "unknown CI task: $TASK" >&2
    exit 64
    ;;
esac
