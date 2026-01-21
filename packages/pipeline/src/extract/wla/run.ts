/**
 * WLA Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/wla/run.ts
 *   bun src/extract/wla/run.ts --season 2024
 *   bun src/extract/wla/run.ts --all
 *   bun src/extract/wla/run.ts --force
 *   bun src/extract/wla/run.ts --schedule
 *   bun src/extract/wla/run.ts --json
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

import { WLAExtractorService } from "./wla.extractor";

const DEFAULT_SEASON = new Date().getFullYear();

const seasonOption = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription(`Season year (default: ${DEFAULT_SEASON})`),
  Options.withDefault(DEFAULT_SEASON),
);

const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Extract all seasons (2005-2025)"),
  Options.withDefault(false),
);

const scheduleOption = Options.boolean("schedule").pipe(
  Options.withDescription("Include schedule extraction"),
  Options.withDefault(false),
);

// Main command
const wlaCommand = Command.make(
  "wla",
  {
    season: seasonOption,
    all: allOption,
    schedule: scheduleOption,
    force: forceOption,
    incremental: incrementalOption,
    json: jsonOption,
  },
  ({ season, all, schedule, force, incremental, json }) =>
    Effect.gen(function* () {
      const extractor = yield* WLAExtractorService;
      const mode = getMode(force, incremental);

      if (!json) {
        yield* Effect.log(`Extraction mode: ${mode}`);
      }

      let manifest;
      if (all) {
        manifest = yield* extractor.extractAll({
          mode,
          includeSchedule: schedule,
        });
      } else {
        manifest = yield* extractor.extractSeason(season, {
          mode,
          includeSchedule: schedule,
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
const cli = Command.run(wlaCommand, {
  name: "WLA Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(Layer.merge(WLAExtractorService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
