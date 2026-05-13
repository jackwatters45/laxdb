import { spawn } from "node:child_process";
import path from "node:path";

import { ApiRpcNames } from "@laxdb/api/operation-catalog";
import { describe, expect, it } from "vitest";

import { CLI_ENTRYPOINTS, CLI_RPC_COVERAGE } from "../coverage";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const cliPkgRoot = path.join(repoRoot, "packages/cli");

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
    expect([...CLI_RPC_COVERAGE]).toEqual(
      // oxlint-disable-next-line unicorn/no-array-sort -- typed Array#sort avoids a type-aware false positive on toSorted here
      [...CLI_RPC_COVERAGE].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("tracks every RPC exposed by the API operation catalog", () => {
    expect([...CLI_RPC_COVERAGE]).toEqual([...ApiRpcNames]);
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
