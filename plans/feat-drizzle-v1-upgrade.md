# feat: Upgrade Drizzle ORM to v1

Upgrade from `drizzle-orm@0.44.7` + `drizzle-kit@0.31.8` to `drizzle-orm@1.0` + `drizzle-kit@1.0` (beta).

## Overview

Drizzle v1 brings:
- **Migration folder restructuring**: `journal.json` removed, new folder structure
- **Relational queries v2** (optional): New `defineRelations()` syntax

This project does NOT use Drizzle relations - only direct SQL queries via `@effect/sql-drizzle`. Upgrade is straightforward.

## Problem Statement

Current versions are pre-v1, missing performance improvements and bug fixes in v1 RC.

## Proposed Solution

1. Update package versions
2. Run migration restructure command
3. Verify all queries still work
4. Update drizzle.config.ts if needed

---

## Acceptance Criteria

### Functional Requirements

- [ ] `drizzle-orm` upgraded to `^1.0.0-beta.x`
- [ ] `drizzle-kit` upgraded to `^1.0.0-beta.x`
- [ ] `@effect/sql-drizzle` compatibility verified (may need update)
- [ ] Migration folder restructured via `drizzle-kit up`
- [ ] All existing migrations preserved
- [ ] `bun run db:generate` works
- [ ] `bun run db:migrate` works
- [ ] `bun run db:studio` works

### Quality Gates

- [ ] `bun run typecheck` passes
- [ ] No runtime errors in query patterns

---

## Technical Approach

### Phase 1: Package Updates

**packages/core/package.json**

```json
// Before
"drizzle-orm": "^0.44.7",
"drizzle-kit": "^0.31.8",

// After
"drizzle-orm": "^1.0.0-beta",
"drizzle-kit": "^1.0.0-beta",
```

Check `@effect/sql-drizzle` compatibility:
- Current: `^0.48.0`
- May need update if Effect team released v1 compatible version

### Phase 2: Migration Restructure

```bash
cd packages/core
npx drizzle-kit up
```

This converts:
```
migrations/
├── 0000_heavy_zombie.sql
└── meta/
    ├── _journal.json        # REMOVED
    └── 0000_snapshot.json
```

To new structure (migrations in individual folders).

### Phase 3: Config Updates (if needed)

**drizzle.config.ts** - likely no changes needed, but verify:

```typescript
export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/**/*.sql.ts", ...],
  out: "./migrations",
  // ... rest unchanged
});
```

### Phase 4: Verify Query Patterns

Current query patterns (should work unchanged):

| Pattern | Files | Expected Result |
|---------|-------|-----------------|
| `db.select().from()` | All repos | No change |
| `db.insert().values().returning()` | All repos | No change |
| `db.update().set().where()` | All repos | No change |
| `getTableColumns()` | All repos | No change |
| `and()`, `eq()`, `isNull()`, `inArray()` | All repos | No change |

Effect integration pattern (unchanged):
```typescript
const db = yield* PgDrizzle;
yield* db.select(...)...
```

---

## File Changes

| File | Action |
|------|--------|
| `packages/core/package.json` | Update drizzle-orm, drizzle-kit versions |
| `packages/core/migrations/` | Restructured by `drizzle-kit up` |
| `packages/core/drizzle.config.ts` | Verify (likely unchanged) |

---

## Verification Steps

```bash
# 1. Install updated packages
cd packages/core
bun install

# 2. Run migration restructure
bunx drizzle-kit up

# 3. Verify migration commands
bun run db:generate  # Should work with new structure
bun run db:migrate   # Should work (exit 9 = no changes = OK)
bun run db:studio    # Should launch studio

# 4. Type check
cd ../..
bun run typecheck

# 5. Test database operations (if tests exist)
cd packages/core
bun run test
```

---

## Risk Analysis

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `@effect/sql-drizzle` incompatible | Medium | Check Effect Discord/releases for v1 support |
| Migration restructure fails | Low | Backup `migrations/` folder first |
| Query syntax changed | Very Low | This project doesn't use relations API, only core CRUD |

---

## Rollback Plan

```bash
git checkout main -- packages/core/package.json
git checkout main -- packages/core/migrations/
bun install
```

---

## References

### External
- [Drizzle v1 Upgrade Guide](https://orm.drizzle.team/docs/upgrade-v1)
- [Relations v1 to v2](https://orm.drizzle.team/docs/relations-v1-v2) (N/A - we don't use relations)
- [Drizzle GitHub Releases](https://github.com/drizzle-team/drizzle-orm/releases)

### Internal
- `packages/core/package.json:31,41` - Current drizzle versions
- `packages/core/drizzle.config.ts` - Config
- `packages/core/migrations/meta/_journal.json` - Current journal (will be removed)
- `packages/core/src/drizzle/drizzle.service.ts` - Effect integration
- `packages/core/src/player/player.repo.ts` - Example query patterns
