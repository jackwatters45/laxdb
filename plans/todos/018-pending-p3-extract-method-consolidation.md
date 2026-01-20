---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, refactoring, dry]
dependencies: []
---

# Extract Method Boilerplate Consolidation

## Problem Statement

Every `extractX` method across all 5 extractors follows an identical ~25 line pattern repeated ~25 times. This is approximately 625 lines of near-duplicate code.

**Why it matters:** Code duplication leads to maintenance burden, inconsistent changes, and potential bugs when patterns drift.

## Findings

**Pattern repeated in all extractors:**

```typescript
const extractTeams = (seasonId: number) =>
  Effect.gen(function* () {
    yield* Effect.log(`  📊 Extracting teams for season ${seasonId}...`);
    const result = yield* client.getTeams({ seasonId }).pipe(
      withTiming(),
      withRateLimitRetry(),
      Effect.either,
    );
    if (Either.isLeft(result)) {
      yield* Effect.log(`     ✗ Failed [${result.left._tag}]: ${result.left.message}`);
      if (isCriticalError(result.left)) {
        return yield* Effect.fail(result.left);
      }
      return emptyExtractResult([] as readonly SomeType[]);
    }
    yield* saveJson(getOutputPath(seasonId, "teams"), result.right.data);
    yield* Effect.log(`     ✓ ${result.right.count} teams (${result.right.durationMs}ms)`);
    return result.right;
  });
```

**Files affected:** All 5 extractors, ~30 methods total

## Proposed Solutions

### Option A: Create makeExtractMethod factory (Recommended)
- **Pros:** ~450 lines saved, single source of truth
- **Cons:** Slightly more abstract
- **Effort:** Medium
- **Risk:** Low

```typescript
const makeExtractMethod = <T>(options: {
  entityName: string;
  emoji: string;
  fetcher: (id: number) => Effect.Effect<T[], PipelineError, R>;
  getPath: (id: number) => string;
}) => (id: number) => Effect.gen(function* () { /* generic implementation */ });

// Usage:
const extractTeams = makeExtractMethod({
  entityName: "teams",
  emoji: "📊",
  fetcher: (seasonId) => client.getTeams({ seasonId }),
  getPath: (seasonId) => getOutputPath(seasonId, "teams"),
});
```

## Acceptance Criteria

- [ ] Generic extract method factory created
- [ ] All extractors refactored to use factory
- [ ] ~400+ lines of code reduced
- [ ] All tests pass
