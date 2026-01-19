import { FileSystem, Path } from "@effect/platform";
import { readJsonFile } from "@laxdb/core/util";
import { Effect, Schema } from "effect";

import {
  type ValidationIssue,
  type FileValidationResult,
  type CrossReferenceResult,
  type ValidationReport,
  errorIssue,
  warningIssue,
  infoIssue,
} from "./validate.schema";

const getFileStats = (filePath: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    return yield* fs.stat(filePath);
  }).pipe(Effect.catchAll(() => Effect.fail(new Error("File not found"))));

const runCheck = <R>(
  checkName: string,
  checkFn: () => Effect.Effect<(typeof ValidationIssue.Type)[], Error, R>,
) =>
  Effect.gen(function* () {
    const start = Date.now();
    const result = yield* checkFn().pipe(
      Effect.catchAll((e) =>
        Effect.succeed([errorIssue("CHECK_ERROR", e.message)]),
      ),
    );
    const durationMs = Date.now() - start;
    const hasErrors = result.some((i) => i.severity === "error");

    return {
      checkName,
      passed: !hasErrors,
      issues: result,
      durationMs,
    };
  });

export const validateFileExists = (filePath: string) =>
  Effect.gen(function* () {
    const statsResult = yield* getFileStats(filePath).pipe(
      Effect.map((s) => ({ success: true as const, stats: s })),
      Effect.catchAll(() =>
        Effect.succeed({ success: false as const, stats: null }),
      ),
    );

    if (!statsResult.success || !statsResult.stats) {
      return {
        filePath,
        exists: false,
        sizeBytes: undefined,
        recordCount: undefined,
        checks: [
          {
            checkName: "file_exists",
            passed: false,
            issues: [
              errorIssue("FILE_NOT_FOUND", `File not found: ${filePath}`),
            ],
            durationMs: 0,
          },
        ],
      } satisfies typeof FileValidationResult.Type;
    }

    return {
      filePath,
      exists: true,
      sizeBytes: Number(statsResult.stats.size),
      recordCount: undefined,
      checks: [
        {
          checkName: "file_exists",
          passed: true,
          issues: [],
          durationMs: 0,
        },
      ],
    } satisfies typeof FileValidationResult.Type;
  });

export const validateJsonArray = <T>(
  filePath: string,
  minRecords = 0,
  options?: { optional?: boolean },
) =>
  Effect.gen(function* () {
    const fileResult = yield* validateFileExists(filePath);

    if (!fileResult.exists) {
      // For optional files, don't report missing file as an error
      if (options?.optional) {
        return {
          result: {
            ...fileResult,
            checks: [
              {
                checkName: "file_exists",
                passed: true, // Treat as passed for optional files
                issues: [],
                durationMs: 0,
              },
            ],
          },
          data: [] as T[],
        };
      }
      return { result: fileResult, data: [] as T[] };
    }

    const parseCheck = yield* runCheck("json_parse", () =>
      Effect.gen(function* () {
        const data = yield* readJsonFile<unknown>(filePath);
        const issues: (typeof ValidationIssue.Type)[] = [];

        if (!Array.isArray(data)) {
          issues.push(
            errorIssue("NOT_ARRAY", `Expected array, got ${typeof data}`),
          );
          return issues;
        }

        if (data.length < minRecords) {
          issues.push(
            errorIssue(
              "INSUFFICIENT_RECORDS",
              `Expected at least ${minRecords} records, got ${data.length}`,
            ),
          );
        }

        return issues;
      }),
    );

    const data = yield* readJsonFile<T[]>(filePath).pipe(
      Effect.catchAll(() => Effect.succeed([] as T[])),
    );

    const { filePath: fp, exists, sizeBytes, checks } = fileResult;
    return {
      result: {
        filePath: fp,
        exists,
        sizeBytes,
        recordCount: Array.isArray(data) ? data.length : 0,
        checks: [...checks, parseCheck],
      } satisfies typeof FileValidationResult.Type,
      data,
    };
  });

