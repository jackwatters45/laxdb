import { FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { describe, it, expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import {
  validateFileExists,
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
  crossReference,
  buildReport,
} from "./validate.service";

const makeTempDir = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const tempBase = yield* fs.makeTempDirectoryScoped();
  return path.join(tempBase, "validate-test");
});

layer(BunContext.layer)("validateFileExists", (it) => {
  it.scoped("returns exists: true for existing file", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      yield* fs.makeDirectory(tempDir, { recursive: true });
      const filePath = path.join(tempDir, "test.json");
      yield* fs.writeFileString(filePath, "[]");

      const result = yield* validateFileExists(filePath);

      expect(result.exists).toBe(true);
      expect(result.filePath).toBe(filePath);
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.checks[0]?.passed).toBe(true);
    }),
  );

  it.scoped("returns exists: false for missing file", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      const filePath = path.join(tempDir, "nonexistent.json");

      const result = yield* validateFileExists(filePath);

      expect(result.exists).toBe(false);
      expect(result.checks[0]?.passed).toBe(false);
      expect(result.checks[0]?.issues[0]?.code).toBe("FILE_NOT_FOUND");
    }),
  );
});

layer(BunContext.layer)("validateJsonArray", (it) => {
  it.scoped("validates valid JSON array", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      yield* fs.makeDirectory(tempDir, { recursive: true });
      const filePath = path.join(tempDir, "valid.json");
      yield* fs.writeFileString(
        filePath,
        JSON.stringify([{ id: 1 }, { id: 2 }]),
      );

      const { result, data } = yield* validateJsonArray<{ id: number }>(
        filePath,
      );

      expect(result.exists).toBe(true);
      expect(result.recordCount).toBe(2);
      expect(data).toHaveLength(2);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    }),
  );

  it.scoped("fails when JSON is not an array", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      yield* fs.makeDirectory(tempDir, { recursive: true });
      const filePath = path.join(tempDir, "object.json");
      yield* fs.writeFileString(filePath, JSON.stringify({ key: "value" }));

      const { result } = yield* validateJsonArray(filePath);

      expect(result.exists).toBe(true);
      const parseCheck = result.checks.find(
        (c) => c.checkName === "json_parse",
      );
      expect(parseCheck?.passed).toBe(false);
      expect(parseCheck?.issues[0]?.code).toBe("NOT_ARRAY");
    }),
  );

  it.scoped("fails when array has fewer records than minimum", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      yield* fs.makeDirectory(tempDir, { recursive: true });
      const filePath = path.join(tempDir, "small.json");
      yield* fs.writeFileString(filePath, JSON.stringify([{ id: 1 }]));

      const { result } = yield* validateJsonArray(filePath, 10);

      const parseCheck = result.checks.find(
        (c) => c.checkName === "json_parse",
      );
      expect(parseCheck?.passed).toBe(false);
      expect(parseCheck?.issues[0]?.code).toBe("INSUFFICIENT_RECORDS");
    }),
  );

  it.scoped("returns empty data for missing file", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;
      const tempDir = yield* makeTempDir;
      const filePath = path.join(tempDir, "missing.json");

      const { result, data } = yield* validateJsonArray(filePath);

      expect(result.exists).toBe(false);
      expect(data).toHaveLength(0);
    }),
  );
});

describe("validateRequiredFields", () => {
  it.effect("passes when all required fields present", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ];

      const result = yield* validateRequiredFields(data, ["id", "name"]);

      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    }),
  );

  it.effect("fails when field is missing in all records", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: null },
        { id: "2", name: null },
      ];

      const result = yield* validateRequiredFields(data, ["id", "name"]);

      expect(result.passed).toBe(false);
      expect(result.issues[0]?.code).toBe("FIELD_ALL_MISSING");
    }),
  );

  it.effect("warns when field is missing in most records", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: null },
        { id: "3", name: null },
        { id: "4", name: null },
      ];

      const result = yield* validateRequiredFields(data, ["id", "name"]);

      expect(result.passed).toBe(true);
      const nameIssue = result.issues.find((i) => i.message.includes("name"));
      expect(nameIssue?.severity).toBe("warning");
      expect(nameIssue?.code).toBe("FIELD_MOSTLY_MISSING");
    }),
  );

  it.effect("reports info when field is missing in few records", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "Carol" },
        { id: "4", name: null },
      ];

      const result = yield* validateRequiredFields(data, ["id", "name"]);

      expect(result.passed).toBe(true);
      const nameIssue = result.issues.find((i) => i.message.includes("name"));
      expect(nameIssue?.severity).toBe("info");
      expect(nameIssue?.code).toBe("FIELD_SOME_MISSING");
    }),
  );
});

describe("validateUniqueField", () => {
  it.effect("passes when all values are unique", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "Carol" },
      ];

      const result = yield* validateUniqueField(data, "id");

      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    }),
  );

  it.effect("fails when duplicates exist", () =>
    Effect.gen(function* () {
      const data = [
        { id: "1", name: "Alice" },
        { id: "1", name: "Bob" },
        { id: "2", name: "Carol" },
      ];

      const result = yield* validateUniqueField(data, "id");

      expect(result.passed).toBe(false);
      expect(result.issues[0]?.code).toBe("DUPLICATE_VALUES");
    }),
  );

  it.effect("ignores null values when checking uniqueness", () =>
    Effect.gen(function* () {
      const data = [
        { id: null, name: "Alice" },
        { id: null, name: "Bob" },
        { id: "1", name: "Carol" },
      ];

      const result = yield* validateUniqueField(data, "id");

      expect(result.passed).toBe(true);
    }),
  );
});

describe("crossReference", () => {
  it.effect("returns full match when all source values exist in target", () =>
    Effect.gen(function* () {
      const source = [{ foreignKey: "A" }, { foreignKey: "B" }];
      const target = [{ id: "A" }, { id: "B" }, { id: "C" }];

      const result = yield* crossReference(
        source,
        target,
        "foreignKey",
        "id",
        "source.json",
        "target.json",
      );

      expect(result.totalSourceRecords).toBe(2);
      expect(result.matchedRecords).toBe(2);
      expect(result.unmatchedRecords).toBe(0);
      expect(result.unmatchedSamples).toBeUndefined();
    }),
  );

  it.effect("returns partial match when some values missing", () =>
    Effect.gen(function* () {
      const source = [
        { foreignKey: "A" },
        { foreignKey: "B" },
        { foreignKey: "X" },
      ];
      const target = [{ id: "A" }, { id: "B" }];

      const result = yield* crossReference(
        source,
        target,
        "foreignKey",
        "id",
        "source.json",
        "target.json",
      );

      expect(result.totalSourceRecords).toBe(3);
      expect(result.matchedRecords).toBe(2);
      expect(result.unmatchedRecords).toBe(1);
      expect(result.unmatchedSamples).toContain("X");
    }),
  );

  it.effect("handles null values in source data", () =>
    Effect.gen(function* () {
      const source = [{ foreignKey: "A" }, { foreignKey: null }];
      const target = [{ id: "A" }];

      const result = yield* crossReference(
        source,
        target,
        "foreignKey",
        "id",
        "source.json",
        "target.json",
      );

      expect(result.matchedRecords).toBe(1);
      expect(result.unmatchedRecords).toBe(1);
    }),
  );
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
