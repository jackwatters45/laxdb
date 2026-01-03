import { Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Config } from "effect";

export interface ExtractConfig {
  readonly outputDir: string;
  readonly concurrency: number;
  readonly delayBetweenRequestsMs: number;
  readonly delayBetweenBatchesMs: number;
}

export class ExtractConfigService extends Effect.Service<ExtractConfigService>()(
  "ExtractConfigService",
  {
    effect: Effect.gen(function* () {
      const path = yield* Path.Path;
      const defaultOutputDir = path.join(process.cwd(), "output");
      const outputDir = yield* Config.string("EXTRACT_OUTPUT_DIR").pipe(
        Config.withDefault(defaultOutputDir),
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
    dependencies: [BunContext.layer],
  },
) {}
