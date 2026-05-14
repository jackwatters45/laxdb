import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "@effect/vitest";

import { CLI_ENTRYPOINTS, CLI_HTTP_COVERAGE } from "../coverage";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const apiSrcRoot = path.join(repoRoot, "packages/api/src");
const cliPkgRoot = path.join(repoRoot, "packages/cli");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return Promise.resolve([fullPath]);
    }),
  );
  return files.flat();
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
async function getApiEndpointNames() {
  const files = await walk(apiSrcRoot);
  const apiFiles = files.filter((file) => file.endsWith(".api.ts"));
  const contents = await Promise.all(
    apiFiles.map(async (file) => ({
      file,
      content: await readFile(file, "utf8"),
    })),
  );
  const names = new Set<string>();

  for (const { content } of contents) {
    for (const match of content.matchAll(
      /HttpApiEndpoint\.\w+\(\s*"([^"]+)"/g,
    )) {
      names.add(match[1]);
    }
  }

  // oxlint-disable-next-line unicorn/no-array-sort -- typed Array#sort avoids a type-aware false positive on toSorted here
  return [...names].sort((a, b) => a.localeCompare(b));
}

async function runHelp(entrypoint: string) {
  const child = spawn("bun", ["run", `src/${entrypoint}.ts`, "--help"], {
    cwd: cliPkgRoot,
  });

  const timeout = setTimeout(() => {
    child.kill("SIGTERM");
  }, 5_000);

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  const [code, signal] = await new Promise<
    [number | null, NodeJS.Signals | null]
  >((resolve) => {
    child.once("close", (exitCode, exitSignal) => {
      resolve([exitCode, exitSignal]);
    });
  });
  clearTimeout(timeout);

  return {
    code,
    stdout,
    stderr:
      signal === "SIGTERM"
        ? `${stderr}\nTimed out waiting for --help output`
        : stderr,
  };
}

describe("CLI coverage", () => {
  it("keeps the coverage manifest sorted", () => {
    expect([...CLI_HTTP_COVERAGE]).toEqual(
      // oxlint-disable-next-line unicorn/no-array-sort -- typed Array#sort avoids a type-aware false positive on toSorted here
      [...CLI_HTTP_COVERAGE].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("tracks every HTTP endpoint exposed by the API", async () => {
    await expect(getApiEndpointNames()).resolves.toEqual([
      ...CLI_HTTP_COVERAGE,
    ]);
  });

  it.each(CLI_ENTRYPOINTS)(
    "%s entrypoint boots with --help",
    async (entrypoint) => {
      const result = await runHelp(entrypoint);
      expect(result.code).toBe(0);
      expect(result.stdout + result.stderr).toContain(entrypoint);
    },
  );
});
