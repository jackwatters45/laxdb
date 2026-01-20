/**
 * MSL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/msl/run.ts
 *   bun src/extract/msl/run.ts --season=9567
 *   bun src/extract/msl/run.ts --all
 *   bun src/extract/msl/run.ts --force
 */

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { MSL_GAMESHEET_SEASONS } from "../../msl/msl.schema";

import { MSLExtractorService } from "./msl.extractor";

interface CliArgs {
  season: number;
  all: boolean;
  force: boolean;
  maxAgeHours: number | null;
  help: boolean;
}

// Get most recent season ID as default (2024-25 season)
const DEFAULT_SEASON_ID = 9567;

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const seasonArg = args.find((a) => a.startsWith("--season="));
  const season = seasonArg
    ? parseInt(seasonArg.split("=")[1] ?? "", 10)
    : DEFAULT_SEASON_ID;

  const maxAgeArg = args.find((a) => a.startsWith("--max-age="));
  let maxAgeHours: number | null = null;
  if (maxAgeArg) {
    maxAgeHours = parseInt(maxAgeArg.split("=")[1] ?? "", 10);
  } else if (args.includes("--incremental")) {
    maxAgeHours = 24; // Default: 24 hours for incremental
  }

  return {
    season,
    all: args.includes("--all"),
    force: args.includes("--force"),
    maxAgeHours,
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  const seasons = Object.entries(MSL_GAMESHEET_SEASONS)
    .map(([year, id]) => `  ${id} = ${year} season`)
    .join("\n");

  console.log(`
MSL Data Extraction CLI

Usage:
  bun src/extract/msl/run.ts [options]

Options:
  --season=ID       Extract specific season by Gamesheet ID (default: ${DEFAULT_SEASON_ID})
  --all             Extract all seasons (2023-2025)
  --force           Re-extract even if already done
  --max-age=HOURS   Re-extract if data is older than N hours
  --incremental     Alias for --max-age=24 (re-extract if older than 24h)
  --help, -h        Show this help

Available Seasons:
${seasons}

Examples:
  bun src/extract/msl/run.ts
  bun src/extract/msl/run.ts --season=9567
  bun src/extract/msl/run.ts --all
  bun src/extract/msl/run.ts --season=9567 --force
  bun src/extract/msl/run.ts --all --incremental
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* MSLExtractorService;

    if (args.all) {
      yield* extractor.extractAll({
        skipExisting: !args.force,
        maxAgeHours: args.maxAgeHours,
      });
    } else {
      yield* extractor.extractSeason(args.season, {
        skipExisting: !args.force,
        maxAgeHours: args.maxAgeHours,
      });
    }
  });

const args = parseArgs();

if (args.help) {
  printHelp();
} else {
  const MainLayer = Layer.merge(MSLExtractorService.Default, BunContext.layer);
  BunRuntime.runMain(runExtraction(args).pipe(Effect.provide(MainLayer)));
}
