---
status: pending
priority: p1
issue_id: "013"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Unsafe Type Cast in withRateLimitRetry

## Problem Statement

The `withRateLimitRetry` function uses an unsafe double cast `as unknown as RateLimitError` which bypasses TypeScript's type checking.

**Why it matters:** The generic constraint `{ _tag: string }` does not guarantee the existence of `retryAfterMs`. If an error type happens to have `_tag === "RateLimitError"` but no `retryAfterMs`, this could silently use `undefined`.

## Findings

**Location:** `packages/pipeline/src/extract/util.ts:105`

```typescript
const rateLimitError = result.left as unknown as RateLimitError;
const waitMs = rateLimitError.retryAfterMs ?? DEFAULT_RATE_LIMIT_WAIT_MS;
```

## Proposed Solutions

### Option A: Use type-safe property access (Recommended)
- **Pros:** No casts, fully type-safe
- **Cons:** Slightly more verbose
- **Effort:** Small
- **Risk:** Low

```typescript
const waitMs =
  ("retryAfterMs" in result.left && typeof result.left.retryAfterMs === "number")
    ? result.left.retryAfterMs
    : DEFAULT_RATE_LIMIT_WAIT_MS;
```

### Option B: Strengthen generic constraint
- **Pros:** Documents expected error shape
- **Cons:** May limit reusability
- **Effort:** Small
- **Risk:** Low

```typescript
type MaybeRateLimited = { readonly _tag: string; retryAfterMs?: number };
export const withRateLimitRetry = (maxRetries = 2) =>
  <A, E extends MaybeRateLimited, R>(effect: Effect.Effect<A, E, R>) => ...
```

## Acceptance Criteria

- [ ] No `as unknown as` casts in withRateLimitRetry
- [ ] Type-safe access to retryAfterMs
- [ ] TypeScript compiles without errors
