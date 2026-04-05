import { BunServices } from "@effect/platform-bun";
import { Config, Effect, Layer, ServiceMap } from "effect";
import { Path } from "effect/Path";

export interface ExtractConfig {
  readonly outputDir: string;
  readonly concurrency: number;
  readonly delayBetweenRequestsMs: number;
  readonly delayBetweenBatchesMs: number;
}

export class ExtractConfigService extends ServiceMap.Service<ExtractConfigService>()(
  "ExtractConfigService",
  {
    make: Effect.gen(function* () {
      const path = yield* Path;
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
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(BunServices.layer),
  );
}
