import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "@effect/vitest";

const cliPkgRoot = path.resolve(import.meta.dirname, "../..");
const cliSrcRoot = path.join(cliPkgRoot, "src");

async function getCliEntrypoints() {
  const entries = await readdir(cliSrcRoot, { withFileTypes: true });
  const entrypoints: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;

    const basename = entry.name.slice(0, -".ts".length);
    const file = path.join(cliSrcRoot, entry.name);
    const content = await readFile(file, "utf8");

    if (content.includes(`bun src/${basename}.ts`)) {
      entrypoints.push(basename);
    }
  }

  return entrypoints.toSorted((a, b) => a.localeCompare(b));
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

describe("CLI entrypoints", () => {
  it("boot with --help", async () => {
    const entrypoints = await getCliEntrypoints();

    expect(entrypoints.length).toBeGreaterThan(0);

    for (const entrypoint of entrypoints) {
      const result = await runHelp(entrypoint);
      expect(result.code, result.stderr).toBe(0);
      expect(result.stdout + result.stderr).toContain(entrypoint);
    }
  });
});
