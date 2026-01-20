/**
 * PLL Data Extraction CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --all
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --no-details
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --force
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Option } from "effect";

import type { ExtractionMode } from "../incremental.service";

import { PLLExtractorService } from "./pll.extractor";

// CLI Options
const yearOption = Options.integer("year").pipe(
  Options.withAlias("y"),
  Options.withDescription("Extract specific year (2019-2030)"),
  Options.optional,
);

const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Extract all years (2019-2025)"),
  Options.withDefault(false),
);

const noDetailsOption = Options.boolean("no-details").pipe(
  Options.withDescription("Skip detail endpoints (faster)"),
  Options.withDefault(false),
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
const pllCommand = Command.make(
  "pll",
  {
    year: yearOption,
    all: allOption,
    noDetails: noDetailsOption,
    force: forceOption,
    incremental: incrementalOption,
  },
  ({ year, all, noDetails, force, incremental }) =>
    Effect.gen(function* () {
      const extractor = yield* PLLExtractorService;
      const mode = getMode(force, incremental);
      const includeDetails = !noDetails;

      // Validate: must specify --all or --year
      const yearValue = Option.getOrNull(year);
      if (!all && yearValue === null) {
        yield* Effect.logError("Error: Must specify --all or --year=YYYY");
        return yield* Effect.fail("Missing required option");
      }

      // Validate year range
      if (yearValue !== null && (yearValue < 2019 || yearValue > 2030)) {
        yield* Effect.logError(`Invalid year ${yearValue}. Must be 2019-2030.`);
        return yield* Effect.fail("Invalid year");
      }

      yield* Effect.log(`Extraction mode: ${mode}`);

      if (all) {
        yield* extractor.extractAll({ mode, includeDetails });
      } else if (yearValue !== null) {
        yield* extractor.extractYear(yearValue, { mode, includeDetails });
      }
    }),
);

// CLI runner
const cli = Command.run(pllCommand, {
  name: "PLL Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(Layer.merge(PLLExtractorService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
