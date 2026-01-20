/**
 * PLL Data Extraction CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --all
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024 --no-details
 *   infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024 --force
 */

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { PLLClient } from "../../pll/pll.client";
import { ExtractConfigService } from "../extract.config";

import { PLLExtractorService } from "./pll.extractor";
import { PLLManifestService } from "./pll.manifest";

interface CliArgs {
  all: boolean;
  year: number | null;
  includeDetails: boolean;
  force: boolean;
  maxAgeHours: number | null;
  help: boolean;
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg ? parseInt(yearArg.split("=")[1] ?? "", 10) : null;

  const maxAgeArg = args.find((a) => a.startsWith("--max-age="));
  let maxAgeHours: number | null = null;
  if (maxAgeArg) {
    maxAgeHours = parseInt(maxAgeArg.split("=")[1] ?? "", 10);
  } else if (args.includes("--incremental")) {
    maxAgeHours = 24; // Default: 24 hours for incremental
  }

  return {
    all: args.includes("--all"),
    year,
    includeDetails: !args.includes("--no-details"),
    force: args.includes("--force"),
    maxAgeHours,
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  console.log(`
PLL Data Extraction CLI

Usage:
  bun src/extract/pll/run.ts [options]

Options:
  --all             Extract all years (2019-2025)
  --year=YYYY       Extract specific year
  --no-details      Skip detail endpoints (faster)
  --force           Re-extract even if already done
  --max-age=HOURS   Re-extract if data is older than N hours
  --incremental     Alias for --max-age=24 (re-extract if older than 24h)
  --help, -h        Show this help

Examples:
  infisical run --env=dev -- bun src/extract/pll/run.ts --all
  infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024
  infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024 --no-details
  infisical run --env=dev -- bun src/extract/pll/run.ts --all --force
  infisical run --env=dev -- bun src/extract/pll/run.ts --year=2024 --incremental
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* PLLExtractorService;
    const options = {
      includeDetails: args.includeDetails,
      skipExisting: !args.force,
      maxAgeHours: args.maxAgeHours,
    };

    if (args.all) {
      yield* extractor.extractAll(options);
    } else if (args.year) {
      if (args.year < 2019 || args.year > 2030) {
        return yield* Effect.fail(
          `Invalid year ${args.year}. Must be 2019-2030.`,
        );
      }
      yield* extractor.extractYear(args.year, options);
    }
  });

const MainLive = Layer.mergeAll(
  PLLClient.Default,
  ExtractConfigService.Default,
).pipe(
  Layer.provideMerge(PLLManifestService.Default),
  Layer.provideMerge(PLLExtractorService.Default),
);

const args = parseArgs();

if (args.help) {
  printHelp();
} else if (!args.all && !args.year) {
  console.error("Error: Must specify --all or --year=YYYY");
  printHelp();
  process.exit(1);
} else {
  const MainLayer = Layer.merge(MainLive, BunContext.layer);
  BunRuntime.runMain(runExtraction(args).pipe(Effect.provide(MainLayer)));
}
