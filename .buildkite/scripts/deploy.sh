#!/usr/bin/env bash
set -euo pipefail

. .buildkite/scripts/setup-bun.sh

if [ "${BUILDKITE_PULL_REQUEST:-false}" != "false" ]; then
  STAGE="pr-${BUILDKITE_PULL_REQUEST}"
  export PULL_REQUEST="$BUILDKITE_PULL_REQUEST"
elif [ "${BUILDKITE_BRANCH:-}" = "main" ]; then
  STAGE="prod"
  unset PULL_REQUEST || true
else
  STAGE="${BUILDKITE_BRANCH:-dev}"
  STAGE="$(printf '%s' "$STAGE" | tr '/[:upper:]' '-[:lower:]' | tr -cd 'a-z0-9._-')"
  unset PULL_REQUEST || true
fi

if [ "$STAGE" = "prod" ] && [ "${BUILDKITE_BRANCH:-}" != "main" ]; then
  echo "Refusing to deploy prod from branch ${BUILDKITE_BRANCH:-unknown}" >&2
  exit 1
fi

export GITHUB_SHA="${BUILDKITE_COMMIT:-}"

echo "Stage: $STAGE"
echo "Commit: ${GITHUB_SHA:-unknown}"

echo "~~~ :package: Installing dependencies"
bun install --frozen-lockfile

echo "~~~ :rocket: Alchemy deploy"
bun alchemy deploy --stage "$STAGE"
