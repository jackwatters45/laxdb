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
} from "./validate.service";

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const nllDir = path.join(config.outputDir, "nll");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating NLL extracted data...`);
  yield* Effect.log(`Output directory: ${nllDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // TODO: Implement validations in subsequent stories

  const report = buildReport("NLL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(nllDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
