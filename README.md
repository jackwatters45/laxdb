# laxdb

laxdb is a suite of management tools designed specifically for lacrosse teams and clubs. It provides a comprehensive platform for handling team operations, organization management, and player coordination.

## Tech Stack

- Runtime: Bun
- Language: TypeScript with Effect-TS
- Infrastructure: Cloudflare Workers via Alchemy (TypeScript IaC)
- Database: PlanetScale (PostgreSQL) with Drizzle ORM
- Authentication: better-auth with organization and team support
- Frontend: TanStack Start (Web App), Next.js (Marketing Site)
- Monorepo Management: Bun Workspaces and Turborepo

## Project Structure

- `packages/api`: Effect-based HTTP API with RPC support
- `packages/core`: Shared business logic, database schemas, and core services
- `packages/web`: Main web application built with TanStack Start, deployed on Cloudflare Workers
- `packages/marketing`: Marketing website built with Next.js
- `packages/effect-cloudflare`: Effect-TS bindings for Cloudflare primitives (KV, R2, D1, etc.)
- `packages/scripts`: Internal utility and maintenance scripts

## Getting Started

### Prerequisites

- Bun runtime
- Cloudflare account with Wrangler CLI configured
- PlanetScale database instance

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

The project uses `alchemy.run.ts` to define and manage Cloudflare resources:

- Compute: Cloudflare Workers
- Database Connectivity: PlanetScale via Hyperdrive connection pooling
- Storage: Cloudflare R2 buckets
- Cache: Cloudflare KV namespaces
- Deployment Stages: Production (laxdb.io), Development (dev.laxdb.io), and PR previews
