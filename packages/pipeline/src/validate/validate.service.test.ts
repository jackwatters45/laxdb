import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { BunServices } from "@effect/platform-bun";
import { Effect, Scope } from "effect";
import { describe, expect, it } from "vitest";

import {
  buildReport,
  crossReference,
  validateFileExists,
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
} from "./validate.service";

const runScoped = <A, E>(effect: Effect.Effect<A, E, Scope.Scope>) =>
  Effect.runPromise(Effect.scoped(effect));

describe("validateFileExists", () => {
  it("returns exists: true for existing file", async () => {
    const result = await runScoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem;
        const path = yield* Path;
        const tempBase = yield* fs.makeTempDirectoryScoped();
        const tempDir = path.join(tempBase, "validate-test");
        yield* fs.makeDirectory(tempDir, { recursive: true });
        const filePath = path.join(tempDir, "test.json");
        yield* fs.writeFileString(filePath, "[]");
        return yield* validateFileExists(filePath);
      }).pipe(Effect.provide(BunServices.layer)),
    );

    expect(result.exists).toBe(true);
    expect(result.filePath).toContain("test.json");
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.checks[0]?.passed).toBe(true);
  });

  it("returns exists: false for missing file", async () => {
    const result = await runScoped(
      Effect.gen(function* () {
        const path = yield* Path;
        return yield* validateFileExists(
          path.join("/tmp", "validate-test", "nonexistent.json"),
        );
      }).pipe(Effect.provide(BunServices.layer)),
    );

    expect(result.exists).toBe(false);
    expect(result.checks[0]?.passed).toBe(false);
    expect(result.checks[0]?.issues[0]?.code).toBe("FILE_NOT_FOUND");
  });
});

describe("validateJsonArray", () => {
  it("validates valid JSON array", async () => {
    const { result, data } = await runScoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem;
        const path = yield* Path;
        const tempBase = yield* fs.makeTempDirectoryScoped();
        const tempDir = path.join(tempBase, "validate-test");
        yield* fs.makeDirectory(tempDir, { recursive: true });
        const filePath = path.join(tempDir, "valid.json");
        yield* fs.writeFileString(
          filePath,
          JSON.stringify([{ id: 1 }, { id: 2 }]),
        );
        return yield* validateJsonArray<{ id: number }>(filePath);
      }).pipe(Effect.provide(BunServices.layer)),
    );

    expect(result.exists).toBe(true);
    expect(result.recordCount).toBe(2);
    expect(data).toHaveLength(2);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("fails when JSON is not an array", async () => {
    const { result } = await runScoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem;
        const path = yield* Path;
        const tempBase = yield* fs.makeTempDirectoryScoped();
        const tempDir = path.join(tempBase, "validate-test");
        yield* fs.makeDirectory(tempDir, { recursive: true });
        const filePath = path.join(tempDir, "object.json");
        yield* fs.writeFileString(filePath, JSON.stringify({ key: "value" }));
        return yield* validateJsonArray(filePath);
      }).pipe(Effect.provide(BunServices.layer)),
    );

    expect(result.exists).toBe(true);
    const parseCheck = result.checks.find((c) => c.checkName === "json_parse");
    expect(parseCheck?.passed).toBe(false);
    expect(parseCheck?.issues[0]?.code).toBe("NOT_ARRAY");
  });

  it("fails when array has fewer records than minimum", async () => {
    const { result } = await runScoped(
      Effect.gen(function* () {
        const fs = yield* FileSystem;
        const path = yield* Path;
        const tempBase = yield* fs.makeTempDirectoryScoped();
        const tempDir = path.join(tempBase, "validate-test");
        yield* fs.makeDirectory(tempDir, { recursive: true });
        const filePath = path.join(tempDir, "small.json");
        yield* fs.writeFileString(filePath, JSON.stringify([{ id: 1 }]));
        return yield* validateJsonArray(filePath, 10);
      }).pipe(Effect.provide(BunServices.layer)),
    );

    const parseCheck = result.checks.find((c) => c.checkName === "json_parse");
    expect(parseCheck?.passed).toBe(false);
    expect(parseCheck?.issues[0]?.code).toBe("INSUFFICIENT_RECORDS");
  });

  it("returns empty data for missing file", async () => {
    const { result, data } = await runScoped(
      Effect.gen(function* () {
        const path = yield* Path;
        return yield* validateJsonArray(
          path.join("/tmp", "validate-test", "missing.json"),
        );
      }).pipe(Effect.provide(BunServices.layer)),
    );

    expect(result.exists).toBe(false);
    expect(data).toHaveLength(0);
  });
});

