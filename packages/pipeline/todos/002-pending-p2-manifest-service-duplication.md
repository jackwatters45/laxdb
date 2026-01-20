# Manifest Service Code Duplication (~900 LOC)

**Status:** pending
**Priority:** P2
**Tags:** architecture, duplication, refactoring
**Effort:** Large

## Problem Statement

5 manifest services (NLL, PLL, MLL, MSL, WLA) are 95% identical, totaling ~900 lines of duplicated code. Each implements the same load/save/getSeasonManifest/markComplete methods with only schema types differing.

## Findings

- **Source:** pattern-recognition-specialist, architecture-strategist, code-simplicity-reviewer
- **Evidence:**
  - `nll.manifest.ts`: 175 lines
  - `pll.manifest.ts`: 200 lines
  - `mll.manifest.ts`: 180 lines
  - `msl.manifest.ts`: 175 lines
  - `wla.manifest.ts`: 175 lines
  - Total: ~905 lines, ~860 duplicated
- **Affected files:**
  - `src/extract/nll/nll.manifest.ts`
  - `src/extract/pll/pll.manifest.ts`
  - `src/extract/mll/mll.manifest.ts`
  - `src/extract/msl/msl.manifest.ts`
  - `src/extract/wla/wla.manifest.ts`

## Proposed Solutions

### Option A: Generic ManifestService Factory
**Pros:** Eliminates 90%+ duplication, type-safe
**Cons:** Requires understanding Effect generics
**Effort:** Medium-Large
**Risk:** Medium

```typescript
// src/extract/manifest.factory.ts
export const createManifestService = <
  TManifest extends BaseManifest,
  TSeasonManifest
>(config: {
  league: string;
  emptySeasonManifest: () => TSeasonManifest;
  schema: Schema.Schema<TManifest>;
}) => Effect.Service<ManifestService<TManifest, TSeasonManifest>>()(...);

// Usage
export const NLLManifestService = createManifestService({
  league: "nll",
  emptySeasonManifest: () => ({ teams: null, players: null, ... }),
  schema: NLLManifestSchema,
});
```

### Option B: Base Class with League-Specific Subclasses
**Pros:** Familiar OOP pattern
**Cons:** Less idiomatic Effect-TS
**Effort:** Medium
**Risk:** Low

### Option C: Keep Separate, Extract Shared Functions
**Pros:** Minimal change, easy to understand
**Cons:** Still some duplication
**Effort:** Small
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] Total manifest code reduced by 80%+
- [ ] All existing tests pass
- [ ] Type safety maintained for league-specific schemas
- [ ] No behavioral changes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
