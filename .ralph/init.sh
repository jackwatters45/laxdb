#!/usr/bin/env bash
set -euo pipefail
echo "Starting development environment..."
infisical run --env=dev -- bun run dev
echo "Development environment ready."
