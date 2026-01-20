# Manifest I/O Bottleneck - Per-Entity Saves

**Status:** completed
**Priority:** P2
**Tags:** performance, io, optimization
**Effort:** Small

## Problem Statement

Manifest is saved to disk after every entity extraction (teams, players, goalies, standings, schedule). For a full extraction with 5 entities per season across 20+ seasons, this results in 100+ unnecessary disk writes when a single save per season would suffice.

## Findings

- **Source:** performance-oracle
- **Evidence:**
  - `extractSeason` calls `manifestService.save(manifest)` after each entity
  - Pattern repeated in all 5 extractors
  - Example from `nll.extractor.ts:207-214`:
    ```typescript
    manifest = manifestService.markComplete(...);
    yield* manifestService.save(manifest);  // Save after teams
    // ... extract players
    yield* manifestService.save(manifest);  // Save after players
    // ... repeats for each entity
    ```
- **Affected files:**
  - `src/extract/nll/nll.extractor.ts`
  - `src/extract/pll/pll.extractor.ts`
  - `src/extract/mll/mll.extractor.ts`
  - `src/extract/msl/msl.extractor.ts`
  - `src/extract/wla/wla.extractor.ts`

## Proposed Solutions

### Option A: Save Once at End of Season
**Pros:** Simplest fix, 80% I/O reduction
**Cons:** Loses partial progress on crash mid-season
**Effort:** Small
**Risk:** Low

```typescript
// Move single save to end of extractSeason
if (shouldExtract("teams")) {
  const result = yield* extractTeams(seasonId);
  manifest = manifestService.markComplete(manifest, ...);
  // Remove: yield* manifestService.save(manifest);
}
// ... other entities
yield* manifestService.save(manifest);  // Single save at end
```

### Option B: Debounced/Batched Save
**Pros:** Crash recovery + reduced I/O
**Cons:** More complex
**Effort:** Medium
**Risk:** Low

### Option C: Keep Current (Accept Trade-off)
**Pros:** Maximum crash recovery granularity
**Cons:** Unnecessary I/O overhead
**Effort:** None
**Risk:** None

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [x] Manifest saved at most once per season extraction
- [x] All existing tests pass
- [x] Extraction behavior unchanged

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |
| 2026-01-21 | Completed | Implemented Option A - save once at end of season in all 5 extractors |

## Resources

- PR #99: feat/pipeline-incremental-cli
