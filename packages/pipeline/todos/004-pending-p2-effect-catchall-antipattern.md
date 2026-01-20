# Effect.catchAll Anti-Pattern in Manifests

**Status:** pending
**Priority:** P2
**Tags:** architecture, effect-ts, error-handling
**Effort:** Small

## Problem Statement

Manifest services use `Effect.catchAll` which swallows all typed errors. Per project CLAUDE.md, this is an anti-pattern - `Effect.catchTag` should be used to handle specific error types while preserving type safety.

## Findings

- **Source:** pattern-recognition-specialist
- **Evidence:**
  - Manifest load uses `Effect.catchAll(() => Effect.succeed(emptyManifest))`
  - This swallows ALL errors including unexpected ones
  - Violates project rule: "Effect.catchAll → Swallows typed errors → Do Instead: Effect.catchTag"
- **Affected files:**
  - `src/extract/nll/nll.manifest.ts`
  - `src/extract/pll/pll.manifest.ts`
  - `src/extract/mll/mll.manifest.ts`
  - `src/extract/msl/msl.manifest.ts`
  - `src/extract/wla/wla.manifest.ts`

## Proposed Solutions

### Option A: Use Effect.catchTag for Specific Errors
**Pros:** Type-safe, follows project conventions
**Cons:** Requires identifying expected error tags
**Effort:** Small
**Risk:** Low

```typescript
// Before
yield* fs.readFileString(manifestPath).pipe(
  Effect.catchAll(() => Effect.succeed("{}"))
);

// After
yield* fs.readFileString(manifestPath).pipe(
  Effect.catchTag("SystemError", (e) =>
    e.reason === "NotFound"
      ? Effect.succeed("{}")
      : Effect.fail(e)
  )
);
```

### Option B: Use Option.getOrElse Pattern
**Pros:** More explicit about optional nature
**Cons:** Different pattern than rest of codebase
**Effort:** Small
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] No `Effect.catchAll` in manifest services
- [ ] Only expected errors (NotFound) handled silently
- [ ] Unexpected errors propagate up
- [ ] All tests pass

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
- Project CLAUDE.md anti-patterns section
