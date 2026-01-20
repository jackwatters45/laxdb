---
id: 003-rate-limit-fail-fast
status: wont-fix
category: performance
severity: medium
source: code-review-pr97
files:
  - packages/pipeline/src/extract/util.ts
---

# RateLimitError Should Retry, Not Fail-Fast

## Problem

Current implementation treats RateLimitError as critical (fail-fast):

```typescript
case "RateLimitError":
  return true;  // Triggers immediate failure
```

But RateLimitError includes `retryAfterMs` - the API is telling us when to retry.

## Recommendation

RateLimitError should trigger exponential backoff/retry, not immediate failure:

```typescript
case "RateLimitError":
  return false;  // Allow retry with backoff
```

Or better: handle RateLimitError separately in extractors with `Effect.retry` using the `retryAfterMs` value.

## Notes

This was a design decision in the original plan. May want to discuss whether fail-fast is actually desired for rate limits (e.g., if extraction is time-sensitive and can't wait).

## Resolution

**Marked as wont-fix:** 2026-01-21

This is working as designed. The `withRateLimitRetry` utility handles rate limit retries BEFORE `isCriticalError` is called. By the time `isCriticalError` evaluates `RateLimitError`, the configured retries have already been exhausted. The comment in util.ts:74 says "Handled by withRateLimitRetry - if we get here, retries exhausted".

If we don't fail-fast after retries are exhausted, we'd silently return empty data, which is worse than failing loudly.
