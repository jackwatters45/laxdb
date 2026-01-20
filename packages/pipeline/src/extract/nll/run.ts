/**
 * NLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/nll/run.ts
 *   bun src/extract/nll/run.ts --season=225
 *   bun src/extract/nll/run.ts --force
 */

import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { NLLExtractorService } from "./nll.extractor";

interface CliArgs {
  seasonId: number;
  force: boolean;
  maxAgeHours: number | null;
  help: boolean;
}

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);

  const seasonArg = args.find((a) => a.startsWith("--season="));
  const seasonId = seasonArg
    ? parseInt(seasonArg.split("=")[1] ?? "", 10)
    : 225;

  const maxAgeArg = args.find((a) => a.startsWith("--max-age="));
  let maxAgeHours: number | null = null;
  if (maxAgeArg) {
    maxAgeHours = parseInt(maxAgeArg.split("=")[1] ?? "", 10);
  } else if (args.includes("--incremental")) {
    maxAgeHours = 24; // Default: 24 hours for incremental
  }

  return {
    seasonId,
    force: args.includes("--force"),
    maxAgeHours,
    help: args.includes("--help") || args.includes("-h"),
  };
};

const printHelp = () => {
  console.log(`
NLL Data Extraction CLI

Usage:
  bun src/extract/nll/run.ts [options]

Options:
  --season=ID       Extract specific season (default: 225)
  --force           Re-extract even if already done
  --max-age=HOURS   Re-extract if data is older than N hours
  --incremental     Alias for --max-age=24 (re-extract if older than 24h)
  --help, -h        Show this help

Examples:
  bun src/extract/nll/run.ts
  bun src/extract/nll/run.ts --season=225
  bun src/extract/nll/run.ts --force
  bun src/extract/nll/run.ts --incremental
  bun src/extract/nll/run.ts --max-age=12
`);
};

const runExtraction = (args: CliArgs) =>
  Effect.gen(function* () {
    const extractor = yield* NLLExtractorService;

    yield* extractor.extractSeason(args.seasonId, {
      skipExisting: !args.force,
      maxAgeHours: args.maxAgeHours,
    });
  });

const args = parseArgs();

if (args.help) {
  printHelp();
} else {
  const MainLayer = Layer.merge(NLLExtractorService.Default, BunContext.layer);
  BunRuntime.runMain(runExtraction(args).pipe(Effect.provide(MainLayer)));
}
