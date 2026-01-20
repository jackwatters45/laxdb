# No Programmatic API - Agent Accessibility Gap

**Status:** pending
**Priority:** P2
**Tags:** architecture, agent-native, api
**Effort:** Medium

## Problem Statement

The incremental extraction feature is only accessible via CLI commands (`bun src/extract/nll/run.ts`). There is no programmatic API that agents or other code can invoke directly. This violates the agent-native principle that any action a user can take, an agent can also take.

## Findings

- **Source:** agent-native-reviewer
- **Evidence:**
  - All 5 extractors use `BunRuntime.runMain` which exits the process
  - Services are not exported from package index
  - No Effect-based entry points for programmatic invocation
- **Affected files:**
  - `src/extract/nll/run.ts:68-71`
  - `src/extract/pll/run.ts`
  - `src/extract/mll/run.ts`
  - `src/extract/msl/run.ts`
  - `src/extract/wla/run.ts`

## Proposed Solutions

### Option A: Export Services from Package Index
**Pros:** Simple, maintains existing architecture
**Cons:** Callers must compose layers themselves
**Effort:** Small
**Risk:** Low

```typescript
// src/index.ts
export { NLLExtractorService } from "./extract/nll/nll.extractor";
export { IncrementalExtractionService } from "./extract/incremental.service";
```

### Option B: Add Programmatic Entry Points
**Pros:** Clean API for callers, handles layer composition
**Cons:** Duplicate code between CLI and programmatic API
**Effort:** Medium
**Risk:** Low

```typescript
// src/extract/api.ts
export const extractNLLSeason = (seasonId: number, options?: ExtractOptions) =>
  NLLExtractorService.pipe(
    Effect.flatMap(svc => svc.extractSeason(seasonId, options)),
    Effect.provide(NLLExtractorService.Default)
  );
```

### Option C: Shared Core with CLI Wrapper
**Pros:** Single source of truth, clean separation
**Cons:** Refactoring required
**Effort:** Medium
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] Services can be imported and invoked programmatically
- [ ] No shell invocation required for agent access
- [ ] Type-safe API with proper Effect error channels

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