export const validateSchema = <T, I>(
  data: unknown[],
  schema: Schema.Schema<T, I>,
  sampleSize = 10,
) =>
  runCheck("schema_validation", () =>
    Effect.gen(function* () {
      const issues: (typeof ValidationIssue.Type)[] = [];
      const samplesToCheck = data.slice(0, sampleSize);
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < samplesToCheck.length; i++) {
        const result = yield* Schema.decodeUnknown(schema)(
          samplesToCheck[i],
        ).pipe(
          Effect.map(() => true),
          Effect.catchAll(() => Effect.succeed(false)),
        );

        if (result) {
          validCount++;
        } else {
          invalidCount++;
          if (invalidCount <= 3) {
            issues.push(
              warningIssue(
                "SCHEMA_MISMATCH",
                `Record at index ${i} failed schema validation`,
                `[${i}]`,
              ),
            );
          }
        }
      }

      if (invalidCount > 0) {
        issues.push(
          infoIssue(
            "SCHEMA_SUMMARY",
            `Schema validation: ${validCount}/${samplesToCheck.length} passed (checked ${sampleSize} of ${data.length})`,
          ),
        );
      }

      return issues;
    }),
  );

export const validateRequiredFields = <T extends object>(
  data: T[],
  requiredFields: (keyof T)[],
) =>
  runCheck("required_fields", () =>
    Effect.succeed(
      (() => {
        const issues: (typeof ValidationIssue.Type)[] = [];
        const missingCounts: Record<string, number> = {};

        for (const record of data) {
          for (const field of requiredFields) {
            const value = record[field];
            if (value === null || value === undefined || value === "") {
              const key = String(field);
              missingCounts[key] = (missingCounts[key] ?? 0) + 1;
            }
          }
        }

        for (const [field, count] of Object.entries(missingCounts)) {
          const pct = ((count / data.length) * 100).toFixed(1);
          if (count === data.length) {
            issues.push(
              errorIssue(
                "FIELD_ALL_MISSING",
                `Field "${field}" is missing in all ${count} records`,
              ),
            );
          } else if (count > data.length * 0.5) {
            issues.push(
              warningIssue(
                "FIELD_MOSTLY_MISSING",
                `Field "${field}" is missing in ${count}/${data.length} records (${pct}%)`,
              ),
            );
          } else {
            issues.push(
              infoIssue(
                "FIELD_SOME_MISSING",
                `Field "${field}" is missing in ${count}/${data.length} records (${pct}%)`,
              ),
            );
          }
        }

        return issues;
      })(),
    ),
  );

export const validateUniqueField = <T extends object>(
  data: T[],
  field: keyof T,
) =>
  runCheck(`unique_${String(field)}`, () =>
    Effect.succeed(
      (() => {
        const issues: (typeof ValidationIssue.Type)[] = [];
        const seen = new Map<unknown, number>();
        const duplicates: { value: unknown; count: number }[] = [];

        for (const record of data) {
          const value = record[field];
          if (value !== null && value !== undefined) {
            seen.set(value, (seen.get(value) ?? 0) + 1);
          }
        }

        for (const [value, count] of seen.entries()) {
          if (count > 1) {
            duplicates.push({ value, count });
          }
        }

        if (duplicates.length > 0) {
          const sorted = duplicates.toSorted((a, b) => b.count - a.count);
          const samples = sorted.slice(0, 5);

          issues.push(
            errorIssue(
              "DUPLICATE_VALUES",
              `Field "${String(field)}" has ${duplicates.length} duplicate values`,
              String(field),
              {
                samples: samples.map((d) => `${String(d.value)} (${d.count}x)`),
              },
            ),
          );
        }

        return issues;
      })(),
    ),
  );

export const crossReference = <S extends object, T extends object>(
  sourceData: S[],
  targetData: T[],
  sourceField: keyof S,
  targetField: keyof T,
  sourceFile: string,
  targetFile: string,
) =>
  Effect.succeed(
    (() => {
      const targetValues = new Set<unknown>();
      for (const r of targetData) {
        const v = r[targetField];
        if (v !== null && v !== undefined) {
          targetValues.add(v);
        }
      }

      const unmatched: unknown[] = [];
      let matched = 0;

      for (const record of sourceData) {
        const value = record[sourceField];
        if (value !== null && value !== undefined) {
          if (targetValues.has(value)) {
            matched++;
          } else if (unmatched.length < 10) {
            unmatched.push(value);
          }
        }
      }

      return {
        sourceFile,
        targetFile,
        sourceField: String(sourceField),
        targetField: String(targetField),
        totalSourceRecords: sourceData.length,
        matchedRecords: matched,
        unmatchedRecords: sourceData.length - matched,
        unmatchedSamples: unmatched.length > 0 ? unmatched : undefined,
      } satisfies typeof CrossReferenceResult.Type;
    })(),
  );

