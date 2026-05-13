/**
 * NLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/nll/run.ts
 *   bun src/extract/nll/run.ts --season 225
 *   bun src/extract/nll/run.ts --force
 *   bun src/extract/nll/run.ts --incremental
 *   bun src/extract/nll/run.ts --json
 *   bun src/extract/nll/run.ts --status
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import {
  forceOption,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";
import { runExtractionCommand } from "../extraction-command";

import { NLLExtractorService } from "./nll.extractor";
import { NLLManifestService } from "./nll.manifest";

const seasonOption = Flag.integer("season").pipe(
  Flag.withAlias("s"),
  Flag.withDescription("Season ID to extract"),
  Flag.withDefault(225),
);

const program = Effect.gen(function* () {
  const extractor = yield* NLLExtractorService;
  const manifestService = yield* NLLManifestService;

  const nllCommand = Command.make(
    "nll",
    {
      season: seasonOption,
      force: forceOption,
      incremental: incrementalOption,
      json: jsonOption,
      status: statusOption,
    },
    ({ season, force, incremental, json, status }) =>
      runExtractionCommand({
        force,
        incremental,
        json,
        status,
        loadManifest: manifestService.load,
        displayStatus: manifestService.displayStatus,
        extract: (mode) => extractor.extractSeason(season, { mode }),
      }),
  );

  return yield* Command.run(nllCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      NLLExtractorService.layer,
      NLLManifestService.layer,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
