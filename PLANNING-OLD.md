# Fines App - Planning Document

## Overview

A web application for tracking player fines on a men's lacrosse team.

**Project Goal:** Experiment with Alchemy + Cloudflare stack. Will eventually merge with existing repo.

## Tech Stack

- **Frontend**: TanStack Start (React 19), Tailwind v4, Effect Atom + AtomRpc
- **Backend**: Effect RPC handlers → Effect services
- **Database**: Cloudflare D1 (SQLite) via Drizzle
- **Auth**: Better Auth (organizations schema exists, UI deprioritized)
- **Infrastructure**: Alchemy
- **Hosting**: Cloudflare Workers

> **Note:** Using Effect Atom with AtomRpc for end-to-end type-safe client/server communication. Backup option: server functions with `Effect.promise()` wrapper. This diverges from laxdb (which has Atom set up but uses TanStack Query). Goal is to validate Effect Atom in production.

## Architecture

### Primary: AtomRpc (End-to-End Type Safety)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  - PlayerApi.query("list") / PlayerApi.mutation("create")│
│  - Reactivity for cache invalidation                    │
│  - Minimal UI (functional, not polished)                │
└─────────────────┬───────────────────────────────────────┘
                  │ RPC calls (type-safe, no tryPromise)
┌─────────────────▼───────────────────────────────────────┐
│  RPC Layer (Effect RPC)                                 │
│  - Shared contracts: PlayerRpc, FineRpc (Schema defs)   │
│  - HTTP transport via Effect Platform                   │
│  - Server handlers consume Effect services              │
└─────────────────┬───────────────────────────────────────┘
                  │ yields
┌─────────────────▼───────────────────────────────────────┐
│  Effect Services (packages/core)                        │
│  - Service layer: business logic                        │
│  - Repo layer: Drizzle queries                          │
│  - Custom errors: Schema.TaggedError                    │
└─────────────────┬───────────────────────────────────────┘
                  │ queries
┌─────────────────▼───────────────────────────────────────┐
│  Cloudflare D1 (SQLite via Drizzle)                     │
└─────────────────────────────────────────────────────────┘
```

### Backup: Server Functions + Effect.promise

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│  - Atom.make(Effect.promise(() => serverFn()))          │
│  - Atom.withReactivity(["key"]) for invalidation        │
│  - runtimeAtom.fn(..., { reactivityKeys: ["key"] })     │
└─────────────────┬───────────────────────────────────────┘
                  │ calls
┌─────────────────▼───────────────────────────────────────┐
│  Server Functions (TanStack Start)                      │
│  - createServerFn() with middleware                     │
│  - RuntimeServer.runPromise() to execute Effect         │
└─────────────────┬───────────────────────────────────────┘
                  │ runs
┌─────────────────▼───────────────────────────────────────┐
│  Effect Services (packages/core)                        │
└─────────────────────────────────────────────────────────┘
```

## Effect Patterns (from laxdb)

### Service Structure

```typescript
// player.service.ts
export class PlayerService extends Effect.Service<PlayerService>()(
  "PlayerService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* PlayerRepo;

      return {
        create: (input) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(CreatePlayerInput)(input);
            return yield* repo.create(validated);
          }),
      } as const;
    }),
    dependencies: [PlayerRepo.Default],
  },
) {}
```

### Repository Structure

```typescript
// player.repo.ts
export class PlayerRepo extends Effect.Service<PlayerRepo>()("PlayerRepo", {
  effect: Effect.gen(function* () {
    const db = yield* DrizzleService;

    return {
      create: (input) => db.insert(players).values(input).returning(),
      list: (orgId) =>
        db.select().from(players).where(eq(players.organizationId, orgId)),
    } as const;
  }),
  dependencies: [DrizzleService.Default],
}) {}
```

### Error Structure

