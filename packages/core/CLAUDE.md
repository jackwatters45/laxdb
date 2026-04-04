# @laxdb/core - Business Logic & Database

> **When to read:** Domain logic, services, repos, DB schemas, Effect patterns.

Effect-TS services, Drizzle ORM schemas, domain logic for lacrosse management.

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

## ENUM STRATEGY

Use **text columns in PG** + **`Schema.Literal` unions in Effect** for enumerated values. No Postgres enums.

- **Why:** PG enums require migrations to add/remove values (`ALTER TYPE`). Removing values is especially painful. Text + schema validation lets us evolve values with a code change, no migration.
- **Pattern:** Define `Schema.Literal` in `{domain}.schema.ts`, use as text column in `{domain}.sql.ts`
- **Example:** `drill.schema.ts` — `Difficulty`, `Category`, `PositionGroup`, `Intensity`, `FieldSpace`

## ANTI-PATTERNS

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| `Effect.catchAll` | Loses error type info | `Effect.catchTag` |
| Skip `decodeArguments` | Input not validated | Always validate first |
| Import from `drizzle-kit` | Wrong package | Use `drizzle-orm` |
| Direct pool access | Bypasses layer | Use DrizzleService |
| Import from `effect/internal` | Unstable APIs | Use public exports |
| `getTableColumns` | Deprecated in Drizzle | Use `getColumns` from `drizzle-orm` |

## CRITICAL NOTES

- **Effect Schema**: Uses `Schema.Class<T>("Name")({...})` pattern, NOT Zod
- **PlanetScale**: PostgreSQL mode, not MySQL - use pg syntax
- **Layer wiring lives with each package**: Services expose their own layers (for example `PlayerService.layer`) and are composed at the API boundary.
- **Config**: Use `AppConfig` for env vars, secrets use `Config.redacted()`

## CHILD INTENT NODES

Only complex subsystems have dedicated Intent Nodes. Other domains (organization, team, player, game, season, feedback, email, user) follow the standard per-domain file pattern above and don't need separate documentation.

- `src/drizzle/CLAUDE.md` - Database connection, Hyperdrive/PlanetScale specifics
