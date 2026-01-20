/**
 * WLA Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/wla/run.ts
 *   bun src/extract/wla/run.ts --season=2024
 *   bun src/extract/wla/run.ts --all
 *   bun src/extract/wla/run.ts --force
 *   bun src/extract/wla/run.ts --schedule
 */

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { WLAExtractorService } from "./wla.extractor";

interface CliArgs {
  season: number;
  all: boolean;
  force: boolean;
  schedule: boolean;
  maxAgeHours: number | null;
  help: boolean;
}

// Default to current year
const DEFAULT_SEASON = new Date().getFullYear();

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const seasonArg = args.find((a) => a.startsWith("--season="));
  const season = seasonArg
    ? parseInt(seasonArg.split("=")[1] ?? "", 10)
    : DEFAULT_SEASON;

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
    schedule: args.includes("--schedule"),
    maxAgeHours,
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  console.log(`
WLA Data Extraction CLI

Usage:
  bun src/extract/wla/run.ts [options]

Options:
  --season=YYYY     Extract specific season by year (default: ${DEFAULT_SEASON})
  --all             Extract all seasons (2005-2025)
  --force           Re-extract even if already done
  --schedule        Include schedule extraction
  --max-age=HOURS   Re-extract if data is older than N hours
  --incremental     Alias for --max-age=24 (re-extract if older than 24h)
  --help, -h        Show this help

Available Seasons: 2005-2025

Examples:
  bun src/extract/wla/run.ts
  bun src/extract/wla/run.ts --season=2024
  bun src/extract/wla/run.ts --all
  bun src/extract/wla/run.ts --season=2024 --force --schedule
  bun src/extract/wla/run.ts --all --incremental
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* WLAExtractorService;

    if (args.all) {
      yield* extractor.extractAll({
        skipExisting: !args.force,
        includeSchedule: args.schedule,
        maxAgeHours: args.maxAgeHours,
      });
    } else {
      yield* extractor.extractSeason(args.season, {
        skipExisting: !args.force,
        includeSchedule: args.schedule,
        maxAgeHours: args.maxAgeHours,
      });
    }
  });

const args = parseArgs();

if (args.help) {
  printHelp();
} else {
  const MainLayer = Layer.merge(WLAExtractorService.Default, BunContext.layer);
  BunRuntime.runMain(runExtraction(args).pipe(Effect.provide(MainLayer)));
}