```typescript
// player.error.ts
export class PlayerNotFoundError extends Schema.TaggedError<PlayerNotFoundError>(
  "PlayerNotFoundError",
)("PlayerNotFoundError", {
  message: Schema.String,
  playerId: Schema.String,
  code: Schema.optionalWith(Schema.Number, { default: () => 404 }),
}) {}
```

### RPC Handler Structure (Primary)

```typescript
// api/player/player.handlers.ts
import { RpcHandler } from "@effect/rpc";
import { PlayerRpc } from "@fines/core/player";

export const PlayerHandlers = RpcHandler.make(PlayerRpc, {
  list: Effect.gen(function* () {
    const playerService = yield* PlayerService;
    return yield* playerService.list();
  }),

  create: (input) =>
    Effect.gen(function* () {
      const playerService = yield* PlayerService;
      return yield* playerService.create(input);
    }),
});
```

### Server Function Structure (Backup)

```typescript
// query/players.ts
export const getPlayers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const playerService = yield* PlayerService;
        return yield* playerService.list(context.orgId);
      }),
    ),
  );
```

### File Naming Convention

```
packages/core/src/
├── player/
│   ├── player.service.ts    # Business logic
│   ├── player.repo.ts       # Data access
│   ├── player.error.ts      # Custom errors
│   ├── player.schema.ts     # Effect schemas (validation)
│   ├── player.rpc.ts        # RPC contract (shared)
│   └── index.ts             # Barrel export
├── fine/
│   ├── fine.service.ts
│   ├── fine.repo.ts
│   ├── fine.error.ts
│   ├── fine.schema.ts
│   ├── fine.rpc.ts
│   └── index.ts
└── runtime.server.ts        # ManagedRuntime with all services

packages/api/src/            # RPC layer (optional separate package)
├── player/
│   ├── player.handlers.ts   # RPC handlers (call services)
│   └── player.client.ts     # AtomRpc client
├── router.ts                # Combined RPC router
└── client.ts                # Combined client exports

packages/web/src/
├── lib/
│   └── runtime.atom.ts      # RuntimeAtom setup (for backup pattern)
├── rpc/
│   └── client.ts            # Import from packages/api
└── ...
```

## Effect Atom Patterns

### Primary: AtomRpc

```typescript
// contracts/player.rpc.ts (shared)
import { Rpc, RpcGroup } from "@effect/rpc";

export const PlayerRpc = RpcGroup.make("players", {
  list: Rpc.effect({ success: Schema.Array(Player) }),
  create: Rpc.effect({ payload: CreatePlayerInput, success: Player }),
  update: Rpc.effect({ payload: UpdatePlayerInput, success: Player }),
});

// client/player.api.ts
import { AtomRpc } from "@effect-atom/atom";

export class PlayerApi extends AtomRpc.Tag<PlayerApi>()("PlayerApi", {
  group: PlayerRpc,
  // HTTP client layer
}) {}

// Usage in components
const playersAtom = PlayerApi.query("list", void 0, {
  reactivityKeys: ["players"],
});

const createPlayerMutation = PlayerApi.mutation("create", {
  reactivityKeys: ["players"],  // Auto-invalidates playersAtom
});

function PlayerList() {
  const players = useAtomSuspense(playersAtom);
  const createPlayer = useAtomSet(createPlayerMutation);

  return (
    <button onClick={() => createPlayer({ payload: { name: "New" } })}>
      Add Player
    </button>
  );
}
```

### Backup: Server Functions + Effect.promise

```typescript
// lib/runtime.atom.ts
import { Atom } from "@effect-atom/atom-react";

const runtimeAtom = Atom.runtime(Layer.empty);

// Query atom with reactivity
const playersAtom = Atom.make(Effect.promise(() => getPlayersServerFn())).pipe(
  Atom.withReactivity(["players"]),
);

// Mutation with reactivity invalidation
const createPlayerAtom = runtimeAtom.fn(
  Effect.fnUntraced(function* (input: CreatePlayerInput) {
    return yield* Effect.promise(() => createPlayerServerFn({ data: input }));
  }),
  { reactivityKeys: ["players"] }, // Auto-refreshes playersAtom
);

// Usage
function PlayerList() {
  const players = useAtomValue(playersAtom);
  const createPlayer = useAtomSet(createPlayerAtom);
  // ...
}
```

