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
 *   bun src/extract/wla/run.ts --status
 */

import { Command, Flag } from "effect/unstable/cli";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer, LogLevel, Logger } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";

import { WLAExtractorService } from "./wla.extractor";
import { WLAManifestService } from "./wla.manifest";

const DEFAULT_SEASON = new Date().getFullYear();

const seasonOption = Flag.integer("season").pipe(
  Flag.withAlias("s"),
  Flag.withDescription(`Season year (default: ${DEFAULT_SEASON})`),
  Flag.withDefault(DEFAULT_SEASON),
);

const allOption = Flag.boolean("all").pipe(
  Flag.withAlias("a"),
  Flag.withDescription("Extract all seasons (2005-2025)"),
  Flag.withDefault(false),
);

const scheduleOption = Flag.boolean("schedule").pipe(
  Flag.withDescription("Include schedule extraction"),
  Flag.withDefault(false),
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
    status: statusOption,
  },
  ({ season, all, schedule, force, incremental, json, status }) =>
    Effect.gen(function* () {
      // Handle --status flag
      if (status) {
        const manifestService = yield* WLAManifestService;
        const manifest = yield* manifestService.load;
        yield* manifestService.displayStatus(manifest, json, "Year");
        return;
      }

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
  Effect.provide(
    Layer.mergeAll(
      WLAExtractorService.Default,
      WLAManifestService.Default,
      BunServices.layer,
    ),
  ),
  BunRuntime.runMain,
);
