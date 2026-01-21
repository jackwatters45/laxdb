/**
 * MLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/mll/run.ts
 *   bun src/extract/mll/run.ts --year 2019
 *   bun src/extract/mll/run.ts --all
 *   bun src/extract/mll/run.ts --with-schedule
 *   bun src/extract/mll/run.ts --force
 *   bun src/extract/mll/run.ts --json
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, LogLevel, Logger } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
} from "../cli-utils";

import { MLLExtractorService } from "./mll.extractor";

const yearOption = Options.integer("year").pipe(
  Options.withAlias("y"),
  Options.withDescription("Extract specific year (default: 2019)"),
  Options.withDefault(2019),
);

const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Extract all seasons (2001-2020)"),
  Options.withDefault(false),
);

const withScheduleOption = Options.boolean("with-schedule").pipe(
  Options.withDescription("Include Wayback schedule extraction"),
  Options.withDefault(false),
);

// Main command
const mllCommand = Command.make(
  "mll",
  {
    year: yearOption,
    all: allOption,
    withSchedule: withScheduleOption,
    force: forceOption,
    incremental: incrementalOption,
    json: jsonOption,
  },
  ({ year, all, withSchedule, force, incremental, json }) =>
    Effect.gen(function* () {
      const extractor = yield* MLLExtractorService;
      const mode = getMode(force, incremental);

      if (!json) {
        yield* Effect.log(`Extraction mode: ${mode}`);
      }

      let manifest;
      if (all) {
        manifest = yield* extractor.extractAll({
          mode,
          includeSchedule: withSchedule,
        });
      } else {
        manifest = yield* extractor.extractSeason(year, {
          mode,
          includeSchedule: withSchedule,
        });
      }
      if (json) {
        yield* Effect.sync(() => {
          console.log(JSON.stringify(manifest, null, 2));
        });
      }
    }).pipe(json ? Logger.withMinimumLogLevel(LogLevel.None) : (x) => x),
);

// CLI runner
const cli = Command.run(mllCommand, {
  name: "MLL Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(Layer.merge(MLLExtractorService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
