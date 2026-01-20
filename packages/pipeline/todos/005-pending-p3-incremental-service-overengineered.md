# IncrementalExtractionService Over-Engineered

**Status:** pending
**Priority:** P3
**Tags:** simplification, yagni, code-quality
**Effort:** Small

## Problem Statement

`IncrementalExtractionService` is 146 lines but could be ~30 lines of pure functions. It's an Effect Service wrapper around what are essentially stateless utility functions that don't need service injection.

## Findings

- **Source:** code-simplicity-reviewer
- **Evidence:**
  - `src/extract/incremental.service.ts`: 146 lines
  - Core logic: `shouldExtract` and `isStale` are pure functions
  - No actual service dependencies (just uses `SeasonConfigService` which is also a simple lookup)
  - Over-abstraction adds cognitive overhead
- **Affected files:**
  - `src/extract/incremental.service.ts`
  - `src/extract/season-config.ts` (related - also over-engineered)

## Proposed Solutions

### Option A: Convert to Pure Functions
**Pros:** Simpler, no service overhead, easier to test
**Cons:** Changes API for consumers
**Effort:** Small
**Risk:** Low

```typescript
// src/extract/incremental.ts (~30 lines)
export const shouldExtract = (
  status: EntityStatus | null,
  seasonId: number,
  options: ExtractOptions
): boolean => {
  if (options.mode === "full") return true;
  if (!status?.extractedAt) return true;
  if (options.mode === "skip-existing") return false;
  // incremental mode
  const staleMs = isCurrentSeason(seasonId) ? 24 * 60 * 60 * 1000 : Infinity;
  return Date.now() - new Date(status.extractedAt).getTime() > staleMs;
};
```

### Option B: Keep Service, Simplify Implementation
**Pros:** Maintains existing API
**Cons:** Still has unnecessary abstraction
**Effort:** Small
**Risk:** Low

### Option C: Keep As-Is (Accept Trade-off)
**Pros:** No change needed
**Cons:** Continues unnecessary complexity
**Effort:** None
**Risk:** None

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] Functionality unchanged
- [ ] Code reduced by 70%+
- [ ] All tests pass
- [ ] Simpler mental model for contributors

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
