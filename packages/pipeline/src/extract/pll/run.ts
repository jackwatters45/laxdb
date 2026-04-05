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

import { Command, Flag } from "effect/unstable/cli";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer, Option } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";

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
      Effect.gen(function* () {
        if (status) {
          const manifest = yield* manifestService.load;
          yield* manifestService.displayStatus(manifest, json, "Year");
          return;
        }

        const mode = getMode(force, incremental);
        const includeDetails = !noDetails;
        const yearValue = Option.getOrNull(year);

        if (!all && yearValue === null) {
          yield* Effect.logError("Error: Must specify --all or --year=YYYY");
          return yield* Effect.fail("Missing required option");
        }

        if (yearValue !== null && (yearValue < 2019 || yearValue > 2030)) {
          yield* Effect.logError(
            `Invalid year ${Number(yearValue)}. Must be 2019-2030.`,
          );
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
      }),
  );

  return yield* Command.run(pllCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      PLLExtractorService.Default,
      PLLManifestService.Default,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
