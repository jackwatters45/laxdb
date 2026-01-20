---
status: pending
priority: p2
issue_id: "016"
tags: [code-review, typescript, error-handling]
dependencies: []
---

# isCriticalError Default Case Not Exhaustive

## Problem Statement

The `isCriticalError` function has a `default` case that returns `false` for unknown errors. If a new error type is added to the `PipelineError` union and not handled here, it will silently be treated as non-critical.

**Why it matters:** New transient error types (e.g., `ConnectionResetError`) could be incorrectly treated as permanent failures, leading to incomplete extractions.

## Findings

**Location:** `packages/pipeline/src/extract/util.ts:58-61`

```typescript
case "ParseError":
case "GraphQLError":
default:
  // Non-critical: client errors, parse failures, unknown errors
  return false;
```

## Proposed Solutions

### Option A: Make switch exhaustive with never check (Recommended)
- **Pros:** TypeScript catches unhandled cases at compile time
- **Cons:** Requires updating when new errors added
- **Effort:** Small
- **Risk:** Low

```typescript
export const isCriticalError = (error: PipelineError | GraphQLError): boolean => {
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
    // No default - TypeScript will error if PipelineError union changes
  }
  const _exhaustive: never = error;
  return _exhaustive;
};
```

## Acceptance Criteria

- [ ] No default case in isCriticalError switch
- [ ] TypeScript exhaustiveness check added
- [ ] All current PipelineError types explicitly handled
