#!/usr/bin/env bash
# shellcheck shell=bash
# Source this file from Buildkite commands:
#   . .buildkite/scripts/setup-bun.sh
set -euo pipefail

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

BUN_VERSION="$(node -e 'const fs = require("fs"); const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); const pm = String(pkg.packageManager || "bun@latest"); console.log(pm.includes("@") ? pm.split("@").pop() : "latest");')"

if ! command -v bun >/dev/null 2>&1 || { [ "$BUN_VERSION" != "latest" ] && [ "$(bun --version)" != "$BUN_VERSION" ]; }; then
  echo "~~~ :bun: Installing Bun $BUN_VERSION"
  if [ "$BUN_VERSION" = "latest" ]; then
    curl -fsSL https://bun.sh/install | bash
  else
    curl -fsSL https://bun.sh/install | bash -s "bun-v$BUN_VERSION"
  fi
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

echo "Bun: $(bun --version)"
