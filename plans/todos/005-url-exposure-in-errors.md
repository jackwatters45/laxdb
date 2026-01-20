---
id: 005-url-exposure-in-errors
status: pending
category: security
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/error.ts
---

# URL Exposure in Error Messages

## Problem

Error types include full URLs which could expose:
- Internal endpoints
- API tokens in query strings
- Sensitive path information

```typescript
export class HttpError extends Schema.TaggedError<HttpError>()("HttpError", {
  url: Schema.String,  // Full URL exposed
  ...
})
```

## Assessment

Low severity for this codebase because:
1. Pipeline runs locally/in CI, not user-facing
2. URLs are to public APIs (PLL, NLL, etc.)
3. Tokens are in headers, not query strings

## Recommendation (if needed)

Sanitize URLs before including in errors:

```typescript
const sanitizeUrl = (url: string) => {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}`;  // Strip query params
};
```
