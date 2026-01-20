# Duplicate getMode Function in All CLIs

**Status:** pending
**Priority:** P3
**Tags:** duplication, code-quality
**Effort:** Small

## Problem Statement

The `getMode` function that derives extraction mode from CLI flags is duplicated in all 5 run.ts files. This is a simple 4-line function that should be shared.

## Findings

- **Source:** pattern-recognition-specialist
- **Evidence:**
  - Same function in 5 files:
    ```typescript
    const getMode = (force: boolean, incremental: boolean): ExtractionMode => {
      if (force) return "full";
      if (incremental) return "incremental";
      return "skip-existing";
    };
    ```
- **Affected files:**
  - `src/extract/nll/run.ts:41-45`
  - `src/extract/pll/run.ts`
  - `src/extract/mll/run.ts`
  - `src/extract/msl/run.ts`
  - `src/extract/wla/run.ts`

## Proposed Solutions

### Option A: Extract to Shared Module
**Pros:** Single source of truth
**Cons:** One more import
**Effort:** Small
**Risk:** Low

```typescript
// src/extract/cli-utils.ts
export const getMode = (force: boolean, incremental: boolean): ExtractionMode => {
  if (force) return "full";
  if (incremental) return "incremental";
  return "skip-existing";
};

// Also share common CLI options:
export const forceOption = Options.boolean("force").pipe(...);
export const incrementalOption = Options.boolean("incremental").pipe(...);
```

### Option B: Keep Duplication (Accept Trade-off)
**Pros:** No change needed, self-contained files
**Cons:** 5x duplication of same logic
**Effort:** None
**Risk:** None

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] `getMode` defined in single location
- [ ] All CLIs import shared function
- [ ] No behavioral changes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
