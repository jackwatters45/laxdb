import { NodeServices } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

const SERIAL_TEST_PACKAGES = new Set([
  "@laxdb/core",
  "@laxdb/api",
  "@laxdb/cli",
]);

const discoverTestPackages = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const path = yield* Path;
  const packagesDir = path.join(process.cwd(), "packages");
  const entries = yield* fs.readDirectory(packagesDir);

  const packages = yield* Effect.all(
    entries.map((entry) =>
      Effect.gen(function* () {
        const dir = path.join(packagesDir, entry);
        const info = yield* fs.stat(dir);
        if (info.type !== "Directory") return null;

        const packageJsonPath = path.join(dir, "package.json");
        const exists = yield* fs.exists(packageJsonPath);
        if (!exists) return null;

        const packageJson = JSON.parse(yield* fs.readFileString(packageJsonPath));
        return typeof packageJson.scripts?.test === "string"
          ? {
              name:
                typeof packageJson.name === "string" ? packageJson.name : entry,
              dir,
              script:
                typeof packageJson.scripts?.["test:run"] === "string"
                  ? "test:run"
                  : "test",
            }
          : null;
      }),
    ),
  );

  return packages
    .filter((pkg) => pkg !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const runPackageTest = (pkg) =>
  Effect.gen(function* () {
    yield* Console.log(`\n=== ${pkg.name}: test ===`);

    const handle = yield* ChildProcess.make("bun", ["run", pkg.script], {
      cwd: pkg.dir,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: process.env,
      extendEnv: true,
    });

    const exitCode = yield* handle.exitCode;

    return { pkg, exitCode };
  }).pipe(Effect.scoped);

const isFailure = (result) =>
  result.exitCode !== ChildProcessSpawner.ExitCode(0);

const program = Effect.gen(function* () {
  const packages = yield* discoverTestPackages;
  const serialPackages = packages.filter((pkg) =>
    SERIAL_TEST_PACKAGES.has(pkg.name),
  );
  const parallelPackages = packages.filter(
    (pkg) => !SERIAL_TEST_PACKAGES.has(pkg.name),
  );

  if (packages.length === 0) {
    yield* Console.log("No workspace test scripts found.");
    return 0;
  }

  yield* Console.log(
    `Discovered ${packages.length} workspace test package${packages.length === 1 ? "" : "s"}.`,
  );

  if (parallelPackages.length > 0) {
    yield* Console.log(
      `Running in parallel: ${parallelPackages.map((pkg) => pkg.name).join(", ")}`,
    );
  }

  if (serialPackages.length > 0) {
    yield* Console.log(
      `Running serially (shared DB state): ${serialPackages
        .map((pkg) => pkg.name)
        .join(", ")}`,
    );
  }

  const serialResults = yield* Effect.all(serialPackages.map(runPackageTest), {
    concurrency: 1,
  });
  const parallelResults = yield* Effect.all(parallelPackages.map(runPackageTest), {
    concurrency: "unbounded",
  });
  const failures = [...serialResults, ...parallelResults].filter(isFailure);

  if (failures.length > 0) {
    yield* Console.error("\nWorkspace test failures:");
    for (const failure of failures) {
      yield* Console.error(`- ${failure.pkg.name}`);
    }
    return 1;
  }

  yield* Console.log("\nAll workspace tests passed.");
  return 0;
});

const exitCode = await program.pipe(
  Effect.provide(NodeServices.layer),
  Effect.runPromise,
);

process.exitCode = exitCode;
