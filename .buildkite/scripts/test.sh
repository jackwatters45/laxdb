#!/usr/bin/env bash
set -euo pipefail

. .buildkite/scripts/setup-bun.sh

echo "~~~ :database: Starting test database"
docker compose -f docker-compose.test.yml up -d

for _ in {1..30}; do
  if docker compose -f docker-compose.test.yml exec -T test-db pg_isready -U test -d laxdb_test >/dev/null 2>&1; then
    break
  fi
  echo "Waiting for Postgres..."
  sleep 1
done

cleanup() {
  echo "~~~ :database: Stopping test database"
  docker compose -f docker-compose.test.yml down || true
}
trap cleanup EXIT

echo "~~~ :package: Installing dependencies"
bun install --frozen-lockfile

echo "~~~ :test_tube: Running tests"
export TEST_DATABASE_URL="postgres://test:test@localhost:5433/laxdb_test"
bun run test
