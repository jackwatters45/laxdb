#!/usr/bin/env bash
set -euo pipefail

read_webhook_field() {
  local expression="$1"
  node -e '
    const fs = require("fs");
    const data = fs.readFileSync(0, "utf8");
    const payload = data.trim() ? JSON.parse(data) : {};
    const expression = process.argv[1];
    const value = expression.split(".").reduce((current, key) => current == null ? undefined : current[key], payload);
    if (value !== undefined && value !== null) process.stdout.write(String(value));
  ' "$expression"
}

WEBHOOK=""
if command -v buildkite-agent >/dev/null 2>&1; then
  WEBHOOK="$(buildkite-agent meta-data get buildkite:webhook 2>/dev/null || true)"
fi

ACTION="${BUILDKITE_GITHUB_ACTION:-}"
PR_NUMBER=""
MERGED=""

if [ -n "$WEBHOOK" ]; then
  ACTION="$(printf '%s' "$WEBHOOK" | read_webhook_field action)"
  PR_NUMBER="$(printf '%s' "$WEBHOOK" | read_webhook_field pull_request.number)"
  if [ -z "$PR_NUMBER" ]; then
    PR_NUMBER="$(printf '%s' "$WEBHOOK" | read_webhook_field number)"
  fi
  MERGED="$(printf '%s' "$WEBHOOK" | read_webhook_field pull_request.merged)"
elif [ "${BUILDKITE_PULL_REQUEST:-false}" != "false" ]; then
  PR_NUMBER="${BUILDKITE_PULL_REQUEST}"
fi

if [ "$ACTION" != "closed" ]; then
  echo "Not a pull_request.closed webhook (action=${ACTION:-none}); nothing to clean up."
  exit 0
fi

if [ -z "$PR_NUMBER" ]; then
  echo "Could not determine PR number from webhook payload; refusing cleanup." >&2
  exit 1
fi

STAGE="pr-${PR_NUMBER}"
if [ "$STAGE" = "prod" ]; then
  echo "Refusing to destroy prod." >&2
  exit 1
fi

export PULL_REQUEST="$PR_NUMBER"

echo "PR: $PR_NUMBER"
echo "Merged: ${MERGED:-unknown}"
echo "Stage: $STAGE"

. .buildkite/scripts/setup-bun.sh

echo "~~~ :package: Installing dependencies"
bun install --frozen-lockfile

echo "~~~ :broom: Destroy preview environment"
bun alchemy destroy --stage "$STAGE"
