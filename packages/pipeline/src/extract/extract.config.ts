import { Effect, Config } from "effect";
import * as path from "node:path";

export interface ExtractConfig {
  readonly outputDir: string;
  readonly concurrency: number;
  readonly delayBetweenRequestsMs: number;
  readonly delayBetweenBatchesMs: number;
}

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "output");

export class ExtractConfigService extends Effect.Service<ExtractConfigService>()(
  "ExtractConfigService",
  {
    effect: Effect.gen(function* () {
      const outputDir = yield* Config.string("EXTRACT_OUTPUT_DIR").pipe(
        Config.withDefault(DEFAULT_OUTPUT_DIR),
      );
      const concurrency = yield* Config.number("EXTRACT_CONCURRENCY").pipe(
        Config.withDefault(5),
      );
      const delayBetweenRequestsMs = yield* Config.number(
        "EXTRACT_DELAY_MS",
      ).pipe(Config.withDefault(100));
      const delayBetweenBatchesMs = yield* Config.number(
        "EXTRACT_BATCH_DELAY_MS",
      ).pipe(Config.withDefault(500));

      return {
        outputDir,
        concurrency,
        delayBetweenRequestsMs,
        delayBetweenBatchesMs,
      } satisfies ExtractConfig;
    }),
  },
) {}
