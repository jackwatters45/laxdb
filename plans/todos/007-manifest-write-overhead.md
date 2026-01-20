---
id: 007-manifest-write-overhead
status: completed
category: performance
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/extract/nll/nll.extractor.ts
  - packages/pipeline/src/extract/pll/pll.extractor.ts
  - packages/pipeline/src/extract/mll/mll.extractor.ts
  - packages/pipeline/src/extract/msl/msl.extractor.ts
  - packages/pipeline/src/extract/wla/wla.extractor.ts
---

# Manifest Write After Every Entity

## Problem

Extractors write manifest after each entity extraction:

```typescript
const result = yield* extractTeams(seasonId);
manifest = manifestService.markComplete(manifest, seasonId, "teams", ...);
yield* manifestService.save(manifest);  // Write to disk

const result = yield* extractPlayers(seasonId);
manifest = manifestService.markComplete(manifest, seasonId, "players", ...);
yield* manifestService.save(manifest);  // Write to disk again
```

This is intentional for crash recovery but adds I/O overhead.

## Assessment

Low severity because:
1. Manifest files are small (~1KB)
2. Extraction is already I/O bound (network requests)
3. Crash recovery is valuable for long extractions

## Recommendation (if desired)

Could batch manifest writes per season instead of per entity:

```typescript
// Extract all entities
const teamsResult = yield* extractTeams(seasonId);
const playersResult = yield* extractPlayers(seasonId);
// ...

// Single manifest write at end
manifest = manifestService.markComplete(manifest, seasonId, "teams", ...);
manifest = manifestService.markComplete(manifest, seasonId, "players", ...);
yield* manifestService.save(manifest);
```

Trade-off: Less granular crash recovery.

## Resolution

**Completed:** 2026-01-21

Implemented the recommended batched approach - manifest now saved once per season at the end of `extractSeason` in all 5 extractors. Duplicate of packages/pipeline/todos/003-pending-p2-manifest-io-bottleneck.md.
