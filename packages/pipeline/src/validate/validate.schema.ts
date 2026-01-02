import { Schema } from "effect";

export type Severity = "error" | "warning" | "info";

export class ValidationIssue extends Schema.Class<ValidationIssue>(
  "ValidationIssue",
)({
  severity: Schema.Literal("error", "warning", "info"),
  code: Schema.String,
  message: Schema.String,
  path: Schema.optional(Schema.String),
  context: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
}) {}

export class ValidationCheckResult extends Schema.Class<ValidationCheckResult>(
  "ValidationCheckResult",
)({
  checkName: Schema.String,
  passed: Schema.Boolean,
  issues: Schema.Array(ValidationIssue),
  durationMs: Schema.Number,
}) {}

export class FileValidationResult extends Schema.Class<FileValidationResult>(
  "FileValidationResult",
)({
  filePath: Schema.String,
  exists: Schema.Boolean,
  sizeBytes: Schema.optional(Schema.Number),
  recordCount: Schema.optional(Schema.Number),
  checks: Schema.Array(ValidationCheckResult),
}) {}

export class CrossReferenceResult extends Schema.Class<CrossReferenceResult>(
  "CrossReferenceResult",
)({
  sourceFile: Schema.String,
  targetFile: Schema.String,
  sourceField: Schema.String,
  targetField: Schema.String,
  totalSourceRecords: Schema.Number,
  matchedRecords: Schema.Number,
  unmatchedRecords: Schema.Number,
  unmatchedSamples: Schema.optional(Schema.Array(Schema.Unknown)),
}) {}

export class DatasetStats extends Schema.Class<DatasetStats>("DatasetStats")({
  totalRecords: Schema.Number,
  uniqueValues: Schema.Record({ key: Schema.String, value: Schema.Number }),
  nullCounts: Schema.Record({ key: Schema.String, value: Schema.Number }),
  valueRanges: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Struct({
        min: Schema.Unknown,
        max: Schema.Unknown,
      }),
    }),
  ),
}) {}

export class ValidationReport extends Schema.Class<ValidationReport>(
  "ValidationReport",
)({
  source: Schema.String,
  timestamp: Schema.String,
  durationMs: Schema.Number,
  summary: Schema.Struct({
    totalChecks: Schema.Number,
    passedChecks: Schema.Number,
    failedChecks: Schema.Number,
    errorCount: Schema.Number,
    warningCount: Schema.Number,
    infoCount: Schema.Number,
  }),
  files: Schema.Array(FileValidationResult),
  crossReferences: Schema.optional(Schema.Array(CrossReferenceResult)),
  overallValid: Schema.Boolean,
}) {}

export const createIssue = (
  severity: Severity,
  code: string,
  message: string,
  path?: string,
  context?: Record<string, unknown>,
): typeof ValidationIssue.Type => ({
  severity,
  code,
  message,
  path,
  context,
});

export const errorIssue = (
  code: string,
  message: string,
  path?: string,
  context?: Record<string, unknown>,
) => createIssue("error", code, message, path, context);

export const warningIssue = (
  code: string,
  message: string,
  path?: string,
  context?: Record<string, unknown>,
) => createIssue("warning", code, message, path, context);

export const infoIssue = (
  code: string,
  message: string,
  path?: string,
  context?: Record<string, unknown>,
) => createIssue("info", code, message, path, context);
