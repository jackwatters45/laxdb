# @laxdb/core - Business Logic & Database

Effect-TS services, Drizzle ORM schemas, domain logic for lacrosse management.

## STRUCTURE

```
src/
├── auth/               # Auth subsystem (→ src/auth/AGENTS.md)
├── organization/       # Multi-tenant org management
├── team/               # Teams within organizations  
├── player/             # Player profiles + contact-info/
├── game/               # Game scheduling, stats
├── season/             # Season management
├── feedback/           # User feedback system
├── email/              # AWS SES email service
├── user/               # User profiles
├── drizzle/            # Drizzle service + types (→ src/drizzle/AGENTS.md)
├── schema.ts           # Shared validation schemas (see SHARED SCHEMAS)
├── error.ts            # Shared error types (see ERROR HANDLING)
├── runtime.server.ts   # ManagedRuntime with all services
├── auth.ts             # AuthService + exported `auth` instance
├── config.ts           # AppConfig (Effect Config for env vars)
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
| Modify auth/roles | `src/auth/` (→ `src/auth/AGENTS.md`) |
| DB connection issues | `src/drizzle/` (→ `src/drizzle/AGENTS.md`) |

## PER-DOMAIN FILE PATTERN

```
{domain}/
├── {domain}.schema.ts    # Effect Schema classes (inputs, outputs)
├── {domain}.sql.ts       # Drizzle table definitions
├── {domain}.repo.ts      # Database operations (Effect)
├── {domain}.service.ts   # Business logic (Effect.Service)
├── {domain}.contract.ts  # RPC contract definitions
└── {domain}.error.ts     # Domain-specific errors (optional)
```

## SERVICE PATTERN (MANDATORY)

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

## SHARED SCHEMAS (schema.ts)

Common validation schemas used across domains:

| Schema | Purpose |
|--------|---------|
| `NanoidSchema` | 12-char nanoid validation |
| `PublicIdSchema` | `{ publicId: NanoidSchema }` |
| `Base64IdSchema` | 32-char better-auth ID format |
| `TeamIdSchema` | Team ID validation |
| `OrganizationIdSchema` | Org ID validation |
| `TimestampsSchema` | `{ createdAt, updatedAt, deletedAt }` |

## ERROR HANDLING

### Shared Errors (error.ts)

| Error | HTTP | Use For |
|-------|------|---------|
| `NotFoundError` | 404 | Entity not found |
| `ValidationError` | 400 | Input validation failure |
| `DatabaseError` | 500 | DB operation failure |
| `ConstraintViolationError` | 400 | Unique/FK constraint |
| `AuthenticationError` | 401 | Not logged in |
| `AuthorizationError` | 403 | No permission |

### Error Handling Patterns

| Pattern | Use For |
|---------|---------|
| `Effect.catchTag("SqlError", ...)` | Parse Postgres errors via `parsePostgresError` |
| `Effect.catchTag("NoSuchElementException", ...)` | Not found scenarios |
| `Schema.TaggedError` | Custom domain errors |

## SCHEMA PATTERNS

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

## ANTI-PATTERNS

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| `Effect.catchAll` | Loses error type info | `Effect.catchTag` |
| Skip `decodeArguments` | Input not validated | Always validate first |
| Import from `drizzle-kit` | Wrong package | Use `drizzle-orm` |
| Direct pool access | Bypasses layer | Use DrizzleService |
| Import from `effect/internal` | Unstable APIs | Use public exports |

## COMMANDS

```bash
bun run db:generate    # Generate migrations from schema changes
bun run db:migrate     # Apply migrations (exit 9 = no changes, OK)
bun run db:studio      # Open Drizzle Studio
bun run test           # Run vitest
```

## CRITICAL NOTES

- **Effect Schema**: Uses `Schema.Class<T>("Name")({...})` pattern, NOT Zod
- **PlanetScale**: PostgreSQL mode, not MySQL - use pg syntax
- **runtime.server.ts**: Composes all services - add new services here
- **Config**: Use `AppConfig` for env vars, secrets use `Config.redacted()`

## CHILD INTENT NODES

Only complex subsystems have dedicated Intent Nodes. Other domains (organization, team, player, game, season, feedback, email, user) follow the standard per-domain file pattern above and don't need separate documentation.

- `src/auth/AGENTS.md` - Authentication, roles, permissions (better-auth integration is non-trivial)
- `src/drizzle/AGENTS.md` - Database connection, Hyperdrive/PlanetScale specifics
