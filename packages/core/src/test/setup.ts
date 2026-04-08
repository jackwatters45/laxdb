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

function isSuppressibleMigrationError(statement: string, message: string) {
  if (message.includes("already exists") || message.includes("duplicate key")) {
    return true;
  }

  return (
    message.includes("does not exist") && statement.trim().startsWith("DROP ")
  );
}

async function applyMigrationStatement(client: Client, statement: string) {
  try {
    await client.query(statement);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    if (!isSuppressibleMigrationError(statement, msg)) {
      throw e;
    }
  }
}

const MIGRATION_LOCK_ID = 42_604_008;

async function resetDatabase(client: Client) {
  await client.query(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;",
  );
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
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await resetDatabase(client);

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
      for (const stmt of statements) {
        // oxlint-disable-next-line no-await-in-loop -- must run migrations sequentially
        await applyMigrationStatement(client, stmt);
      }
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      await client.end();
    }
  }
}

export async function setup() {
  const dbReady = await waitForDb();
  if (!dbReady) return;
  await applyMigrations();
}
