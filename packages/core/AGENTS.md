# @laxdb/core - Business Logic & Database

Effect-TS services, Drizzle ORM schemas, domain logic for lacrosse management.

## STRUCTURE

```
src/
├── {domain}/           # Domain modules (auth, player, team, etc.)
│   ├── {domain}.schema.ts    # Effect Schema classes (inputs, outputs)
│   ├── {domain}.sql.ts       # Drizzle table definitions
│   ├── {domain}.repo.ts      # DB operations (Effect)
│   ├── {domain}.service.ts   # Business logic (Effect.Service)
│   ├── {domain}.contract.ts  # RPC contract definitions
│   └── {domain}.error.ts     # Domain errors (optional)
├── drizzle/            # Drizzle service + types
├── schema.ts           # ALL table exports (single source of truth)
├── runtime.server.ts   # ManagedRuntime with all services
├── auth.ts             # better-auth instance export
├── config.ts           # Config service
├── error.ts            # Shared error types
├── util.ts             # decodeArguments, parsePostgresError
└── kv.ts               # KV service
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new domain | Create `src/{domain}/` with all 5-6 files |
| Add DB table | `src/schema.ts` (exports) + `src/{domain}/{domain}.sql.ts` |
| Add service method | `src/{domain}/{domain}.service.ts` |
| Add RPC endpoint | `src/{domain}/{domain}.contract.ts` |
| Modify auth | `src/auth/` + `src/auth.ts` |

## CONVENTIONS

### Service Pattern (MANDATORY)

```typescript
export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    const repo = yield* MyRepo;
    return {
      methodName: (input: InputType) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(InputSchema, input);
          return yield* repo.operation(decoded);
        }).pipe(
          Effect.catchTag("SqlError", (e) => Effect.fail(parsePostgresError(e))),
          Effect.tap((result) => Effect.log(`Action completed`)),
          Effect.tapError((e) => Effect.logError("Action failed", e)),
        ),
    };
  }),
  dependencies: [MyRepo.Default],
}) {}
```

### Error Handling

- `Effect.catchTag("SqlError", ...)` - Parse Postgres errors
- `Effect.catchTag("NoSuchElementException", ...)` - Not found
- Custom errors extend `Schema.TaggedError`

### Repo Pattern

```typescript
export class MyRepo extends Effect.Service<MyRepo>()("MyRepo", {
  effect: Effect.gen(function* () {
    const db = yield* DrizzleService;
    return {
      list: (input) => db.pipe(Effect.flatMap((d) => ...)),
    };
  }),
  dependencies: [DrizzleService.Default],
}) {}
```

## ANTI-PATTERNS

- **Direct Effect.catchAll**: Loses error type info, use catchTag
- **Skip decodeArguments**: Always validate inputs first
- **Import from drizzle-kit**: Only import from drizzle-orm
- **Modify schema.ts structure**: Keep flat exports, add tables via domain files

## COMMANDS

```bash
bun run db:generate    # Generate migrations from schema changes
bun run db:migrate     # Apply migrations (exit 9 = no changes, OK)
bun run db:studio      # Open Drizzle Studio
bun run test           # Run vitest
```

## NOTES

- **Effect Schema**: Uses `Schema.Class<T>("Name")({...})` pattern, NOT Zod
- **schema.ts**: Single export point for all tables - import from here
- **runtime.server.ts**: Composes all services - add new services here
- **better-auth**: Uses organization + team plugins, see auth/ directory
- **PlanetScale**: PostgreSQL mode, not MySQL - use pg syntax

### Effect Schema Pattern

```typescript
// Input/output schemas use Schema.Class
export class CreatePlayerInput extends Schema.Class<CreatePlayerInput>(
  "CreatePlayerInput",
)({
  name: Schema.String,
  email: Schema.NullOr(Schema.String),
}) {}

// Errors use Schema.TaggedError
export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  { domain: Schema.String, id: Schema.String },
) {}
```
