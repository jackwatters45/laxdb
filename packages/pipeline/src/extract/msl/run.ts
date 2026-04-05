/**
 * MSL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/msl/run.ts
 *   bun src/extract/msl/run.ts --season 9567
 *   bun src/extract/msl/run.ts --all
 *   bun src/extract/msl/run.ts --force
 *   bun src/extract/msl/run.ts --json
 *   bun src/extract/msl/run.ts --status
 */

import { Command, Flag } from "effect/unstable/cli";
import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";

import { MSL_GAMESHEET_SEASONS } from "../../msl/msl.schema";
import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";

import { MSLExtractorService } from "./msl.extractor";
import { MSLManifestService } from "./msl.manifest";

const DEFAULT_SEASON_ID = 9567;

const seasonOption = Flag.integer("season").pipe(
  Flag.withAlias("s"),
  Flag.withDescription(`Gamesheet season ID (default: ${DEFAULT_SEASON_ID})`),
  Flag.withDefault(DEFAULT_SEASON_ID),
);

const allOption = Flag.boolean("all").pipe(
  Flag.withAlias("a"),
  Flag.withDescription("Extract all seasons (2023-2025)"),
  Flag.withDefault(false),
);

const listSeasonsOption = Flag.boolean("list-seasons").pipe(
  Flag.withDescription("Show available Gamesheet season IDs"),
  Flag.withDefault(false),
);

const program = Effect.gen(function* () {
  const extractor = yield* MSLExtractorService;
  const manifestService = yield* MSLManifestService;

  const mslCommand = Command.make(
    "msl",
    {
      season: seasonOption,
      all: allOption,
      force: forceOption,
      incremental: incrementalOption,
      listSeasons: listSeasonsOption,
      json: jsonOption,
      status: statusOption,
    },
    ({ season, all, force, incremental, listSeasons, json, status }) =>
      Effect.gen(function* () {
        if (status) {
          const manifest = yield* manifestService.load;
          yield* manifestService.displayStatus(manifest, json);
          return;
        }

        if (listSeasons) {
          if (json) {
            yield* Console.log(JSON.stringify(MSL_GAMESHEET_SEASONS, null, 2));
          } else {
            yield* Console.log("Available MSL Gamesheet Seasons:");
            for (const [year, id] of Object.entries(MSL_GAMESHEET_SEASONS)) {
              yield* Console.log(`  ${id} = ${year} season`);
            }
          }
          return;
        }

        const mode = getMode(force, incremental);

        if (!json) {
          yield* Effect.log(`Extraction mode: ${mode}`);
        }

        const manifest = all
          ? yield* extractor.extractAll({ mode })
          : yield* extractor.extractSeason(season, { mode });

        if (json) {
          yield* Effect.sync(() => {
            console.log(JSON.stringify(manifest, null, 2));
          });
        }
      }),
  );

  return yield* Command.run(mslCommand, {
    version: "1.0.0",
  });
}).pipe(
  Effect.provide(
    Layer.mergeAll(
      MSLExtractorService.Default,
      MSLManifestService.Default,
      BunServices.layer,
    ),
  ),
);

BunRuntime.runMain(program);
