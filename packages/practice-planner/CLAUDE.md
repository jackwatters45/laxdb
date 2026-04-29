# practice-planner

> Visual practice planning tool for lacrosse coaches. Standalone Cloudflare Worker deployed to planner.laxdb.io.

## Deployment

Cloudflare Workers via the Alchemy v2 stack. Do NOT use `wrangler` for deploys or local dev — Alchemy handles all builds, bindings, and dev server orchestration. The Wrangler CLI can still be used for ad-hoc inspection.

## Data Fetching

This app does NOT need SEO. If data isn't visible on first paint, fetch it client-side.

### Server-side (blocks page render)

Use route loaders for data the user sees immediately:

```tsx
const listPractices = createServerFn({ method: "GET" }).handler(() =>
  runApi(Effect.gen(function* () {
    const client = yield* RpcApiClient;
    return yield* client.PracticeList();
  })),
);

export const Route = createFileRoute("/")({
  loader: () => listPractices(),
});

// In component:
const practices = Route.useLoaderData();
```

### Client-side (non-blocking, cached)

Use `useQuery` with the same `createServerFn` pattern for data that loads after the page renders. The server function still executes on the server — `useQuery` just calls it from the client without blocking SSR.

```tsx
const loadDrills = createServerFn({ method: "GET" }).handler(() =>
  runApi(Effect.gen(function* () {
    const client = yield* RpcApiClient;
    return yield* client.DrillList();
  })),
);

// In component:
const { data: drills = [] } = useQuery({
  queryKey: ["drills"],
  queryFn: () => loadDrills(),
});
```

### When to use which

| Pattern | When |
|---------|------|
| Route loader | Data visible on first paint |
| `useQuery` + `createServerFn` | Data behind interaction, cacheable across navigations |
| Mutation + navigate | Create/update then redirect |

### `runApi` boundary

All RPC calls go through `runApi()` in `lib/api.ts`, which must only be called inside `createServerFn` handlers — never from client components. `runApi` manages a `ManagedRuntime` singleton, uses NDJSON serialization matching the api server, and JSON round-trips results to strip Effect `Schema.Class` instances (seroval can't serialize them).

## RPC Client

Uses a single `RpcApiClient` backed by the merged `LaxdbRpcV2` group. All domains (drills, practices, players) are on one client. Do NOT create per-group clients — Effect's `withRun` semaphore only allows one active `run` callback per Protocol; multiple `RpcClient.make` calls sharing one Protocol will deadlock.

## Composability

Prefer context providers over prop drilling. Data that multiple components need (e.g. drills) should be loaded once and provided via context with a `useFoo()` hook. Components consume from context — they don't receive data as props through intermediate layers.

## Types

Scalar types (`Difficulty`, `DrillCategory`, `PracticeItemType`, etc.) are derived from `core` schemas via `Schema.Schema.Type<>` — never duplicated. The `Drill` type is derived directly from the DB schema class. `PracticeGraph` is the frontend canvas model (nodes + edges) — intentionally named differently from the DB `Practice` to avoid confusion.

## Anti-patterns

| Don't | Do instead |
|-------|------------|
| Create per-group RPC clients | Single `RpcApiClient` |
| Call `runApi()` from client components | Wrap in `createServerFn` |
| Duplicate types from core | Derive via `Schema.Schema.Type<>` |
| Pass shared data as props through layers | Context provider + hook |
| Block SSR with data not on first paint | `useQuery` for deferred data |
| Use `Practice` for the canvas model | `PracticeGraph` (avoids DB collision) |

## Key Constraints

- **No duplicate deps**: Utilities (`cn`, `clsx`, `tailwind-merge`) come from `@laxdb/ui`.
- **Icon version alignment**: `lucide-react` version must match `@laxdb/ui`.
- **CSS tokens**: `@import "@laxdb/ui/globals.css"` in `globals.css`.
- **Route tree**: `routeTree.gen.ts` is auto-generated. Never edit manually, always commit changes.
- **Backend**: All data access through `core` + `api`. Never use v1 packages.
