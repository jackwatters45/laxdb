/**
 * PLL Data Extraction CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --all
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --no-details
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --force
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --json
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, LogLevel, Logger, Option } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
} from "../cli-utils";

import { PLLExtractorService } from "./pll.extractor";

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

// Main command
const pllCommand = Command.make(
  "pll",
  {
    year: yearOption,
    all: allOption,
    noDetails: noDetailsOption,
    force: forceOption,
    incremental: incrementalOption,
    json: jsonOption,
  },
  ({ year, all, noDetails, force, incremental, json }) =>
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

      if (!json) {
        yield* Effect.log(`Extraction mode: ${mode}`);
      }

      let manifest;
      if (all) {
        manifest = yield* extractor.extractAll({ mode, includeDetails });
      } else if (yearValue !== null) {
        manifest = yield* extractor.extractYear(yearValue, {
          mode,
          includeDetails,
        });
      }
      if (json && manifest) {
        yield* Effect.sync(() => {
          console.log(JSON.stringify(manifest, null, 2));
        });
      }
    }).pipe(json ? Logger.withMinimumLogLevel(LogLevel.None) : (x) => x),
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