export const buildReport = (
  source: string,
  files: (typeof FileValidationResult.Type)[],
  crossRefs: (typeof CrossReferenceResult.Type)[],
  startTime: number,
): typeof ValidationReport.Type => {
  let totalChecks = 0;
  let passedChecks = 0;
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const file of files) {
    for (const check of file.checks) {
      totalChecks++;
      if (check.passed) passedChecks++;

      for (const issue of check.issues) {
        if (issue.severity === "error") errorCount++;
        else if (issue.severity === "warning") warningCount++;
        else infoCount++;
      }
    }
  }

  return {
    source,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    summary: {
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      errorCount,
      warningCount,
      infoCount,
    },
    files,
    crossReferences: crossRefs.length > 0 ? crossRefs : undefined,
    overallValid: errorCount === 0,
  };
};

export const printReport = (report: typeof ValidationReport.Type) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    yield* Effect.log(`\n${"=".repeat(70)}`);
    yield* Effect.log(`VALIDATION REPORT: ${report.source}`);
    yield* Effect.log("=".repeat(70));
    yield* Effect.log(`Timestamp: ${report.timestamp}`);
    yield* Effect.log(`Duration: ${report.durationMs}ms`);
    yield* Effect.log(`\nSUMMARY:`);
    yield* Effect.log(
      `  Checks: ${report.summary.passedChecks}/${report.summary.totalChecks} passed`,
    );
    yield* Effect.log(`  Errors: ${report.summary.errorCount}`);
    yield* Effect.log(`  Warnings: ${report.summary.warningCount}`);
    yield* Effect.log(`  Info: ${report.summary.infoCount}`);

    yield* Effect.log(`\nFILES:`);
    for (const file of report.files) {
      const status = file.exists
        ? file.checks.every((c) => c.passed)
          ? "[OK]"
          : "[!!]"
        : "[--]";
      const size = file.sizeBytes
        ? `${(file.sizeBytes / 1024).toFixed(1)}KB`
        : "N/A";
      const count =
        file.recordCount === undefined ? "" : `${file.recordCount} records`;
      yield* Effect.log(
        `  ${status} ${path.basename(file.filePath)} (${size}, ${count})`,
      );

      for (const check of file.checks) {
        if (!check.passed || check.issues.length > 0) {
          for (const issue of check.issues) {
            const prefix =
              issue.severity === "error"
                ? "    [E]"
                : issue.severity === "warning"
                  ? "    [W]"
                  : "    [i]";
            yield* Effect.log(`${prefix} ${issue.message}`);
          }
        }
      }
    }

    if (report.crossReferences && report.crossReferences.length > 0) {
      yield* Effect.log(`\nCROSS-REFERENCES:`);
      for (const xref of report.crossReferences) {
        const matchPct = (
          (xref.matchedRecords / xref.totalSourceRecords) *
          100
        ).toFixed(1);
        const status = xref.unmatchedRecords === 0 ? "[OK]" : "[!!]";
        yield* Effect.log(
          `  ${status} ${path.basename(xref.sourceFile)}.${xref.sourceField} -> ${path.basename(xref.targetFile)}.${xref.targetField}`,
        );
        yield* Effect.log(
          `       Matched: ${xref.matchedRecords}/${xref.totalSourceRecords} (${matchPct}%)`,
        );
        if (xref.unmatchedSamples && xref.unmatchedSamples.length > 0) {
          yield* Effect.log(
            `       Unmatched samples: ${xref.unmatchedSamples.slice(0, 5).join(", ")}`,
          );
        }
      }
    }

    yield* Effect.log(`\n${"=".repeat(70)}`);
    yield* Effect.log(`OVERALL: ${report.overallValid ? "VALID" : "INVALID"}`);
    yield* Effect.log(`${"=".repeat(70)}\n`);
  });
