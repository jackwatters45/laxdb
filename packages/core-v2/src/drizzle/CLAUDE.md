# Drizzle Database Layer

> **When to read:** DB connection issues, Hyperdrive config, custom Drizzle types.

Database connection and Drizzle ORM setup for Effect-TS.

## FILES

| File | Purpose |
|------|---------|
| `drizzle.service.ts` | DatabaseLive layer, connection pooling |
| `drizzle.type.ts` | Custom column types (timestamp) |

## CONNECTION STRATEGY

```
1. Try Hyperdrive binding (Cloudflare Workers)
2. Fallback to DATABASE_URL env var (local dev)
```

**Hyperdrive**: Cloudflare's connection pooler. Bindings come from `alchemy.run.ts` as `DB`.

## INVARIANTS

1. **Single DatabaseLive layer**: All services depend on this - never create parallel connections
2. **PlanetScale is PostgreSQL mode**: Use `pg` syntax, not MySQL
3. **SSL differs**: Hyperdrive = no SSL, direct URL = SSL required

## CUSTOM TYPES

```typescript
// drizzle.type.ts
export const timestamp = (name: string) => 
  text(name).$type<Date>()... // Custom timestamp handling
```

**Why custom timestamp?**: PlanetScale returns timestamps as strings. This type handles conversion.

## USAGE IN REPOS

```typescript
export class MyRepo extends Effect.Service<MyRepo>()("MyRepo", {
  effect: Effect.gen(function* () {
    const db = yield* DrizzleService;  // Get db instance
    return {
      list: () => db.pipe(Effect.flatMap((d) => 
        Effect.tryPromise(() => d.select().from(myTable))
      )),
    };
  }),
  dependencies: [DrizzleService.Default],
}) {}
```

## ANTI-PATTERNS

- **Create new PgClient**: Always use DatabaseLive
- **Direct pool access**: Go through DrizzleService
- **MySQL syntax**: We're on PostgreSQL mode
