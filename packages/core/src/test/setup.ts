import { Client } from "pg";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://test:test@localhost:5433/laxdb_test";

async function waitForDb(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const client = new Client({
        connectionString: TEST_DATABASE_URL,
        ssl: false,
      });
      // oxlint-disable-next-line no-await-in-loop -- sequential retry loop
      await client.connect();
      // oxlint-disable-next-line no-await-in-loop -- must close before retry
      await client.end();
      return true;
    } catch {
      if (i === maxAttempts - 1) {
        console.warn(
          "⚠ Test database not reachable — integration tests will be skipped.",
        );
        return false;
      }
      // oxlint-disable-next-line no-await-in-loop -- intentional backoff
      await new Promise<void>((r) => {
        setTimeout(r, 1000);
      });
    }
  }
  return false;
}

async function applyMigrations() {
  const migrationsDir = new URL("../../migrations", import.meta.url).pathname;
  const { readdir, readFile } = await import("node:fs/promises");
  const path = await import("node:path");

  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const migrationDirs = entries
    .filter((e) => e.isDirectory())
    .toSorted((a, b) => a.name.localeCompare(b.name));

  const client = new Client({
    connectionString: TEST_DATABASE_URL,
    ssl: false,
  });
  await client.connect();

  try {
    const migrationStatements = await Promise.all(
      migrationDirs.map(async (dir) => {
        const sqlPath = path.join(migrationsDir, dir.name, "migration.sql");
        const sql = await readFile(sqlPath, "utf-8");
        return sql
          .split("--> statement-breakpoint")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
    );

    for (const statements of migrationStatements) {
      try {
        for (const stmt of statements) {
          // oxlint-disable-next-line no-await-in-loop -- must run migrations sequentially
          await client.query(stmt);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          !msg.includes("already exists") &&
          !msg.includes("duplicate key") &&
          !msg.includes("does not exist")
        ) {
          throw e;
        }
      }
    }
  } finally {
    await client.end();
  }
}

export async function setup() {
  const dbReady = await waitForDb();
  if (!dbReady) return;
  await applyMigrations();
}
