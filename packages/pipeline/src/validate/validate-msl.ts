import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { ExtractConfigService } from "../extract/extract.config";

import type {
  FileValidationResult,
  CrossReferenceResult,
} from "./validate.schema";
import {
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
  crossReference,
  buildReport,
  printReport,
  validateFileExists,
} from "./validate.service";

// MSL Gamesheet years (currently available data)
const MSL_YEARS = [2023, 2024, 2025] as const;

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const mslDir = path.join(config.outputDir, "msl");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating MSL extracted data...`);
  yield* Effect.log(`Output directory: ${mslDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // TODO: Implement year-by-year validation (msl-validate-002+)

  const report = buildReport("MSL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(mslDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
