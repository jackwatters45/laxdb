const SERIAL_TEST_PACKAGES = new Set(["@laxdb/core"]);

async function discoverTestPackages() {
  const packageJsonGlob = new Bun.Glob("packages/*/package.json");
  const packages = [];

  for await (const packageJsonPath of packageJsonGlob.scan({ cwd: Bun.cwd })) {
    const packageJson = await Bun.file(packageJsonPath).json();
    const testScript = packageJson.scripts?.test;

    if (typeof testScript !== "string") continue;

    const name =
      typeof packageJson.name === "string"
        ? packageJson.name
        : packageJsonPath.split("/").at(-2);
    const script =
      typeof packageJson.scripts?.["test:run"] === "string"
        ? "test:run"
        : "test";

    packages.push({
      name,
      dir: packageJsonPath.replace(/\/package\.json$/u, ""),
      script,
    });
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

async function runPackageTest(pkg) {
  console.log(`\n=== ${pkg.name}: test ===`);

  try {
    const subprocess = Bun.spawn(["bun", "run", pkg.script], {
      cwd: pkg.dir,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    return { pkg, code: await subprocess.exited, error: null };
  } catch (error) {
    return { pkg, code: 1, error };
  }
}

const packages = await discoverTestPackages();
const serialPackages = packages.filter((pkg) =>
  SERIAL_TEST_PACKAGES.has(pkg.name),
);
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
const parallelResultsPromise = Promise.all(
  parallelPackages.map(runPackageTest),
);

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
