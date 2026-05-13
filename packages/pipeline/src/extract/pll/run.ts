/**
 * PLL Data Extraction CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --all
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --no-details
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --force
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year 2024 --json
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --status
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer, Option } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import {
  forceOption,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";
import { runExtractionCommand } from "../extraction-command";

import { PLLExtractorService } from "./pll.extractor";
import { PLLManifestService } from "./pll.manifest";

const yearOption = Flag.integer("year").pipe(
  Flag.withAlias("y"),
  Flag.withDescription("Extract specific year (2019-2030)"),
  Flag.optional,
);

const allOption = Flag.boolean("all").pipe(
  Flag.withAlias("a"),
  Flag.withDescription("Extract all years (2019-2025)"),
  Flag.withDefault(false),
);

const noDetailsOption = Flag.boolean("no-details").pipe(
  Flag.withDescription("Skip detail endpoints (faster)"),
  Flag.withDefault(false),
);

const program = Effect.gen(function* () {
  const extractor = yield* PLLExtractorService;
  const manifestService = yield* PLLManifestService;

  const pllCommand = Command.make(
    "pll",
    {
      year: yearOption,
      all: allOption,
      noDetails: noDetailsOption,
      force: forceOption,
      incremental: incrementalOption,
      json: jsonOption,
      status: statusOption,
    },
    ({ year, all, noDetails, force, incremental, json, status }) =>
      runExtractionCommand({
        force,
        incremental,
        json,
        status,
        statusLabel: "Year",
        loadManifest: manifestService.load,
        displayStatus: manifestService.displayStatus,
        extract: (mode) =>
          Effect.gen(function* () {
            const includeDetails = !noDetails;
            const yearValue = Option.getOrNull(year);

            if (!all && yearValue === null) {
              yield* Effect.logError(
                "Error: Must specify --all or --year=YYYY",
              );
              return yield* Effect.fail("Missing required option");
            }

            if (yearValue !== null && (yearValue < 2019 || yearValue > 2030)) {
              yield* Effect.logError(
                `Invalid year ${yearValue}. Must be 2019-2030.`,
              );
              return yield* Effect.fail("Invalid year");
            }

            if (all) {
              return yield* extractor.extractAll({ mode, includeDetails });
            }

            if (yearValue === null) {
              return yield* Effect.fail("Missing required option");
            }

            return yield* extractor.extractYear(yearValue, {
              mode,
              includeDetails,
            });
          }),
      }),
  );

  return yield* Command.run(pllCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      PLLExtractorService.layer,
      PLLManifestService.layer,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
