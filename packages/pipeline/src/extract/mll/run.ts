/**
 * MLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/mll/run.ts
 *   bun src/extract/mll/run.ts --year=2019
 *   bun src/extract/mll/run.ts --all
 *   bun src/extract/mll/run.ts --with-schedule
 *   bun src/extract/mll/run.ts --force
 */

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { MLLExtractorService } from "./mll.extractor";

interface CliArgs {
  year: number;
  all: boolean;
  force: boolean;
  withSchedule: boolean;
  maxAgeHours: number | null;
  help: boolean;
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg ? parseInt(yearArg.split("=")[1] ?? "", 10) : 2019;

  const maxAgeArg = args.find((a) => a.startsWith("--max-age="));
  let maxAgeHours: number | null = null;
  if (maxAgeArg) {
    maxAgeHours = parseInt(maxAgeArg.split("=")[1] ?? "", 10);
  } else if (args.includes("--incremental")) {
    maxAgeHours = 24; // Default: 24 hours for incremental
  }

  return {
    year,
    all: args.includes("--all"),
    force: args.includes("--force"),
    withSchedule: args.includes("--with-schedule"),
    maxAgeHours,
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  console.log(`
MLL Data Extraction CLI

Usage:
  bun src/extract/mll/run.ts [options]

Options:
  --year=YYYY       Extract specific year (default: 2019)
  --all             Extract all seasons (2001-2020)
  --force           Re-extract even if already done
  --with-schedule   Include Wayback schedule extraction
  --max-age=HOURS   Re-extract if data is older than N hours
  --incremental     Alias for --max-age=24 (re-extract if older than 24h)
  --help, -h        Show this help

Examples:
  bun src/extract/mll/run.ts
  bun src/extract/mll/run.ts --year=2006
  bun src/extract/mll/run.ts --all --with-schedule
  bun src/extract/mll/run.ts --year=2019 --force
  bun src/extract/mll/run.ts --all --incremental
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* MLLExtractorService;

    if (args.all) {
      yield* extractor.extractAll({
        skipExisting: !args.force,
        includeSchedule: args.withSchedule,
        maxAgeHours: args.maxAgeHours,
      });
    } else {
      yield* extractor.extractSeason(args.year, {
        skipExisting: !args.force,
        includeSchedule: args.withSchedule,
        maxAgeHours: args.maxAgeHours,
      });
    }
  });

const args = parseArgs();

if (args.help) {
  printHelp();
} else {
  const MainLayer = Layer.merge(MLLExtractorService.Default, BunContext.layer);
  BunRuntime.runMain(runExtraction(args).pipe(Effect.provide(MainLayer)));
}
