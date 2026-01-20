---
id: 010-errors-lack-machine-codes
status: pending
category: agent-native
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/error.ts
---

# Errors Lack Machine-Readable Codes

## Problem

Errors use `_tag` for type discrimination but lack stable error codes:

```typescript
export class HttpError extends Schema.TaggedError<HttpError>()("HttpError", {
  message: Schema.String,
  url: Schema.String,
  statusCode: Schema.optional(Schema.Number),
})
```

Agents must parse messages or check statusCode to understand specific failures.

## Recommendation

Add error codes for common scenarios:

```typescript
export class HttpError extends Schema.TaggedError<HttpError>()("HttpError", {
  code: Schema.Literal(
    "HTTP_CLIENT_ERROR",
    "HTTP_SERVER_ERROR",
    "HTTP_NOT_FOUND",
    "HTTP_UNAUTHORIZED"
  ),
  message: Schema.String,
  url: Schema.String,
  statusCode: Schema.optional(Schema.Number),
})
```

Or use existing `_tag` + `statusCode` combination (current approach works).
