---
id: 004-graphql-error-union
status: pending
category: architecture
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/error.ts
  - packages/pipeline/src/extract/util.ts
---

# GraphQLError Not in PipelineError Union

## Problem

`GraphQLError` is separate from `PipelineError` union, requiring special handling in `isCriticalError`:

```typescript
export const isCriticalError = (
  error: PipelineError | GraphQLError,  // Union of two types
): boolean => { ... }
```

## Context

This was a pragmatic fix during implementation. GraphQL endpoints in PLL return `GraphQLError | PipelineError`.

## Recommendation

Consider adding GraphQLError to PipelineError union in `error.ts`:

```typescript
export type PipelineError =
  | HttpError
  | NetworkError
  | TimeoutError
  | RateLimitError
  | ParseError
  | GraphQLError;  // Add here
```

Or document why they're intentionally separate (different packages/concerns).
