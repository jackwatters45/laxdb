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

if [ -z "$WEBHOOK" ]; then
  echo "No incoming webhook payload; skipping git-ai."
  exit 0
fi

ACTION="$(printf '%s' "$WEBHOOK" | read_webhook_field action)"
MERGED="$(printf '%s' "$WEBHOOK" | read_webhook_field pull_request.merged)"

if [ "$ACTION" != "closed" ] || [ "$MERGED" != "true" ]; then
  echo "Not a merged pull_request.closed webhook (action=${ACTION:-none}, merged=${MERGED:-unknown}); skipping git-ai."
  exit 0
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN secret is required for git-ai." >&2
  exit 1
fi

EVENT_FILE="$(mktemp)"
printf '%s' "$WEBHOOK" > "$EVENT_FILE"
export GITHUB_EVENT_NAME="pull_request"
export GITHUB_EVENT_PATH="$EVENT_FILE"

echo "~~~ :robot_face: Installing git-ai"
curl -fsSL https://usegitai.com/install.sh | bash
export PATH="$HOME/.git-ai/bin:$PATH"

git config --global user.name "buildkite[bot]"
git config --global user.email "buildkite[bot]@users.noreply.github.com"

echo "~~~ :robot_face: Running git-ai"
git-ai ci github run
