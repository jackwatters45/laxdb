/**
 * MSL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/msl/run.ts
 *   bun src/extract/msl/run.ts --season 9567
 *   bun src/extract/msl/run.ts --all
 *   bun src/extract/msl/run.ts --force
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";

import { MSL_GAMESHEET_SEASONS } from "../../msl/msl.schema";
import { forceOption, getMode, incrementalOption } from "../cli-utils";

import { MSLExtractorService } from "./msl.extractor";

const DEFAULT_SEASON_ID = 9567;

const seasonOption = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription(
    `Gamesheet season ID (default: ${DEFAULT_SEASON_ID})`,
  ),
  Options.withDefault(DEFAULT_SEASON_ID),
);

const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Extract all seasons (2023-2025)"),
  Options.withDefault(false),
);

const listSeasonsOption = Options.boolean("list-seasons").pipe(
  Options.withDescription("Show available Gamesheet season IDs"),
  Options.withDefault(false),
);

// Main command
const mslCommand = Command.make(
  "msl",
  {
    season: seasonOption,
    all: allOption,
    force: forceOption,
    incremental: incrementalOption,
    listSeasons: listSeasonsOption,
  },
  ({ season, all, force, incremental, listSeasons }) =>
    Effect.gen(function* () {
      // Show available seasons if requested
      if (listSeasons) {
        yield* Console.log("Available MSL Gamesheet Seasons:");
        for (const [year, id] of Object.entries(MSL_GAMESHEET_SEASONS)) {
          yield* Console.log(`  ${id} = ${year} season`);
        }
        return;
      }

      const extractor = yield* MSLExtractorService;
      const mode = getMode(force, incremental);

      yield* Effect.log(`Extraction mode: ${mode}`);

      if (all) {
        yield* extractor.extractAll({ mode });
      } else {
        yield* extractor.extractSeason(season, { mode });
      }
    }),
);

// CLI runner
const cli = Command.run(mslCommand, {
  name: "MSL Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(Layer.merge(MSLExtractorService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
