---
status: completed
priority: p2
issue_id: "017"
tags: [code-review, effect-ts, observability]
dependencies: []
---

# Silent Schema Fallback in Manifest Services

## Problem Statement

All 5 manifest services silently swallow schema validation errors when loading manifests, using `Effect.catchAll` to return an empty manifest without any logging.

**Why it matters:** If a manifest file is corrupted, the user won't know. The extraction will start fresh, potentially re-extracting data that was already extracted but lost due to the corrupted manifest.

## Findings

**Location:** All manifest service files (nll, pll, mll, msl, wla)

Example from `packages/pipeline/src/extract/nll/nll.manifest.ts:89-91`:

```typescript
return yield* Schema.decodeUnknown(NLLExtractionManifest)(parsed).pipe(
  Effect.catchAll(() => Effect.succeed(createEmptyNLLManifest())),
);
```

## Proposed Solutions

### Option A: Log warning before fallback (Recommended)
- **Pros:** User awareness, easy to implement
- **Cons:** Still uses catchAll
- **Effort:** Small
- **Risk:** Low

```typescript
Effect.catchAll((error) =>
  Effect.zipRight(
    Effect.logWarning(`Manifest schema invalid, creating new: ${error}`),
    Effect.succeed(createEmptyNLLManifest()),
  ),
)
```

### Option B: Fail on corruption, require manual reset
- **Pros:** Prevents accidental data loss
- **Cons:** Requires user intervention
- **Effort:** Small
- **Risk:** Medium (may block users)

## Acceptance Criteria

- [x] Warning logged when manifest fails schema validation
- [x] User can see that a new manifest is being created
- [x] Applied to all 5 manifest services

## Resolution

**Completed:** 2026-01-21

Implemented Option A with catchTag instead of catchAll. All 5 manifest services now use:
```typescript
Effect.catchTag("ParseError", (error) =>
  Effect.zipRight(
    Effect.logWarning(`{source} manifest schema invalid, creating new: ${error.message}`),
    Effect.succeed(createEmpty{Source}Manifest()),
  ),
)
```
