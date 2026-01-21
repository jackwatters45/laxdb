/**
 * NLL Data Extraction CLI
 *
 * Usage:
 *   bun src/extract/nll/run.ts
 *   bun src/extract/nll/run.ts --season 225
 *   bun src/extract/nll/run.ts --force
 *   bun src/extract/nll/run.ts --incremental
 *   bun src/extract/nll/run.ts --json
 *   bun src/extract/nll/run.ts --status
 */

import { Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer, LogLevel, Logger } from "effect";

import {
  forceOption,
  getMode,
  incrementalOption,
  jsonOption,
  statusOption,
} from "../cli-utils";

import { NLLExtractorService } from "./nll.extractor";
import { NLLManifestService } from "./nll.manifest";

const seasonOption = Options.integer("season").pipe(
  Options.withAlias("s"),
  Options.withDescription("Season ID to extract"),
  Options.withDefault(225),
);

// Main command
const nllCommand = Command.make(
  "nll",
  {
    season: seasonOption,
    force: forceOption,
    incremental: incrementalOption,
    json: jsonOption,
    status: statusOption,
  },
  ({ season, force, incremental, json, status }) =>
    Effect.gen(function* () {
      // Handle --status flag
      if (status) {
        const manifestService = yield* NLLManifestService;
        const manifest = yield* manifestService.load;
        if (json) {
          yield* Console.log(JSON.stringify(manifest, null, 2));
        } else {
          yield* Console.log(
            `NLL Extraction Status (last run: ${manifest.lastRun || "never"})`,
          );
          for (const [seasonId, seasonManifest] of Object.entries(
            manifest.seasons,
          )) {
            yield* Console.log(`\nSeason ${seasonId}:`);
            for (const [entity, entityStatus] of Object.entries(
              seasonManifest as Record<
                string,
                { extracted: boolean; count: number }
              >,
            )) {
              const st = entityStatus?.extracted
                ? `✓ ${entityStatus.count} items`
                : "✗ not extracted";
              yield* Console.log(`  ${entity}: ${st}`);
            }
          }
        }
        return;
      }

      const extractor = yield* NLLExtractorService;
      const mode = getMode(force, incremental);

      if (!json) {
        yield* Effect.log(`Extraction mode: ${mode}`);
      }
      const manifest = yield* extractor.extractSeason(season, { mode });
      if (json) {
        yield* Effect.sync(() => {
          console.log(JSON.stringify(manifest, null, 2));
        });
      }
    }).pipe(json ? Logger.withMinimumLogLevel(LogLevel.None) : (x) => x),
);

// CLI runner
const cli = Command.run(nllCommand, {
  name: "NLL Extractor",
  version: "1.0.0",
});

// Run with dependencies
cli(process.argv).pipe(
  Effect.provide(
    Layer.mergeAll(
      NLLExtractorService.Default,
      NLLManifestService.Default,
      BunContext.layer,
    ),
  ),
  BunRuntime.runMain,
);
