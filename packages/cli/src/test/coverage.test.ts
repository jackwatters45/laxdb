import { NodeServices } from "@effect/platform-node";
import { Effect, Stream } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { PlatformError } from "effect/PlatformError";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { describe, expect, it } from "vitest";

import { CLI_ENTRYPOINTS, CLI_HTTP_COVERAGE } from "../coverage";

type TestPlatform = FileSystem | Path | ChildProcessSpawner.ChildProcessSpawner;

const repoRoot = new URL("../../../..", import.meta.url).pathname;

const TestPlatformLive = NodeServices.layer;

function collectText(
  stream: Stream.Stream<Uint8Array, PlatformError>,
): Effect.Effect<string, PlatformError> {
  return Effect.gen(function* () {
    const chunks = yield* Stream.runCollect(stream);
    const totalLength = chunks.reduce(
      (total, chunk) => total + chunk.length,
      0,
    );
    const bytes = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(bytes);
  });
}

function walk(
  dir: string,
): Effect.Effect<string[], PlatformError, FileSystem | Path> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entries = yield* fs.readDirectory(dir);
    const files = yield* Effect.all(
      entries.map((entry) =>
        Effect.gen(function* () {
          const fullPath = path.join(dir, entry);
          const info = yield* fs.stat(fullPath);

          if (info.type === "Directory") return yield* walk(fullPath);
          if (info.type === "File") return [fullPath];
          return [];
        }),
      ),
    );

    return files.flat();
  });
}

/**
 * Extract all endpoint names from the API source by matching
 * HttpApiEndpoint.method("...") calls.
 *
 * Assumption: all endpoints use the string literal form
 * `HttpApiEndpoint.post("name", ...)`. If the codebase ever uses template
 * literals or re-exported endpoint definitions this regex will miss them and
 * the test will fail — update the pattern accordingly.
 */
function getApiEndpointNames(): Effect.Effect<
  string[],
  PlatformError,
  FileSystem | Path
> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const apiSrcRoot = path.join(repoRoot, "packages/api/src");
    const files = yield* walk(apiSrcRoot);
    const apiFiles = files.filter((file) => file.endsWith(".api.ts"));
    const contents = yield* Effect.all(
      apiFiles.map((file) => fs.readFileString(file)),
    );
    const names = new Set<string>();

    for (const content of contents) {
      for (const match of content.matchAll(
        /HttpApiEndpoint\.\w+\(\s*"([^"]+)"/g,
      )) {
        names.add(match[1]);
      }
    }

    // oxlint-disable-next-line unicorn/no-array-sort -- typed Array#sort avoids a type-aware false positive on toSorted here
    return [...names].sort((a, b) => a.localeCompare(b));
  });
}

function runHelp(entrypoint: string) {
  return Effect.gen(function* () {
    const path = yield* Path;
    const cliPkgRoot = path.join(repoRoot, "packages/cli");
    const handle = yield* ChildProcess.make(
      "bun",
      ["run", `src/${entrypoint}.ts`, "--help"],
      { cwd: cliPkgRoot },
    );
    const [stdout, stderr, code] = yield* Effect.all(
      [collectText(handle.stdout), collectText(handle.stderr), handle.exitCode],
      { concurrency: "unbounded" },
    );

    return { code, stdout, stderr };
  }).pipe(
    Effect.scoped,
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () =>
        Effect.fail(new Error("Timed out waiting for --help output")),
    }),
  );
}

const runTestEffect = <A, E>(effect: Effect.Effect<A, E, TestPlatform>) =>
  effect.pipe(Effect.provide(TestPlatformLive), Effect.runPromise);

describe("CLI coverage", () => {
  it("keeps the coverage manifest sorted", () => {
    expect([...CLI_HTTP_COVERAGE]).toEqual(
      // oxlint-disable-next-line unicorn/no-array-sort -- typed Array#sort avoids a type-aware false positive on toSorted here
      [...CLI_HTTP_COVERAGE].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("tracks every HTTP endpoint exposed by the API", async () => {
    await expect(runTestEffect(getApiEndpointNames())).resolves.toEqual([
      ...CLI_HTTP_COVERAGE,
    ]);
  });

  it.each(CLI_ENTRYPOINTS)(
    "%s entrypoint boots with --help",
    async (entrypoint) => {
      const result = await runTestEffect(runHelp(entrypoint));
      expect(result.code).toBe(ChildProcessSpawner.ExitCode(0));
      expect(result.stdout + result.stderr).toContain(entrypoint);
    },
  );
});
