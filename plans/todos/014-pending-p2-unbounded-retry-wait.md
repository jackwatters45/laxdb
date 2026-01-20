---
status: pending
priority: p2
issue_id: "014"
tags: [code-review, security, dos-prevention]
dependencies: []
---

# Unbounded Retry-After Wait Time

## Problem Statement

A malicious or misconfigured server could return an extremely large `retry-after` header value (e.g., `retry-after: 999999999`), causing the client to sleep for an unreasonable duration (11+ days).

**Why it matters:** Resource exhaustion if running multiple extraction jobs; effective denial of service for extraction processes.

## Findings

**Location:** `packages/pipeline/src/api-client/rest-client.service.ts:93-96`

```typescript
const retryAfter = response.headers.get("retry-after");
const retryAfterMs = retryAfter
  ? Number.parseInt(retryAfter, 10) * 1000
  : undefined;
```

**Also in:** `packages/pipeline/src/extract/util.ts:106-107`

## Proposed Solutions

### Option A: Cap maximum retry wait time (Recommended)
- **Pros:** Simple, effective protection
- **Cons:** May ignore legitimate long delays
- **Effort:** Small
- **Risk:** Low

```typescript
const MAX_RETRY_WAIT_MS = 300_000; // 5 minutes max
const retryAfterMs = retryAfter
  ? Math.min(Number.parseInt(retryAfter, 10) * 1000, MAX_RETRY_WAIT_MS)
  : undefined;
```

### Option B: Log warning for excessive delays
- **Pros:** Visibility into unusual delays
- **Cons:** Still waits the full time
- **Effort:** Small
- **Risk:** Medium

## Acceptance Criteria

- [ ] Maximum wait time capped at reasonable value (e.g., 5 minutes)
- [ ] Cap applied in both rest-client.service.ts and util.ts
- [ ] Documented in code comments
