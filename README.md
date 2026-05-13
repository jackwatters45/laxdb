# laxdb

laxdb is a suite of management tools designed specifically for lacrosse teams and clubs. It provides a comprehensive platform for handling team operations, organization management, and player coordination.

## Tech Stack

- Runtime: Bun
- Language: TypeScript with Effect-TS
- Infrastructure: Cloudflare Workers via Alchemy (TypeScript IaC)
- Database: Cloudflare D1 (SQLite) with Drizzle ORM
- Authentication: better-auth with organization and team support
- Frontend: TanStack Start (Practice Planner, Marketing Site)
- Monorepo Management: Bun Workspaces and Turborepo

## Project Structure

- `packages/api`: Effect-based HTTP API with RPC support
- `packages/core`: Shared business logic, database schemas, and core services
- `packages/cli`: RPC-driven developer CLI
- `packages/docs`: Documentation site built with Fumadocs
- `packages/marketing`: Marketing website built with TanStack Start
- `packages/pipeline`: Effect-based web scraping and HTML parsing pipeline
- `packages/practice-planner`: Practice planning app built with TanStack Start
- `packages/ui`: Shared UI component library built with shadcn/ui (Base UI)

## Getting Started

### Prerequisites

- Bun runtime
- Cloudflare account access

### Environment Setup

This project uses [Infisical](https://app.infisical.com) for secrets management.

```bash
# Login to Infisical (opens browser)
infisical login

# Initialize project config (one-time)
infisical init

# Run commands with secrets injected
infisical run --env=dev -- bun run dev
```

See [docs/infisical/cli.md](docs/infisical/cli.md) for more details.

### Installation

```bash
bun install
```

## Available Scripts

- `bun run dev`: Starts the local development environment for all packages
- `bun run deploy`: Deploys the infrastructure and applications to Cloudflare using Alchemy
- `bun run destroy`: Tears down all deployed infrastructure
- `bun run typecheck`: Runs TypeScript compiler checks across the monorepo
- `bun run fix`: Runs linting and formatting tools to ensure code quality

## Infrastructure

The project uses an Alchemy v2 stack in `alchemy.run.ts` to define and manage Cloudflare resources:

- Compute: Cloudflare Workers and Vite/TanStack Start sites
- Database: Cloudflare D1 with migrations managed by Alchemy
- Storage: Cloudflare R2 buckets
- Cache: Cloudflare KV namespaces
- State: Cloudflare-managed Alchemy state store
- Deployment Stages: Production (laxdb.io), Development (dev.laxdb.io), and PR previews
