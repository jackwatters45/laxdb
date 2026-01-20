/**
 * NLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/nll/run.ts
 *   bun src/extract/nll/run.ts --season 225
 *   bun src/extract/nll/run.ts --force
 *   bun src/extract/nll/run.ts --incremental
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import type { ExtractionMode } from "../incremental.service";

import { NLLExtractorService } from "./nll.extractor";

// CLI Options
const seasonOption = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription("Season ID to extract"),
  Options.withDefault(225),
);

const forceOption = Options.boolean("force").pipe(
  Options.withAlias("f"),
  Options.withDescription("Re-extract everything (mode: full)"),
  Options.withDefault(false),
);

const incrementalOption = Options.boolean("incremental").pipe(
  Options.withAlias("i"),
  Options.withDescription(
    "Re-extract stale data - 24h for current seasons (mode: incremental)",
  ),
  Options.withDefault(false),
);

// Derive extraction mode from options
const getMode = (force: boolean, incremental: boolean): ExtractionMode => {
  if (force) return "full";
  if (incremental) return "incremental";
  return "skip-existing";
};

// Main command
const nllCommand = Command.make(
  "nll",
  { season: seasonOption, force: forceOption, incremental: incrementalOption },
  ({ season, force, incremental }) =>
    Effect.gen(function* () {
      const extractor = yield* NLLExtractorService;
      const mode = getMode(force, incremental);

      yield* Effect.log(`Extraction mode: ${mode}`);
      yield* extractor.extractSeason(season, { mode });
    }),
);

// CLI runner
const cli = Command.run(nllCommand, {
  name: "NLL Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(Layer.merge(NLLExtractorService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
