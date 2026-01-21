import { FileSystem } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { SystemError } from "@effect/platform/Error";
import { Effect, Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { GraphQLError } from "../api-client/graphql.service";
import {
  HttpError,
  NetworkError,
  ParseError,
  RateLimitError,
  TimeoutError,
} from "../error";

import { isCriticalError, saveJson } from "./util";

describe("saveJson", () => {
  const createTestLayer = (overrides: {
    makeDirectory?: (
      path: string,
      options?: FileSystem.MakeDirectoryOptions,
    ) => Effect.Effect<void, SystemError>;
    writeFileString?: (
      path: string,
      data: string,
    ) => Effect.Effect<void, SystemError>;
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
        Effect.fail(
          new SystemError({
            reason: "InvalidData",
            module: "FileSystem",
            method: "writeFileString",
            description: "Disk full",
            pathOrDescriptor: "/tmp/test.json",
          }),
        ),
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
        expect(error.error.message).toContain("Failed to write");
      }
    }
  });

  it("fails with descriptive error when directory creation fails", async () => {
    const TestLayer = createTestLayer({
      makeDirectory: () =>
        Effect.fail(
          new SystemError({
            reason: "PermissionDenied",
            module: "FileSystem",
            method: "makeDirectory",
            description: "Permission denied",
            pathOrDescriptor: "/root/forbidden",
          }),
        ),
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
        expect(error.error.message).toContain("Failed to write");
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

describe("isCriticalError", () => {
  it("returns true for NetworkError", () => {
    const error = new NetworkError({
      message: "DNS resolution failed",
      url: "http://example.com",
    });
    expect(isCriticalError(error)).toBe(true);
  });

  it("returns true for TimeoutError", () => {
    const error = new TimeoutError({
      message: "Request timed out",
      url: "http://example.com",
      timeoutMs: 5000,
    });
    expect(isCriticalError(error)).toBe(true);
  });

  it("returns true for RateLimitError", () => {
    const error = new RateLimitError({
      message: "Rate limit exceeded",
      url: "http://example.com",
      retryAfterMs: 60000,
    });
    expect(isCriticalError(error)).toBe(true);
  });

  it("returns true for HttpError with 5xx status", () => {
    const error500 = new HttpError({
      message: "Internal Server Error",
      url: "http://example.com",
      statusCode: 500,
    });
    const error502 = new HttpError({
      message: "Bad Gateway",
      url: "http://example.com",
      statusCode: 502,
    });
    const error503 = new HttpError({
      message: "Service Unavailable",
      url: "http://example.com",
      statusCode: 503,
    });

    expect(isCriticalError(error500)).toBe(true);
    expect(isCriticalError(error502)).toBe(true);
    expect(isCriticalError(error503)).toBe(true);
  });

  it("returns false for HttpError with 4xx status", () => {
    const error400 = new HttpError({
      message: "Bad Request",
      url: "http://example.com",
      statusCode: 400,
    });
    const error404 = new HttpError({
      message: "Not Found",
      url: "http://example.com",
      statusCode: 404,
    });
    const error422 = new HttpError({
      message: "Unprocessable Entity",
      url: "http://example.com",
      statusCode: 422,
    });

    expect(isCriticalError(error400)).toBe(false);
    expect(isCriticalError(error404)).toBe(false);
    expect(isCriticalError(error422)).toBe(false);
  });

  it("returns false for HttpError without statusCode", () => {
    const error = new HttpError({
      message: "Unknown error",
      url: "http://example.com",
    });
    expect(isCriticalError(error)).toBe(false);
  });

  it("returns false for ParseError", () => {
    const error = new ParseError({
      message: "Schema validation failed",
      url: "http://example.com",
    });
    expect(isCriticalError(error)).toBe(false);
  });

  it("returns false for ParseError without url", () => {
    const error = new ParseError({
      message: "Input validation failed",
    });
    expect(isCriticalError(error)).toBe(false);
  });

  it("returns false for GraphQLError", () => {
    const error = new GraphQLError({
      message: "GraphQL query failed",
      errors: [{ message: "Field 'name' not found" }],
    });
    expect(isCriticalError(error)).toBe(false);
  });
});
