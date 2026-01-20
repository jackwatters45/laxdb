---
status: pending
priority: p1
issue_id: "012"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Non-null Assertion in withRateLimitRetry

## Problem Statement

The `withRateLimitRetry` function uses a non-null assertion `lastError!` on line 115, which violates the project's type safety rules ("No `any`, no `!`, no `as Type`").

**Why it matters:** If `maxRetries` is somehow negative (e.g., passed as `-1`), the loop body never executes, and `lastError` would be `undefined`, causing a runtime exception.

## Findings

**Location:** `packages/pipeline/src/extract/util.ts:115`

```typescript
return yield* Effect.fail(lastError!);
```

## Proposed Solutions

### Option A: Guard against invalid maxRetries + initialize lastError (Recommended)
- **Pros:** Type-safe, handles edge case
- **Cons:** Slight code increase
- **Effort:** Small
- **Risk:** Low

```typescript
const retries = Math.max(0, maxRetries);
// ... loop that always sets lastError if it runs at least once
// The loop always runs at least once with retries >= 0
```

### Option B: Track error in separate variable with proper typing
- **Pros:** Cleaner TypeScript inference
- **Cons:** Slightly more complex
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] No non-null assertions (`!`) in withRateLimitRetry
- [ ] TypeScript compiles without errors
- [ ] Unit tests pass
