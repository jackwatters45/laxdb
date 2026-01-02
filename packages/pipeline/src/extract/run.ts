/**
 * PLL Data Extraction CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/extract/run.ts --all
 *   infisical run --env=dev -- bun src/extract/run.ts --year=2024
 *   infisical run --env=dev -- bun src/extract/run.ts --year=2024 --no-details
 *   infisical run --env=dev -- bun src/extract/run.ts --year=2024 --force
 */

import { Effect, Layer } from "effect";
import { PLLExtractorService, PLLManifestService } from "./pll";
import { ExtractConfigService } from "./extract.config";
import { PLLClient } from "../pll/pll.client";

interface CliArgs {
  all: boolean;
  year: number | null;
  includeDetails: boolean;
  force: boolean;
  help: boolean;
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg ? parseInt(yearArg.split("=")[1] ?? "", 10) : null;

  return {
    all: args.includes("--all"),
    year,
    includeDetails: !args.includes("--no-details"),
    force: args.includes("--force"),
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  console.log(`
PLL Data Extraction CLI

Usage:
  bun src/extract/run.ts [options]

Options:
  --all           Extract all years (2019-2025)
  --year=YYYY     Extract specific year
  --no-details    Skip detail endpoints (faster)
  --force         Re-extract even if already done
  --help, -h      Show this help

Examples:
  infisical run --env=dev -- bun src/extract/run.ts --all
  infisical run --env=dev -- bun src/extract/run.ts --year=2024
  infisical run --env=dev -- bun src/extract/run.ts --year=2024 --no-details
  infisical run --env=dev -- bun src/extract/run.ts --all --force
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* PLLExtractorService;
    const options = {
      includeDetails: args.includeDetails,
      skipExisting: !args.force,
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

const main = async () => {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.all && !args.year) {
    console.error("Error: Must specify --all or --year=YYYY");
    printHelp();
    process.exit(1);
  }

  const program = runExtraction(args).pipe(Effect.provide(MainLive));

  try {
    await Effect.runPromise(program);
  } catch (error) {
    console.error("Extraction failed:", error);
    process.exit(1);
  }
};

await main();
