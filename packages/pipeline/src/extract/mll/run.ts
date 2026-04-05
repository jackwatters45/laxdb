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
 *   bun src/extract/mll/run.ts --status
 */

import { Command, Flag } from "effect/unstable/cli";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";

import { MLLExtractorService } from "./mll.extractor";
import { MLLManifestService } from "./mll.manifest";

const yearOption = Flag.integer("year").pipe(
  Flag.withAlias("y"),
  Flag.withDescription("Extract specific year (default: 2019)"),
  Flag.withDefault(2019),
);

const allOption = Flag.boolean("all").pipe(
  Flag.withAlias("a"),
  Flag.withDescription("Extract all seasons (2001-2020)"),
  Flag.withDefault(false),
);

const withScheduleOption = Flag.boolean("with-schedule").pipe(
  Flag.withDescription("Include Wayback schedule extraction"),
  Flag.withDefault(false),
);

const program = Effect.gen(function* () {
  const extractor = yield* MLLExtractorService;
  const manifestService = yield* MLLManifestService;

  const mllCommand = Command.make(
    "mll",
    {
      year: yearOption,
      all: allOption,
      withSchedule: withScheduleOption,
      force: forceOption,
      incremental: incrementalOption,
      json: jsonOption,
      status: statusOption,
    },
    ({ year, all, withSchedule, force, incremental, json, status }) =>
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
          ? yield* extractor.extractAll({ mode, includeSchedule: withSchedule })
          : yield* extractor.extractSeason(year, {
              mode,
              includeSchedule: withSchedule,
            });

        if (json) {
          yield* Effect.sync(() => {
            console.log(JSON.stringify(manifest, null, 2));
          });
        }
      }),
  );

  return yield* Command.run(mllCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      MLLExtractorService.layer,
      MLLManifestService.layer,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
