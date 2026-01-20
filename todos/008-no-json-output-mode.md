---
id: 008-no-json-output-mode
status: pending
category: agent-native
severity: medium
source: code-review-pr97
files:
  - packages/pipeline/src/extract/nll/run.ts
  - packages/pipeline/src/extract/pll/run.ts
  - packages/pipeline/src/extract/mll/run.ts
  - packages/pipeline/src/extract/msl/run.ts
  - packages/pipeline/src/extract/wla/run.ts
---

# No JSON Output Mode for Agent Consumption

## Problem

Extraction scripts output human-readable logs:

```
  📊 Extracting teams for season 2024...
     ✓ 8 teams (234ms)
```

Agents parsing this output must use regex/string matching.

## Recommendation

Add `--json` flag for machine-readable output:

```bash
bun src/extract/nll/run.ts --json
```

Output:
```json
{"event":"extract","entity":"teams","seasonId":2024,"count":8,"durationMs":234,"status":"success"}
{"event":"extract","entity":"players","seasonId":2024,"count":156,"durationMs":892,"status":"success"}
```

Or use structured logging (Effect Logger with JSON formatter).
