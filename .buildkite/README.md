# Buildkite migration

This directory replaces the repo's GitHub Actions CI/deploy/release workflows with Buildkite.

## 1. Create the Buildkite pipeline

In Buildkite:

1. Connect the GitHub App to `jackwatters45/laxdb`.
2. Create a pipeline for this repository.
3. Use Buildkite hosted Linux agents, or your own self-hosted agent.
4. In the pipeline YAML editor, keep only the upload step:

```yaml
steps:
  - label: ":pipeline: Upload pipeline"
    command: buildkite-agent pipeline upload
```

Buildkite will then load `.buildkite/pipeline.yml` from this repo.

## 2. GitHub trigger settings

In the pipeline's GitHub settings, enable:

- Build branches: limit to `main`
- Build pull requests: opened, synchronize, reopened
- Build tags: enabled, so `v*` tags can create releases
- Update commit statuses/checks: enabled

Disable third-party fork PR builds for deploy safety unless you add a separate no-secrets pipeline for forks.

## 3. Secrets

Create these Buildkite secrets in the cluster used by the pipeline:

```text
ALCHEMY_PASSWORD
ALCHEMY_STATE_TOKEN
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_EMAIL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
BETTER_AUTH_SECRET
POLAR_WEBHOOK_SECRET
PLANETSCALE_ORGANIZATION
PLANETSCALE_SERVICE_TOKEN
PLANETSCALE_SERVICE_TOKEN_ID
GITHUB_TOKEN
```

`GITHUB_TOKEN` should be a fine-grained GitHub token for this repo with:

- Contents: read/write
- Pull requests: read/write
- Issues: read/write if you keep PR comment automation

## 4. PR preview cleanup

Buildkite's normal GitHub PR trigger does not fire cleanup builds for `pull_request.closed`, so add a pipeline trigger:

1. Buildkite pipeline → Settings → Triggers → New Trigger → GitHub.
2. Branch: `main`
3. Commit: `HEAD`
4. Build message: `GitHub pull request webhook`
5. Environment variables: `LAXDB_TRIGGER=github-pr-webhook`
6. Enable GitHub signature verification and copy the trigger URL.
7. GitHub repo → Settings → Webhooks → Add webhook:
   - Payload URL: the Buildkite trigger URL
   - Content type: `application/json`
   - Secret: same signing secret configured in Buildkite
   - Events: Pull requests (this will fire for all PR events, but cleanup script no-ops unless action is `closed`)

The webhook will create builds for all PR events, but `.buildkite/scripts/cleanup-preview.sh` no-ops unless the payload is `pull_request.closed`.

## 5. Disable old GitHub Actions after Buildkite is green

Once a PR and a main build pass in Buildkite, remove or rename these old workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/release.yml`
- `.github/workflows/git-ai.yaml`

Keep these only if you still want the GitHub-native Claude automation:

- `.github/workflows/claude.yml`
- `.github/workflows/claude-pr.yml`

If you truly want all GitHub Actions disabled, first replace the Claude workflows with a custom Buildkite implementation, then disable Actions in GitHub: Repo → Settings → Actions → General → Disable actions.

## 6. Known regressions

**Path filtering for deploys:** The old `deploy.yml` had `paths-ignore` patterns to skip deploys on documentation-only pushes. The Buildkite pipeline does not have an equivalent filter. Every commit to `main` — including doc changes — will trigger a full 45-minute deploy. This is a known regression; consider documenting it or implementing a file-diff check in the deploy step.

**Test coverage:** The old `ci.yml` included a test job with Postgres 16. The Buildkite pipeline now includes a `:test_tube: Test` step with `docker compose -f docker-compose.test.yml` and `bun run test`. If tests fail, the deploy and release steps will not run (gated by `depends_on`).

**Google OAuth secrets:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are used by the deployed app (Better Auth), but were not found in Infisical. You need to provide these values to create the Buildkite secrets.
