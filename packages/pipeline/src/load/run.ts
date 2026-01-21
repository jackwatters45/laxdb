/**
 * Data Loader CLI
 *
 * Loads extracted JSON data into the database.
 *
 * Usage:
 *   infisical run --env=dev -- bun src/load/run.ts --league=pll --season=2024
 *   infisical run --env=dev -- bun src/load/run.ts --league=pll --all
 *   infisical run --env=dev -- bun src/load/run.ts --league=pll --season=2024 --identity
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, LogLevel, Logger, Option } from "effect";

import { LEAGUE_CONFIGS, LoaderService } from "./loader.service";

const leagueOption = Options.choice("league", Object.keys(LEAGUE_CONFIGS)).pipe(
  Options.withAlias("l"),
  Options.withDescription("League to load (pll, nll, mll, msl, wla)"),
);

const seasonOption = Options.text("season").pipe(
  Options.withAlias("s"),
  Options.withDescription("Season/year to load (e.g., 2024)"),
  Options.optional,
);

const allOption = Options.boolean("all").pipe(
  Options.withAlias("a"),
  Options.withDescription("Load all available seasons for the league"),
  Options.withDefault(false),
);

const identityOption = Options.boolean("identity").pipe(
  Options.withAlias("i"),
  Options.withDescription("Run identity linking after loading"),
  Options.withDefault(false),
);

const jsonOption = Options.boolean("json").pipe(
  Options.withDescription("Output results as JSON"),
  Options.withDefault(false),
);

// Season ranges per league
const LEAGUE_SEASONS: Record<string, string[]> = {
  pll: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
  nll: [
    "201",
    "202",
    "203",
    "204",
    "205",
    "206",
    "207",
    "208",
    "209",
    "210",
    "211",
    "212",
    "213",
    "214",
    "215",
    "216",
    "217",
    "218",
    "219",
    "220",
    "221",
    "222",
    "223",
    "224",
    "225",
  ],
  mll: [
    "2001",
    "2002",
    "2003",
    "2004",
    "2005",
    "2006",
    "2007",
    "2008",
    "2009",
    "2010",
    "2011",
    "2012",
    "2013",
    "2014",
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
  ],
  msl: ["3246", "6007", "9567"], // Gamesheet season IDs: 2023, 2024, 2025
  wla: [
    "2005",
    "2006",
    "2007",
    "2008",
    "2009",
    "2010",
    "2011",
    "2012",
    "2013",
    "2014",
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
  ],
};

// Main command
const loadCommand = Command.make(
  "load",
  {
    league: leagueOption,
    season: seasonOption,
    all: allOption,
    identity: identityOption,
    json: jsonOption,
  },
  ({ league, season, all, identity, json }) =>
    Effect.gen(function* () {
      const loader = yield* LoaderService;

      // Determine seasons to load
      let seasons: string[];
      if (all) {
        seasons = LEAGUE_SEASONS[league] ?? [];
        if (seasons.length === 0) {
          yield* Effect.logError(`No seasons configured for league: ${league}`);
          return;
        }
      } else if (Option.isSome(season)) {
        seasons = [season.value];
      } else {
        yield* Effect.logError("Please specify --season or --all");
        return;
      }

      yield* Effect.log(`\n🏈 Loading ${league.toUpperCase()} data`);
      yield* Effect.log(`Seasons: ${seasons.join(", ")}`);
      yield* Effect.log(`Identity linking: ${identity ? "yes" : "no"}`);

      const allResults: Array<{
        season: string;
        results: Array<{
          entityType: string;
          loaded: number;
          skipped: number;
          errors: number;
          durationMs: number;
        }>;
      }> = [];

      for (const s of seasons) {
        const results = yield* loader.loadSeason(league, s, {
          runIdentityLinking: identity,
        });
        allResults.push({ season: s, results });
      }

      // Output summary
      if (json) {
        console.log(JSON.stringify(allResults, null, 2));
      } else {
        yield* Effect.log("\n" + "=".repeat(50));
        yield* Effect.log("LOAD COMPLETE");
        yield* Effect.log("=".repeat(50));

        let totalLoaded = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const { season: s, results } of allResults) {
          const seasonLoaded = results.reduce((sum, r) => sum + r.loaded, 0);
          const seasonSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
          const seasonErrors = results.reduce((sum, r) => sum + r.errors, 0);
          totalLoaded += seasonLoaded;
          totalSkipped += seasonSkipped;
          totalErrors += seasonErrors;

          yield* Effect.log(
            `  ${s}: ${seasonLoaded} loaded, ${seasonSkipped} skipped, ${seasonErrors} errors`,
          );
        }

        yield* Effect.log(
          `\nTotal: ${totalLoaded} loaded, ${totalSkipped} skipped, ${totalErrors} errors`,
        );
      }
    }),
);

// CLI application
const cli = Command.run(loadCommand, {
  name: "load",
  version: "1.0.0",
});

// Run
const MainLive = Layer.mergeAll(LoaderService.Default, BunContext.layer);

Effect.suspend(() => cli(process.argv)).pipe(
  Effect.provide(MainLive),
  Logger.withMinimumLogLevel(LogLevel.Info),
  Effect.tapErrorCause(Effect.logError),
  BunRuntime.runMain,
);
