---
id: 009-no-programmatic-status
status: pending
category: agent-native
severity: medium
source: code-review-pr97
files:
  - packages/pipeline/src/extract/nll/nll.manifest.ts
  - packages/pipeline/src/extract/pll/pll.manifest.ts
  - packages/pipeline/src/extract/mll/mll.manifest.ts
  - packages/pipeline/src/extract/msl/msl.manifest.ts
  - packages/pipeline/src/extract/wla/wla.manifest.ts
---

# No Programmatic Status Query

## Problem

To check extraction status, agents must:
1. Read manifest JSON file
2. Parse and interpret the structure

No CLI command to query status programmatically.

## Recommendation

Add status command:

```bash
bun src/extract/nll/run.ts --status
```

Output (human):
```
NLL Extraction Status:
  2024: teams ✓, players ✓, standings ✓, schedule ✗
  2023: teams ✓, players ✓, standings ✓, schedule ✓
```

Output (with --json):
```json
{
  "2024": {"teams": true, "players": true, "standings": true, "schedule": false},
  "2023": {"teams": true, "players": true, "standings": true, "schedule": true}
}
```
