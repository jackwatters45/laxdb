---
id: 001-excessive-jsdoc-duplication
status: pending
category: simplicity
severity: medium
source: code-review-pr97
files:
  - packages/pipeline/src/extract/nll/nll.extractor.ts
  - packages/pipeline/src/extract/pll/pll.extractor.ts
  - packages/pipeline/src/extract/mll/mll.extractor.ts
  - packages/pipeline/src/extract/msl/msl.extractor.ts
  - packages/pipeline/src/extract/wla/wla.extractor.ts
---

# Excessive JSDoc Duplication

## Problem

~60 lines of identical JSDoc comments across 5 extractors. Each extraction method has the same comment block:

```typescript
/**
 * Extracts teams for a season.
 *
 * Error handling:
 * - Critical errors (network, timeout, 5xx): Fails fast, propagates error up
 * - Non-critical errors (404, parse): Returns empty result, continues extraction
 */
```

## Recommendation

Single doc at module level or shared reference:

```typescript
// At top of file or in util.ts:
/**
 * Extraction methods use consistent error handling:
 * - Critical errors (network, timeout, 5xx): Fails fast
 * - Non-critical errors (404, parse): Returns empty, continues
 *
 * @see isCriticalError for classification logic
 */
```

Then remove per-method JSDoc duplication.
