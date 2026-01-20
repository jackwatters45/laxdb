---
id: 011-incomplete-index-exports
status: pending
category: architecture
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/extract/index.ts
---

# Incomplete Index Exports

## Problem

New `isCriticalError` helper may not be exported from package index, making it harder for external consumers.

## Verification Needed

Check if `packages/pipeline/src/index.ts` or `packages/pipeline/src/extract/index.ts` exports:
- `isCriticalError`
- `saveJson`

## Recommendation

If not exported, add to index:

```typescript
// packages/pipeline/src/extract/index.ts
export { isCriticalError, saveJson } from "./util";
```

Low priority if pipeline package is internal-only.
