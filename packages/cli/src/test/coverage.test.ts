import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CLI_ENTRYPOINTS, CLI_RPC_COVERAGE } from "../coverage";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const apiSrcRoot = path.join(repoRoot, "packages/api/src");
const cliPkgRoot = path.join(repoRoot, "packages/cli");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

async function getApiRpcNames() {
  const files = await walk(apiSrcRoot);
  const rpcFiles = files.filter((file) => file.endsWith(".rpc.ts"));
  const names = new Set<string>();

  for (const file of rpcFiles) {
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(/Rpc\.make\("([^"]+)"/g)) {
      names.add(match[1]);
    }
  }

  return [...names].toSorted();
}

function runHelp(entrypoint: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>(
    (resolve) => {
      const child = spawn("bun", ["run", `src/${entrypoint}.ts`, "--help"], {
        cwd: cliPkgRoot,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        resolve({ code, stdout, stderr });
      });
    },
  );
}

describe("CLI coverage", () => {
  it("tracks every RPC exposed by the API", async () => {
    await expect(getApiRpcNames()).resolves.toEqual([...CLI_RPC_COVERAGE]);
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
