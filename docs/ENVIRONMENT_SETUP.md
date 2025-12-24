# Environment Setup

## Infisical + GitHub Sync

Secrets are managed in [Infisical](https://app.infisical.com) and auto-synced to GitHub Secrets.

```
Infisical  ──sync──►  GitHub Secrets  ──►  deploy.yml
```

Key schema: `{{secretKey}}` (no prefix)

### Local Development

```bash
brew install infisical/get-cli/infisical
infisical login
infisical run --env=dev -- bun run dev
```

---

## Secrets Reference

Add these to Infisical and sync to GitHub:

### Alchemy / Cloudflare

| Variable | How to Get |
|----------|------------|
| `ALCHEMY_PASSWORD` | Generate: `openssl rand -base64 32` |
| `ALCHEMY_STATE_TOKEN` | Run `bunx alchemy setup` |
| `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | CF Dashboard → Account ID in sidebar |
| `CLOUDFLARE_EMAIL` | Your Cloudflare email |

### Authentication

| Variable | How to Get |
|----------|------------|
| `GOOGLE_CLIENT_ID` | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `BETTER_AUTH_SECRET` | Generate: `openssl rand -base64 32` |

### Payments

| Variable | How to Get |
|----------|------------|
| `POLAR_WEBHOOK_SECRET` | [polar.sh/dashboard](https://polar.sh/dashboard) → Webhooks |

---

## Auto-Generated (Don't Set)

- `DATABASE_URL` — from PlanetScale via Alchemy
- `API_URL` — from worker URL via Alchemy
