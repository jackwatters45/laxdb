# No --json Flag for Machine-Readable Output

**Status:** pending
**Priority:** P3
**Tags:** agent-native, cli, api
**Effort:** Small

## Problem Statement

CLI commands only output human-readable logs. There's no `--json` flag for machine-readable output, making it harder for agents and scripts to parse extraction results.

## Findings

- **Source:** agent-native-reviewer
- **Evidence:**
  - All CLIs use `Effect.log` for output
  - No structured output option
  - Agents must parse log text to understand results
- **Affected files:**
  - `src/extract/nll/run.ts`
  - `src/extract/pll/run.ts`
  - `src/extract/mll/run.ts`
  - `src/extract/msl/run.ts`
  - `src/extract/wla/run.ts`

## Proposed Solutions

### Option A: Add --json Flag
**Pros:** Machine-readable, agent-friendly
**Cons:** Need to suppress logs in JSON mode
**Effort:** Small
**Risk:** Low

```typescript
const jsonOption = Options.boolean("json").pipe(
  Options.withDescription("Output results as JSON"),
  Options.withDefault(false),
);

// In command handler:
if (json) {
  console.log(JSON.stringify({
    season: seasonId,
    mode,
    results: manifest
  }));
} else {
  yield* Effect.log(...);
}
```

### Option B: Always Output Summary JSON at End
**Pros:** Both human and machine output
**Cons:** Might clutter output
**Effort:** Small
**Risk:** Low

### Option C: Keep As-Is (Not Needed Yet)
**Pros:** No change needed
**Cons:** Limits agent accessibility
**Effort:** None
**Risk:** None

## Recommended Action

_To be filled during triage_

## Acceptance Criteria

- [ ] `--json` flag available on all CLIs
- [ ] JSON output includes extraction results/counts
- [ ] Human-readable output unchanged without flag

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-21 | Created | From code review of PR #99 |

## Resources

- PR #99: feat/pipeline-incremental-cli
