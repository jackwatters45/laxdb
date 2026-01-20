import { FileSystem } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { saveJson } from "./util";

describe("saveJson", () => {
  const createTestLayer = (overrides: {
    makeDirectory?: (
      path: string,
      options?: FileSystem.MakeDirectoryOptions,
    ) => Effect.Effect<void, Error>;
    writeFileString?: (
      path: string,
      data: string,
    ) => Effect.Effect<void, Error>;
  }) => {
    const baseMock = {
      makeDirectory: () => Effect.void,
      writeFileString: () => Effect.void,
    };

    const MockFS = Layer.succeed(FileSystem.FileSystem, {
      ...baseMock,
      ...overrides,
    } as unknown as FileSystem.FileSystem);

    return Layer.provideMerge(MockFS, BunContext.layer);
  };

  it("creates directory and writes file successfully", async () => {
    let dirCreated = false;
    let fileWritten = false;
    let writtenPath = "";
    let writtenContent = "";

    const TestLayer = createTestLayer({
      makeDirectory: () => {
        dirCreated = true;
        return Effect.void;
      },
      writeFileString: (path: string, content: string) => {
        fileWritten = true;
        writtenPath = path;
        writtenContent = content;
        return Effect.void;
      },
    });

    const result = await Effect.runPromiseExit(
      saveJson("/tmp/test/data.json", { foo: "bar" }).pipe(
        Effect.provide(TestLayer),
      ),
    );

    expect(Exit.isSuccess(result)).toBe(true);
    expect(dirCreated).toBe(true);
    expect(fileWritten).toBe(true);
    expect(writtenPath).toBe("/tmp/test/data.json");
    expect(JSON.parse(writtenContent)).toEqual({ foo: "bar" });
  });

  it("fails with descriptive error when write fails", async () => {
    const TestLayer = createTestLayer({
      makeDirectory: () => Effect.void,
      writeFileString: () =>
        Effect.fail(new Error("Disk full")) as Effect.Effect<void, Error>,
    });

    const result = await Effect.runPromiseExit(
      saveJson("/tmp/test.json", { foo: "bar" }).pipe(
        Effect.provide(TestLayer),
      ),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      const error = result.cause;
      expect(error._tag).toBe("Fail");
      if (error._tag === "Fail") {
        expect(error.error).toBeInstanceOf(Error);
        expect(error.error.message).toContain("Failed to write /tmp/test.json");
      }
    }
  });

  it("fails with descriptive error when directory creation fails", async () => {
    const TestLayer = createTestLayer({
      makeDirectory: () =>
        Effect.fail(new Error("Permission denied")) as Effect.Effect<
          void,
          Error
        >,
    });

    const result = await Effect.runPromiseExit(
      saveJson("/root/forbidden/test.json", { foo: "bar" }).pipe(
        Effect.provide(TestLayer),
      ),
    );

    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      const error = result.cause;
      expect(error._tag).toBe("Fail");
      if (error._tag === "Fail") {
        expect(error.error).toBeInstanceOf(Error);
        expect(error.error.message).toContain(
          "Failed to write /root/forbidden/test.json",
        );
      }
    }
  });

  it("properly serializes complex data with formatting", async () => {
    let writtenContent = "";

    const TestLayer = createTestLayer({
      makeDirectory: () => Effect.void,
      writeFileString: (_: string, content: string) => {
        writtenContent = content;
        return Effect.void;
      },
    });

    const complexData = {
      teams: [
        { id: 1, name: "Team A" },
        { id: 2, name: "Team B" },
      ],
      metadata: { year: 2024 },
    };

    await Effect.runPromise(
      saveJson("/tmp/complex.json", complexData).pipe(
        Effect.provide(TestLayer),
      ),
    );

    // Check it's formatted with 2-space indentation
    expect(writtenContent).toContain("\n");
    expect(writtenContent).toContain("  ");
    expect(JSON.parse(writtenContent)).toEqual(complexData);
  });
});
