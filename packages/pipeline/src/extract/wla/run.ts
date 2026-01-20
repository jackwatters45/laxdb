/**
 * WLA Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/wla/run.ts
 *   bun src/extract/wla/run.ts --season 2024
 *   bun src/extract/wla/run.ts --all
 *   bun src/extract/wla/run.ts --force
 *   bun src/extract/wla/run.ts --schedule
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import type { ExtractionMode } from "../incremental.service";

import { WLAExtractorService } from "./wla.extractor";

// Default to current year
const DEFAULT_SEASON = new Date().getFullYear();

// CLI Options
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
const wlaCommand = Command.make(
  "wla",
  {
    season: seasonOption,
    all: allOption,
    schedule: scheduleOption,
    force: forceOption,
    incremental: incrementalOption,
  },
  ({ season, all, schedule, force, incremental }) =>
    Effect.gen(function* () {
      const extractor = yield* WLAExtractorService;
      const mode = getMode(force, incremental);

      yield* Effect.log(`Extraction mode: ${mode}`);

      if (all) {
        yield* extractor.extractAll({
          mode,
          includeSchedule: schedule,
        });
      } else {
        yield* extractor.extractSeason(season, {
          mode,
          includeSchedule: schedule,
        });
      }
    }),
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