### Derived Atoms

```typescript
// atoms/leaderboard.atom.ts
export const leaderboardAtom = Atom.readable((get) => {
  const playersResult = get(playersAtom);
  const finesResult = get(finesAtom);

  // Handle Result types
  if (playersResult._tag !== "Success" || finesResult._tag !== "Success") {
    return playersResult; // Propagate loading/error
  }

  const players = playersResult.value;
  const fines = finesResult.value;

  return Result.success(
    players
      .map((p) => ({
        ...p,
        totalOwed: fines
          .filter((f) => f.playerId === p.id && f.status === "pending")
          .reduce((sum, f) => sum + f.amount, 0),
      }))
      .sort((a, b) => b.totalOwed - a.totalOwed),
  );
});
```

## Scope

### In Scope (Experiment MVP)

| Feature         | Description                                   |
| --------------- | --------------------------------------------- |
| **Auth**        | Login/register working E2E                    |
| **Players**     | CRUD (create, list, update, deactivate)       |
| **Fines**       | Issue fine, list fines, mark as paid          |
| **Leaderboard** | Who owes most, total collected vs outstanding |

### Out of Scope (Deprioritized)

- Organizations UI (schema exists, ignore for now)
- Fine presets
- Audit logging
- Layout/navigation polish
- Mobile responsiveness
- Loading/error/empty states polish

## Data Model

Schema already exists in `packages/core/src/drizzle/schema.ts`.

**Using for MVP:**

- `user`, `session`, `account` (Better Auth)
- `players` (team members)
- `fines` (issued fines)

**Exists but deprioritized:**

- `organization`, `member`, `invitation` (orgs)
- `finePresets`, `auditLogs`

## Development Phases

### Phase 1: Foundation ✅

- [x] Project setup (Alchemy, TanStack Start, Tailwind)
- [x] Database setup (Drizzle, D1)
- [x] Better Auth setup
- [x] Schema (players, fines, etc.)

### Phase 2: Effect Infrastructure

- [ ] DrizzleService (D1 integration with Effect)
- [ ] RuntimeServer (ManagedRuntime with layers)
- [ ] RPC router setup (Effect RPC + HTTP)
- [ ] AtomRpc client setup
- [ ] Auth middleware

### Phase 3: Player Domain

- [ ] PlayerRepo (Drizzle queries)
- [ ] PlayerService (business logic)
- [ ] Player errors + schemas
- [ ] PlayerRpc contract
- [ ] Player RPC handlers
- [ ] PlayerApi (AtomRpc client)
- [ ] Simple UI (list + form)

### Phase 4: Fine Domain

- [ ] FineRepo (Drizzle queries)
- [ ] FineService (issue, mark paid, update balance)
- [ ] Fine errors + schemas
- [ ] FineRpc contract + handlers
- [ ] FineApi (AtomRpc client)
- [ ] Simple UI (list + issue form)

### Phase 5: Leaderboard

- [ ] LeaderboardService (aggregations: totals, rankings)
- [ ] LeaderboardRpc + handlers
- [ ] Leaderboard UI (home page)

## Routes (Simplified)

| Route          | Purpose            |
| -------------- | ------------------ |
| `/login`       | Sign in            |
| `/register`    | Create account     |
| `/`            | Leaderboard (home) |
| `/players`     | Player list        |
| `/players/new` | Add player         |
| `/fines`       | Fine list          |
| `/fines/new`   | Issue fine         |

## Success Criteria

1. Can deploy to Cloudflare via Alchemy
2. D1 database operations work (read/write)
3. Effect services run in Workers environment
4. AtomRpc client/server communication works E2E
5. Reactivity invalidation works (mutations refresh queries)
6. Basic CRUD flows work E2E