describe("validateRequiredFields", () => {
  it("passes when all required fields present", async () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ];

    const result = await Effect.runPromise(
      validateRequiredFields(data, ["id", "name"]),
    );

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails when field is missing in all records", async () => {
    const data = [
      { id: "1", name: null },
      { id: "2", name: null },
    ];

    const result = await Effect.runPromise(
      validateRequiredFields(data, ["id", "name"]),
    );

    expect(result.passed).toBe(false);
    expect(result.issues[0]?.code).toBe("FIELD_ALL_MISSING");
  });

  it("warns when field is missing in most records", async () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "2", name: null },
      { id: "3", name: null },
      { id: "4", name: null },
    ];

    const result = await Effect.runPromise(
      validateRequiredFields(data, ["id", "name"]),
    );

    expect(result.passed).toBe(true);
    const nameIssue = result.issues.find((i) => i.message.includes("name"));
    expect(nameIssue?.severity).toBe("warning");
    expect(nameIssue?.code).toBe("FIELD_MOSTLY_MISSING");
  });

  it("reports info when field is missing in few records", async () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Carol" },
      { id: "4", name: null },
    ];

    const result = await Effect.runPromise(
      validateRequiredFields(data, ["id", "name"]),
    );

    expect(result.passed).toBe(true);
    const nameIssue = result.issues.find((i) => i.message.includes("name"));
    expect(nameIssue?.severity).toBe("info");
    expect(nameIssue?.code).toBe("FIELD_SOME_MISSING");
  });
});

describe("validateUniqueField", () => {
  it("passes when all values are unique", async () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Carol" },
    ];

    const result = await Effect.runPromise(validateUniqueField(data, "id"));

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("fails when duplicates exist", async () => {
    const data = [
      { id: "1", name: "Alice" },
      { id: "1", name: "Bob" },
      { id: "2", name: "Carol" },
    ];

    const result = await Effect.runPromise(validateUniqueField(data, "id"));

    expect(result.passed).toBe(false);
    expect(result.issues[0]?.code).toBe("DUPLICATE_VALUES");
  });

  it("ignores null values when checking uniqueness", async () => {
    const data = [
      { id: null, name: "Alice" },
      { id: null, name: "Bob" },
      { id: "1", name: "Carol" },
    ];

    const result = await Effect.runPromise(validateUniqueField(data, "id"));

    expect(result.passed).toBe(true);
  });
});

describe("crossReference", () => {
  it("returns full match when all source values exist in target", async () => {
    const source = [{ foreignKey: "A" }, { foreignKey: "B" }];
    const target = [{ id: "A" }, { id: "B" }, { id: "C" }];

    const result = await Effect.runPromise(
      crossReference(source, target, "foreignKey", "id", "source.json", "target.json"),
    );

    expect(result.totalSourceRecords).toBe(2);
    expect(result.matchedRecords).toBe(2);
    expect(result.unmatchedRecords).toBe(0);
    expect(result.unmatchedSamples).toBeUndefined();
  });

  it("returns partial match when some values missing", async () => {
    const source = [
      { foreignKey: "A" },
      { foreignKey: "B" },
      { foreignKey: "X" },
    ];
    const target = [{ id: "A" }, { id: "B" }];

    const result = await Effect.runPromise(
      crossReference(source, target, "foreignKey", "id", "source.json", "target.json"),
    );

    expect(result.totalSourceRecords).toBe(3);
    expect(result.matchedRecords).toBe(2);
    expect(result.unmatchedRecords).toBe(1);
    expect(result.unmatchedSamples).toContain("X");
  });

  it("handles null values in source data", async () => {
    const source = [{ foreignKey: "A" }, { foreignKey: null }];
    const target = [{ id: "A" }];

    const result = await Effect.runPromise(
      crossReference(source, target, "foreignKey", "id", "source.json", "target.json"),
    );

    expect(result.matchedRecords).toBe(1);
    expect(result.unmatchedRecords).toBe(1);
  });
});

describe("buildReport", () => {
  it("builds valid report with summary", () => {
    const files = [
      {
        filePath: "/test/file1.json",
        exists: true,
        sizeBytes: 1000,
        recordCount: 10,
        checks: [
          { checkName: "check1", passed: true, issues: [], durationMs: 5 },
          {
            checkName: "check2",
            passed: false,
            issues: [
              { severity: "error" as const, code: "ERR", message: "Error" },
            ],
            durationMs: 3,
          },
        ],
      },
    ];

    const report = buildReport("TestSource", files, [], Date.now() - 100);

    expect(report.source).toBe("TestSource");
    expect(report.summary.totalChecks).toBe(2);
    expect(report.summary.passedChecks).toBe(1);
    expect(report.summary.failedChecks).toBe(1);
    expect(report.summary.errorCount).toBe(1);
    expect(report.overallValid).toBe(false);
  });

  it("marks report as valid when no errors", () => {
    const files = [
      {
        filePath: "/test/file1.json",
        exists: true,
        sizeBytes: 1000,
        recordCount: 10,
        checks: [
          { checkName: "check1", passed: true, issues: [], durationMs: 5 },
          {
            checkName: "check2",
            passed: true,
            issues: [
              {
                severity: "warning" as const,
                code: "WARN",
                message: "Warning",
              },
            ],
            durationMs: 3,
          },
        ],
      },
    ];

    const report = buildReport("TestSource", files, [], Date.now());

    expect(report.overallValid).toBe(true);
    expect(report.summary.warningCount).toBe(1);
    expect(report.summary.errorCount).toBe(0);
  });

  it("includes cross references in report", () => {
    const crossRefs = [
      {
        sourceFile: "source.json",
        targetFile: "target.json",
        sourceField: "fk",
        targetField: "id",
        totalSourceRecords: 100,
        matchedRecords: 90,
        unmatchedRecords: 10,
      },
    ];

    const report = buildReport("TestSource", [], crossRefs, Date.now());

    expect(report.crossReferences).toHaveLength(1);
    expect(report.crossReferences?.[0]?.matchedRecords).toBe(90);
  });
});
