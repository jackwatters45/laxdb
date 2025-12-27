# Infisical CLI

Quick reference for managing secrets with the Infisical CLI.

## Setup

```bash
# Login (opens browser)
infisical login

# For containers/WSL/Codespaces (interactive mode)
infisical login -i

# Initialize project (creates .infisical.json)
cd /path/to/project
infisical init
```

## Core Commands

### infisical run

Inject secrets into your application process.

```bash
# Basic usage
infisical run --env=dev -- npm run dev

# With path
infisical run --env=prod --path=/apps/api -- bun start

# Chained commands
infisical run --command="npm run build && npm run start"

# Watch mode (auto-reload on secret changes)
infisical run --watch -- npm run dev
```

**Flags:**
| Flag | Description | Default |
|------|-------------|---------|
| `--env` | Environment slug (`dev`, `staging`, `prod`) | `dev` |
| `--path` | Project folder path | `/` |
| `--projectId` | Project ID (required for machine auth) | - |
| `--watch` | Auto-reload on secret changes | `false` |
| `--expand` | Expand shell parameters in secrets | `true` |
| `--include-imports` | Include imported secrets | `true` |
| `--tags` | Filter by tags (comma-separated) | - |

### infisical export

Export secrets to file formats.

```bash
# Export to .env file
infisical export > .env
infisical export --output-file=./.env

# With export keyword
infisical export --format=dotenv-export > .env

# Export to JSON
infisical export --format=json > secrets.json

# Export to YAML
infisical export --format=yaml > secrets.yaml
```

**Flags:**
| Flag | Description | Default |
|------|-------------|---------|
| `--format` | Output format: `dotenv`, `dotenv-export`, `json`, `yaml`, `csv` | `dotenv` |
| `--output-file` | Output file path | stdout |
| `--env` | Environment slug | `dev` |
| `--path` | Project folder path | `/` |

### infisical secrets

CRUD operations on secrets.

```bash
# List all secrets
infisical secrets

# Get specific secrets
infisical secrets get DOMAIN
infisical secrets get DOMAIN PORT --plain --silent

# Set secrets
infisical secrets set STRIPE_API_KEY=sk_live_xxx DOMAIN=example.com

# Set from file
infisical secrets set CERT=@/path/to/cert.pem

# Set from .env file
infisical secrets set --file="./.env"

# Delete secrets
infisical secrets delete STRIPE_API_KEY DOMAIN
```

**Subcommands:**

- `secrets get <names...>` — Get specific secrets
- `secrets set <key=value...>` — Create/update secrets
- `secrets delete <names...>` — Delete secrets
- `secrets folders get` — List folders
- `secrets folders create --name=folder` — Create folder
- `secrets folders delete --name=folder` — Delete folder

## Machine Identity Auth (CI/CD)

For non-interactive environments (CI/CD, containers):

```bash
# Get access token
export INFISICAL_TOKEN=$(infisical login \
  --method=universal-auth \
  --client-id=<client-id> \
  --client-secret=<client-secret> \
  --silent --plain)

# Now run commands (token auto-detected)
infisical run --projectId=<project-id> -- npm run build
infisical export --projectId=<project-id> --format=dotenv > .env
```

Or pass token directly:

```bash
infisical run --token="<access-token>" --projectId=<project-id> -- npm start
```

## Environment Variables

| Variable                         | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `INFISICAL_TOKEN`                | Machine identity access token                  |
| `INFISICAL_API_URL`              | Custom API URL (for self-hosted/EU)            |
| `INFISICAL_DISABLE_UPDATE_CHECK` | Disable CLI update checks (recommended for CI) |

## Domain Configuration

Default: US Cloud (`https://app.infisical.com`)

```bash
# EU Cloud
export INFISICAL_API_URL="https://eu.infisical.com"

# Self-hosted
export INFISICAL_API_URL="https://your-instance.com"
```

Or use `--domain` flag on each command.

## Project Config (.infisical.json)

Created by `infisical init`. Safe to commit (no secrets).

```json
{
  "workspaceId": "your-workspace-id",
  "defaultEnvironment": "dev",
  "gitBranchToEnvironmentMapping": null
}
```

## Common Patterns

### Local Development

```bash
# One-time setup
infisical login
infisical init

# Daily usage
infisical run --env=dev -- bun run dev
```

### CI/CD Pipeline

```bash
export INFISICAL_TOKEN=$(infisical login \
  --method=universal-auth \
  --client-id=$INFISICAL_CLIENT_ID \
  --client-secret=$INFISICAL_CLIENT_SECRET \
  --silent --plain)
export INFISICAL_DISABLE_UPDATE_CHECK=true

infisical run --projectId=$INFISICAL_PROJECT_ID --env=prod -- npm run deploy
```

### Export for Docker Build

```bash
infisical export --env=prod --format=dotenv > .env
docker build --secret id=env,src=.env .
rm .env
```

## Tips

- Use `--silent` in CI to suppress info messages
- Use `--plain` to get raw secret values for scripting
- Use `INFISICAL_DISABLE_UPDATE_CHECK=true` in CI for faster execution
- Machine identity tokens have limited lifetime — refresh as needed
