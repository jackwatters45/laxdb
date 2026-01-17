# laxdb - Lacrosse Team/Club Management Platform

> **When to read:** First file for any laxdb task. Architecture overview, package routing, global constraints.

Bun monorepo. Effect-TS backend, TanStack Start frontend, Cloudflare Workers via Alchemy IaC, PlanetScale PostgreSQL.

## MUST KNOW

- **Type safety is non-negotiable**: No `any`, no `!`, no `as Type`
- **Effect patterns are strict**: See `packages/core/AGENTS.md` for mandatory patterns
- **Base UI not Radix**: UI components use Base UI - APIs differ significantly
- **Infisical for secrets**: `infisical run --env=dev --` prefix for local dev

## ARCHITECTURE OVERVIEW

```
User Request → TanStack Start (web) → Effect RPC (api) → Effect Services (core) → Drizzle → PlanetScale
                     ↓
              Cloudflare Workers (all apps deployed here)
```

**Data flow**: Frontend queries hit `packages/api` which calls `packages/core` services. Services use repos for DB access. All Effect-based with typed errors.

## PACKAGE MAP

| Package              | Purpose                                     | Key Files                    |
| -------------------- | ------------------------------------------- | ---------------------------- |
| `packages/core`      | Business logic, DB schemas, domain services | `AGENTS.md` has full details |
| `packages/api`       | Effect RPC + REST API (CF Worker)           | `AGENTS.md` has patterns     |
| `packages/web`       | TanStack Start app (main frontend)          | `AGENTS.md` has routing      |
| `packages/ui`        | shadcn/Base UI components                   | `AGENTS.md` has API diffs    |
| `packages/marketing` | Marketing site                              | `AGENTS.md`                  |
| `packages/docs`      | Fumadocs documentation                      | `AGENTS.md`                  |
| `packages/pipeline`  | Data ingestion (PLL API, scraping)          | `AGENTS.md` has API guide    |

## COMMON TASKS

| Task                  | Package | Pattern                                                    |
| --------------------- | ------- | ---------------------------------------------------------- |
| Add domain entity     | `core`  | schema.ts → {domain}.sql.ts → repo → service → contract    |
| Add API endpoint      | `api`   | {domain}.rpc.ts → {domain}.api.ts → {domain}.client.ts     |
| Add frontend route    | `web`   | `src/routes/_protected/...` (file-based)                   |
| Add UI component      | `ui`    | `bunx --bun shadcn@latest add <component>`                 |
| Modify DB schema      | `core`  | Edit sql.ts → `bun run db:generate` → `bun run db:migrate` |
| Deploy infrastructure | root    | `bun run deploy` (runs alchemy.run.ts)                     |

## ANTI-PATTERNS (BLOCKING)

| Pattern                    | Why Bad                | Do Instead             |
| -------------------------- | ---------------------- | ---------------------- |
| `Effect.catchAll`          | Swallows typed errors  | `Effect.catchTag`      |
| `as any` / `@ts-ignore`    | Defeats type safety    | Fix the types          |
| Direct DB in routes        | Bypasses service layer | service → repo         |
| `useState` for server data | Missing cache/sync     | TanStack Query         |
| Radix API patterns         | We use Base UI         | Check component source |

## COMMANDS

```bash
# Development
bun run dev                     # All packages via Alchemy
infisical run --env=dev -- bun run dev  # With secrets

# Database (in packages/core)
bun run db:generate             # Generate migrations
bun run db:migrate              # Apply migrations
bun run db:studio               # Drizzle Studio

# Quality
bun run typecheck               # TypeScript check (tsgo --build)
bun run lint                    # Lint only (oxlint)
bun run format                  # Format only (oxfmt)
bun run fix                     # Lint + format combined

# Deployment
bun run deploy                  # Deploy via Alchemy
bun run destroy                 # Tear down
```

## INFRASTRUCTURE

Managed via `alchemy.run.ts`:

- **Compute**: Cloudflare Workers (web, marketing, docs)
- **Database**: PlanetScale PostgreSQL via Hyperdrive connection pooling
- **Storage**: R2 buckets
- **Cache**: KV namespaces
- **Stages**: prod (laxdb.io), dev (dev.laxdb.io), PR previews

## REFERENCE DOCS

External documentation in `references/`:

- `references/effect-ts/` - Effect patterns
- `references/better-auth.txt` - Auth patterns
- `references/tanstack-router.txt` - Router docs
- `references/ALCHEMY.md` - Alchemy IaC patterns
- `references/infisical/` - Secrets management

For Alchemy patterns, run `effect-solutions list` or check `~/.local/share/alchemy`

## CHILD INTENT NODES

- `packages/core/AGENTS.md` - Domain logic, services, DB (CRITICAL - read first for backend work)
- `packages/api/AGENTS.md` - RPC/HTTP API patterns
- `packages/web/AGENTS.md` - Frontend routing, components
- `packages/ui/AGENTS.md` - Base UI component APIs
- `packages/pipeline/AGENTS.md` - Data ingestion, external APIs
