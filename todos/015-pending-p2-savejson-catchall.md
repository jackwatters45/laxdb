---
status: pending
priority: p2
issue_id: "015"
tags: [code-review, effect-ts, conventions]
dependencies: []
---

# saveJson Uses Effect.catchAll Instead of catchTag

## Problem Statement

The `saveJson` function uses `Effect.catchAll` which the project CLAUDE.md explicitly prohibits: "Effect.catchAll - Swallows typed errors - Do Instead: Effect.catchTag"

**Why it matters:** Converting platform errors to plain `Error` loses the original error type information, making debugging harder and preventing pattern matching on specific failure modes.

## Findings

**Location:** `packages/pipeline/src/extract/util.ts:22-26`

```typescript
.pipe(
  Effect.catchAll((e) =>
    Effect.fail(new Error(`Failed to write ${filePath}: ${String(e)}`)),
  ),
);
```

## Proposed Solutions

### Option A: Use Effect.catchTag with typed error (Recommended)
- **Pros:** Preserves error types, aligns with project conventions
- **Cons:** Requires defining a new error class
- **Effort:** Small
- **Risk:** Low

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
    // ...
  }).pipe(
    Effect.catchTag("SystemError", (e) =>
      Effect.fail(new FileWriteError({
        message: `Failed to write ${filePath}: ${e.message}`,
        filePath,
        cause: e,
      })),
    ),
  );
```

## Acceptance Criteria

- [ ] No Effect.catchAll in saveJson
- [ ] Typed error class for file write failures
- [ ] Original error preserved as cause
