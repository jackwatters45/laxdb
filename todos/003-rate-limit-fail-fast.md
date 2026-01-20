---
id: 003-rate-limit-fail-fast
status: pending
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
