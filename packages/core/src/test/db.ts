import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import type { PlatformError } from "effect/PlatformError";
import { Miniflare } from "miniflare";

import { defaultsTable } from "../defaults/defaults.sql";
import { drillTable } from "../drill/drill.sql";
import { DrizzleService, query } from "../drizzle/drizzle.service";
import { playTable } from "../play/play.sql";
import { playerTable } from "../player/player.sql";
import {
  practiceEdgeTable,
  practiceItemTable,
  practiceReviewTable,
  practiceTable,
} from "../practice/practice.sql";
import { userTable } from "../user/user.sql";

type TestD1Database = Awaited<ReturnType<Miniflare["getD1Database"]>>;

const TEST_DATABASE_ID = "laxdb-test";

let miniflare: Miniflare | undefined;
let databasePromise: Promise<TestD1Database> | undefined;

type MigrationServices = FileSystem | Path;

const MigrationPlatformLive = Layer.merge(NodeFileSystem.layer, NodePath.layer);

const collectSqlFiles = (
  directory: string,
): Effect.Effect<string[], PlatformError, MigrationServices> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const entries = yield* fs.readDirectory(directory);
    const files = yield* Effect.all(
      entries.map((entry) =>
        Effect.gen(function* () {
          const fullPath = path.join(directory, entry);
          const info = yield* fs.stat(fullPath);

          if (info.type === "Directory")
            return yield* collectSqlFiles(fullPath);
          if (info.type === "File" && entry.endsWith(".sql")) return [fullPath];
          return [];
        }),
      ),
    );

    return files.flat().toSorted((a, b) => a.localeCompare(b));
  });

const splitStatements = (sql: string) =>
  sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");

const applyMigrations = (
  db: TestD1Database,
): Effect.Effect<void, PlatformError, MigrationServices> =>
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    const migrationsDir = new URL("../../migrations", import.meta.url).pathname;
    const files = yield* collectSqlFiles(migrationsDir);

    for (const file of files) {
      const sql = yield* fs.readFileString(file);
      for (const statement of splitStatements(sql)) {
        yield* Effect.promise(() => db.prepare(statement).run());
      }
    }
  });

export const getTestD1Database = () => {
  if (databasePromise === undefined) {
    miniflare = new Miniflare({
      script: "",
      modules: true,
      d1Databases: { DB: TEST_DATABASE_ID },
    });

    databasePromise = miniflare.getD1Database("DB").then(async (db) => {
      await applyMigrations(db).pipe(
        Effect.provide(MigrationPlatformLive),
        Effect.runPromise,
      );
      return db;
    });
  }

  return databasePromise;
};

export const ensureTestDatabase = async () => {
  await getTestD1Database();
};

const TestDrizzleLive = Layer.effect(
  DrizzleService,
  Effect.promise(async () => drizzle(await getTestD1Database())),
);

export const TestDatabaseLive = TestDrizzleLive;

export const truncateAll = Effect.gen(function* () {
  const db = yield* DrizzleService;

  yield* query(db.delete(defaultsTable));
  yield* query(db.delete(practiceEdgeTable));
  yield* query(db.delete(practiceReviewTable));
  yield* query(db.delete(practiceItemTable));
  yield* query(db.delete(practiceTable));
  yield* query(db.delete(playTable));
  yield* query(db.delete(drillTable));
  yield* query(db.delete(playerTable));
  yield* query(db.delete(userTable));
});

export const disposeTestDatabase = async () => {
  await miniflare?.dispose();
  miniflare = undefined;
  databasePromise = undefined;
};
