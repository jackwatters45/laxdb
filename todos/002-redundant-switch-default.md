---
id: 002-redundant-switch-default
status: pending
category: simplicity
severity: low
source: code-review-pr97
files:
  - packages/pipeline/src/extract/util.ts
---

# Redundant Switch Default Case

## Problem

In `isCriticalError`, GraphQLError case returns false, then default also returns false:

```typescript
case "ParseError":
case "GraphQLError":
  return false;
default:
  return false;
```

## Recommendation

Remove explicit GraphQLError case since default handles it:

```typescript
case "ParseError":
  return false;
default:
  return false;  // Covers GraphQLError and any future error types
```

Or keep explicit for documentation but add comment explaining intent.
