# TODO: Automation Entry Point for Pipeline Extractors

## Problem Statement

Currently, all extractors are invoked via CLI scripts (`run.ts` files). This is not ideal for automated scheduling (cron jobs, Cloudflare Workers scheduled triggers, GitHub Actions, etc.) because:

1. CLI overhead for parsing args on every invocation
2. No unified entry point to run all extractors
3. No direct Effect composition for automation orchestration
4. Hard to integrate with monitoring/alerting systems

## Goals

1. Create a programmatic API for triggering extractions without CLI
2. Support running all extractors in sequence with proper error handling
3. Enable integration with various schedulers (cron, CF Workers, etc.)
4. Add observability hooks for monitoring extraction health

## Proposed Design

### 1. Unified Extraction Service

Create `src/extract/extraction-orchestrator.ts`:

```typescript
export class ExtractionOrchestratorService extends Effect.Service<ExtractionOrchestratorService>()(
  "ExtractionOrchestratorService",
  {
    effect: Effect.gen(function* () {
      const nll = yield* NLLExtractorService;
      const pll = yield* PLLExtractorService;
      const mll = yield* MLLExtractorService;
      const msl = yield* MSLExtractorService;
      const wla = yield* WLAExtractorService;

      // Run all extractors in incremental mode
      const runIncremental = () =>
        Effect.gen(function* () {
          yield* Effect.log("Starting incremental extraction...");

          // Run in parallel for independent sources
          yield* Effect.all([
            nll.extractSeason(225, { mode: "incremental" }),
            pll.extractAll({ mode: "incremental" }),
            msl.extractAll({ mode: "incremental" }),
            wla.extractAll({ mode: "incremental" }),
            // MLL is historical, skip in incremental
          ], { concurrency: 2 });

          yield* Effect.log("Incremental extraction complete");
        });

      // Run specific source
      const runSource = (source: "nll" | "pll" | "mll" | "msl" | "wla", mode: ExtractionMode) =>
        Effect.gen(function* () {
          switch (source) {
            case "nll": return yield* nll.extractSeason(225, { mode });
            case "pll": return yield* pll.extractAll({ mode });
            case "mll": return yield* mll.extractAll({ mode });
            case "msl": return yield* msl.extractAll({ mode });
            case "wla": return yield* wla.extractAll({ mode });
          }
        });

      return { runIncremental, runSource };
    }),
    dependencies: [
      Layer.mergeAll(
        NLLExtractorService.Default,
        PLLExtractorService.Default,
        MLLExtractorService.Default,
        MSLExtractorService.Default,
        WLAExtractorService.Default,
      ),
    ],
  },
) {}
```

### 2. Automation Entry Points

#### Option A: Cloudflare Worker Scheduled Trigger

Create `src/automation/scheduled-worker.ts`:

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const program = Effect.gen(function* () {
      const orchestrator = yield* ExtractionOrchestratorService;
      yield* orchestrator.runIncremental();
    });

    ctx.waitUntil(
      Effect.runPromise(
        program.pipe(Effect.provide(ExtractionOrchestratorService.Default))
      )
    );
  },
};
```

#### Option B: Simple Script Entry Point

Create `src/automation/run-incremental.ts`:

```typescript
import { BunRuntime } from "@effect/platform-bun";

const program = Effect.gen(function* () {
  const orchestrator = yield* ExtractionOrchestratorService;
  yield* orchestrator.runIncremental();
});

BunRuntime.runMain(
  program.pipe(Effect.provide(ExtractionOrchestratorService.Default))
);
```

Then cron can simply run: `bun src/automation/run-incremental.ts`

#### Option C: GitHub Actions Workflow

```yaml
name: Scheduled Data Extraction
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun src/automation/run-incremental.ts
        env:
          PLL_REST_TOKEN: ${{ secrets.PLL_REST_TOKEN }}
          PLL_GRAPHQL_TOKEN: ${{ secrets.PLL_GRAPHQL_TOKEN }}
```

### 3. Observability Integration

Add hooks for monitoring:

```typescript
interface ExtractionResult {
  source: string;
  duration: number;
  entitiesExtracted: number;
  errors: string[];
}

const runWithMetrics = (extraction: Effect.Effect<...>) =>
  Effect.gen(function* () {
    const start = Date.now();
    const result = yield* extraction.pipe(
      Effect.tapError((e) => sendAlert(`Extraction failed: ${e}`)),
    );
    const duration = Date.now() - start;

    yield* sendMetric("extraction.duration", duration);
    yield* sendMetric("extraction.entities", result.count);

    return result;
  });
```

## Implementation Tasks

- [ ] Create `ExtractionOrchestratorService`
- [ ] Create `src/automation/run-incremental.ts` entry point
- [ ] Add metrics/logging hooks
- [ ] Test incremental extraction locally
- [ ] Set up GitHub Actions workflow
- [ ] Consider Cloudflare Worker for self-hosted option
- [ ] Add Slack/Discord webhook for extraction status

## Decisions Needed

1. **Scheduling Platform**: GitHub Actions vs Cloudflare Workers vs external cron?
   - GitHub Actions: Free, easy secrets, but 6hr minimum for scheduled
   - Cloudflare: Lower latency, integrates with existing infra
   - External cron: Most flexible, requires server

2. **Concurrency**: Run all extractors in parallel or sequential?
   - Parallel is faster but may hit rate limits
   - Sequential is safer but slower

3. **Error Handling**: Fail-fast vs best-effort?
   - Fail-fast: Stop on first error
   - Best-effort: Continue and report all errors at end

4. **Output Storage**: Local files vs cloud storage?
   - Current: Local JSON files
   - Future: Consider R2/S3 for persistence

## Timeline

This is a follow-up task after the current refactoring is complete. Estimated effort:
- Phase 1 (Orchestrator + Script): 2-4 hours
- Phase 2 (GitHub Actions): 1-2 hours
- Phase 3 (Observability): 2-4 hours
