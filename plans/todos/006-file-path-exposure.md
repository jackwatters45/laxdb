---
id: 006-file-path-exposure
status: pending
category: security
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/extract/util.ts
---

# File Path Exposure in Error Messages

## Problem

`saveJson` error includes full file path:

```typescript
Effect.fail(new Error(`Failed to write ${filePath}: ${String(e)}`))
```

Could expose internal directory structure.

## Assessment

Low severity because:
1. Pipeline is internal tooling
2. Paths are to output directories, not sensitive locations

## Recommendation (if needed)

Use relative paths in error messages:

```typescript
import { relative } from "node:path";
const relPath = relative(process.cwd(), filePath);
Effect.fail(new Error(`Failed to write ${relPath}: ${String(e)}`))
```
