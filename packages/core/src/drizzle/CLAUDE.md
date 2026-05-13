# Drizzle Database Layer

> **When to read:** DB connection issues, Cloudflare D1 bindings, custom Drizzle types.

Database connection and Drizzle ORM setup for Effect-TS.

## FILES

| File | Purpose |
|------|---------|
| `drizzle.service.ts` | `DatabaseLive` layer, explicit D1 binding service, query helper |
| `drizzle.type.ts` | Shared SQLite column helpers (ids, timestamps) |

## CONNECTION STRATEGY

```
1. Worker entrypoints pass the Cloudflare D1 binding into `DatabaseLiveFromBinding(env.DB)`
2. `DatabaseLive` wraps that explicit binding with `drizzle-orm/d1`
3. Tests provide an in-memory Miniflare D1 database via `TestDatabaseLive`
```

## INVARIANTS

1. **Single DatabaseLive layer**: All services depend on this - never create parallel connections
2. **Cloudflare D1 is SQLite**: use `drizzle-orm/sqlite-core` schemas and SQLite-compatible SQL
3. **No connection URLs or pools**: D1 is a Worker binding, not a TCP database

## CUSTOM TYPES

```typescript
// drizzle.type.ts
export const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" });
```

**Why integer timestamps?** D1 stores SQLite values; Drizzle maps `timestamp_ms` integers to `Date` objects.

## USAGE IN REPOS

```typescript
export class MyRepo extends Effect.Service<MyRepo>()("MyRepo", {
  effect: Effect.gen(function* () {
    const db = yield* DrizzleService;
    return {
      list: () => query(db.select().from(myTable)),
    };
  }),
  dependencies: [DrizzleService.Default],
}) {}
```

## ANTI-PATTERNS

- **Creating direct DB handles**: Always use `DatabaseLiveFromBinding` at Worker boundaries and `DrizzleService` inside services
- **Connection strings or pools**: D1 is bound through Cloudflare, no `pg` pool
- **Non-SQLite syntax**: D1 uses SQLite syntax
