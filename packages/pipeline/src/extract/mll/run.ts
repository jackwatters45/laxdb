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
  help: boolean;
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg ? parseInt(yearArg.split("=")[1] ?? "", 10) : 2019;

  return {
    year,
    all: args.includes("--all"),
    force: args.includes("--force"),
    withSchedule: args.includes("--with-schedule"),
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
  --help, -h        Show this help

Examples:
  bun src/extract/mll/run.ts
  bun src/extract/mll/run.ts --year=2006
  bun src/extract/mll/run.ts --all --with-schedule
  bun src/extract/mll/run.ts --year=2019 --force
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* MLLExtractorService;

    if (args.all) {
      yield* extractor.extractAll({
        skipExisting: !args.force,
        includeSchedule: args.withSchedule,
      });
    } else {
      yield* extractor.extractSeason(args.year, {
        skipExisting: !args.force,
        includeSchedule: args.withSchedule,
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
