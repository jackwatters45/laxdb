import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SERIAL_TEST_PACKAGES = new Set([
  "@laxdb/core",
  "@laxdb/api",
  "@laxdb/cli",
]);

async function discoverTestPackages() {
  const packagesDir = path.join(process.cwd(), "packages");
  const entries = await readdir(packagesDir, { withFileTypes: true });

  const packages = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dir = path.join(packagesDir, entry.name);
        const packageJsonPath = path.join(dir, "package.json");

        try {
          const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
          return typeof packageJson.scripts?.test === "string"
            ? {
                name:
                  typeof packageJson.name === "string"
                    ? packageJson.name
                    : entry.name,
                dir,
                script:
                  typeof packageJson.scripts?.["test:run"] === "string"
                    ? "test:run"
                    : "test",
              }
            : null;
        } catch (error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            return null;
          }
          throw error;
        }
      }),
  );

  return packages.filter((pkg) => pkg !== null).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function runPackageTest(pkg) {
  return new Promise((resolve) => {
    console.log(`\n=== ${pkg.name}: test ===`);

    const child = spawn("bun", ["run", pkg.script], {
      cwd: pkg.dir,
      stdio: "inherit",
      env: process.env,
    });

    child.once("error", (error) => {
      resolve({ pkg, code: 1, error });
    });

    child.once("close", (code) => {
      resolve({ pkg, code: code ?? 1, error: null });
    });
  });
}

const packages = await discoverTestPackages();
const serialPackages = packages.filter((pkg) => SERIAL_TEST_PACKAGES.has(pkg.name));
const parallelPackages = packages.filter(
  (pkg) => !SERIAL_TEST_PACKAGES.has(pkg.name),
);

if (packages.length === 0) {
  console.log("No workspace test scripts found.");
  process.exit(0);
}

console.log(
  `Discovered ${packages.length} workspace test package${packages.length === 1 ? "" : "s"}.`,
);

if (parallelPackages.length > 0) {
  console.log(
    `Running in parallel: ${parallelPackages.map((pkg) => pkg.name).join(", ")}`,
  );
}

if (serialPackages.length > 0) {
  console.log(
    `Running serially (shared DB state): ${serialPackages
      .map((pkg) => pkg.name)
      .join(", ")}`,
  );
}

const failures = [];
const parallelResultsPromise = Promise.all(parallelPackages.map(runPackageTest));

for (const pkg of serialPackages) {
  const result = await runPackageTest(pkg);
  if (result.code !== 0) {
    failures.push(result);
  }
}

const parallelResults = await parallelResultsPromise;
for (const result of parallelResults) {
  if (result.code !== 0) {
    failures.push(result);
  }
}

if (failures.length > 0) {
  console.error("\nWorkspace test failures:");
  for (const failure of failures) {
    console.error(`- ${failure.pkg.name}`);
    if (failure.error) {
      console.error(`  ${String(failure.error)}`);
    }
  }
  process.exit(1);
}

console.log("\nAll workspace tests passed.");
