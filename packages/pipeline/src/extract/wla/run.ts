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

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { Command, Flag } from "effect/unstable/cli";

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

const program = Effect.gen(function* () {
  const extractor = yield* WLAExtractorService;
  const manifestService = yield* WLAManifestService;

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
        if (status) {
          const manifest = yield* manifestService.load;
          yield* manifestService.displayStatus(manifest, json, "Year");
          return;
        }

        const mode = getMode(force, incremental);

        if (!json) {
          yield* Effect.log(`Extraction mode: ${mode}`);
        }

        const manifest = all
          ? yield* extractor.extractAll({ mode, includeSchedule: schedule })
          : yield* extractor.extractSeason(season, {
              mode,
              includeSchedule: schedule,
            });

        if (json) {
          yield* Effect.sync(() => {
            console.log(JSON.stringify(manifest, null, 2));
          });
        }
      }),
  );

  return yield* Command.run(wlaCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      WLAExtractorService.layer,
      WLAManifestService.layer,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
