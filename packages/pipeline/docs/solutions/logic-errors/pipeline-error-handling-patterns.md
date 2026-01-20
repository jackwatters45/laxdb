---
title: "Pipeline extractors silent failures and unsafe error handling"
category: logic-errors
tags:
  - effect-ts
  - error-handling
  - data-integrity
  - pipeline
  - extraction
  - type-safety
  - rate-limiting
  - file-io
components:
  - packages/pipeline/src/extract/util.ts
  - packages/pipeline/src/extract/pll/pll.extractor.ts
  - packages/pipeline/src/extract/nll/nll.extractor.ts
  - packages/pipeline/src/extract/mll/mll.extractor.ts
  - packages/pipeline/src/extract/msl/msl.extractor.ts
  - packages/pipeline/src/extract/wla/wla.extractor.ts
  - packages/pipeline/src/extract/*/manifest.ts
symptoms:
  - "Data files missing after extraction completes with 'success' status"
  - "Manifest marked complete but corresponding JSON files empty/missing"
  - "Rate limit retries wait indefinitely on malicious retry-after headers"
  - "TypeScript allows new error types to slip through without handling"
  - "No warning when manifest schema validation fails and falls back to empty"
  - "Non-null assertions (!) used where variable could be undefined"
severity: high
date_resolved: 2026-01-20
---

# Pipeline Extractors: Silent Failures and Unsafe Error Handling

## Problem Summary

The pipeline package had several error handling anti-patterns that could cause silent data loss, DoS vulnerabilities, and maintenance issues:

1. Non-null assertion (`lastError!`) in `withRateLimitRetry`
2. Unsafe type cast (`as unknown as RateLimitError`)
3. Unbounded retry-after wait time (DoS vulnerability)
4. `saveJson` using `Effect.catchAll` instead of typed errors
5. `isCriticalError` switch not exhaustive
6. Silent manifest schema fallback (no warning logs)

## Root Cause Analysis

The issues stemmed from:

- **Loop structure** requiring non-null assertion to access `lastError` after the loop
- **Type system limitations** with generic error types requiring unsafe casts
- **Trust of external input** without bounds checking on retry-after headers
- **Effect anti-patterns** using `catchAll` instead of typed error handling
- **Missing exhaustiveness checks** allowing new error types to slip through
- **Silent failures** in manifest loading hiding data corruption issues

## Solution

### 1. Restructure Rate Limit Retry Loop

Handle first attempt separately, then use a retry loop where `lastRateLimitError` is always assigned before access.

```typescript
// Before - non-null assertion required
let lastError: E | undefined;
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  // ... logic that may assign lastError
}
return yield* Effect.fail(lastError!); // TypeScript can't prove this is assigned

// After - restructured for type safety
const firstResult = yield* Effect.either(effect);
if (Either.isRight(firstResult)) {
  return firstResult.right;
}
if (!isRateLimitError(firstResult.left)) {
  return yield* Effect.fail(firstResult.left);
}

let lastRateLimitError = firstResult.left; // Always assigned
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  // ... retry logic, lastRateLimitError always valid
}
return yield* Effect.fail(lastRateLimitError as E); // Justified cast with comment
```

### 2. Add Type Guard for Rate Limit Errors

Create a proper type guard function instead of unsafe cast.

```typescript
const isRateLimitError = (error: { _tag: string }): error is RateLimitError =>
  error._tag === "RateLimitError";
```

### 3. Cap Maximum Retry Wait Time

Prevent DoS via malicious retry-after headers.

```typescript
const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000; // 1 minute default
const MAX_RETRY_WAIT_MS = 300_000; // 5 minutes max to prevent DoS

const waitMs = Math.min(
  lastRateLimitError.retryAfterMs ?? DEFAULT_RATE_LIMIT_WAIT_MS,
  MAX_RETRY_WAIT_MS,
);
```

### 4. Replace catchAll with Typed Error Handling

Create typed error class and use `catchTag`.

```typescript
export class FileWriteError extends Schema.TaggedError<FileWriteError>(
  "FileWriteError",
)("FileWriteError", {
  message: Schema.String,
  filePath: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export const saveJson = <T>(filePath: string, data: T) =>
  Effect.gen(function* () {
    // ... file operations
  }).pipe(
    Effect.catchTag("SystemError", (e: PlatformError) =>
      Effect.fail(
        new FileWriteError({
          message: `Failed to write ${filePath}: ${e.message}`,
          filePath,
          cause: e,
        }),
      ),
    ),
  );
```

### 5. Make Switch Exhaustive

Remove default case and add exhaustiveness check.

```typescript
export const isCriticalError = (
  error: PipelineError | GraphQLError,
): boolean => {
  switch (error._tag) {
    case "NetworkError":
    case "TimeoutError":
      return true;
    case "HttpError":
      return error.statusCode !== undefined && error.statusCode >= 500;
    case "RateLimitError":
      return true;
    case "ParseError":
    case "GraphQLError":
      return false;
  }
  // Exhaustiveness check - TypeScript will error if PipelineError union changes
  const _exhaustive: never = error;
  return _exhaustive;
};
```

### 6. Add Warning Logs for Silent Fallbacks

Log before falling back to empty manifest.

```typescript
return yield* Schema.decodeUnknown(NLLExtractionManifest)(parsed).pipe(
  Effect.catchAll((error) =>
    Effect.zipRight(
      Effect.logWarning(
        `NLL manifest schema invalid, creating new: ${String(error)}`,
      ),
      Effect.succeed(createEmptyNLLManifest()),
    ),
  ),
);
```

## Files Modified

| File | Changes |
|------|---------|
| `src/extract/util.ts` | `withRateLimitRetry`, `isCriticalError`, `saveJson`, `FileWriteError` |
| `src/extract/nll/nll.manifest.ts` | Warning log on schema failure |
| `src/extract/pll/pll.manifest.ts` | Warning log on schema failure |
| `src/extract/mll/mll.manifest.ts` | Warning log on schema failure |
| `src/extract/msl/msl.manifest.ts` | Warning log on schema failure |
| `src/extract/wla/wla.manifest.ts` | Warning log on schema failure |

## Prevention Strategies

### Code Review Checklist

- [ ] No `!` (non-null assertion) on error variables
- [ ] No `as unknown as Type` double casts without safety comments
- [ ] External numeric values have upper bounds (use `Math.min`)
- [ ] No `Effect.catchAll` - use `Effect.catchTag` instead
- [ ] Switch statements on unions have exhaustiveness checks
- [ ] Errors logged or propagated, never silently swallowed

### Linting Rules

```json
{
  "rules": {
    "typescript-eslint/no-non-null-assertion": "error",
    "typescript-eslint/no-unsafe-type-assertion": "error",
    "typescript-eslint/switch-exhaustiveness-check": "error",
    "no-empty": "error"
  }
}
```

## Cross-References

- **Error types**: `packages/pipeline/src/error.ts`
- **Effect patterns**: `references/effect-ts/llms.txt`
- **Anti-patterns**: `CLAUDE.md` (root) - `Effect.catchAll` documented as blocking pattern
- **REST client retry**: `packages/pipeline/src/api-client/rest-client.service.ts`
