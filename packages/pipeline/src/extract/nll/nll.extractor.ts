import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { NLLClient } from "../../nll/nll.client";
import { ExtractConfigService } from "../extract.config";

import { NLLManifestService } from "./nll.manifest";

const NLL_SEASONS = [225] as const;
type _NLLSeason = (typeof NLL_SEASONS)[number];

export class NLLExtractorService extends Effect.Service<NLLExtractorService>()(
  "NLLExtractorService",
  {
    effect: Effect.gen(function* () {
      const client = yield* NLLClient;
      const config = yield* ExtractConfigService;
      const manifestService = yield* NLLManifestService;
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      yield* Effect.log(`Output directory: ${config.outputDir}`);

      return {
        client,
        config,
        manifestService,
        fs,
        path,
        NLL_SEASONS,
      };
    }),
    dependencies: [
      Layer.mergeAll(
        NLLClient.Default,
        ExtractConfigService.Default,
        NLLManifestService.Default,
        BunContext.layer,
      ),
    ],
  },
) {}
