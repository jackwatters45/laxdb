import { PgClient } from "@effect/sql-pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { Effect, Layer, Redacted } from "effect";
import { Pool } from "pg";

import { PgDrizzle } from "../drizzle/drizzle.service";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://test:test@localhost:5433/laxdb_test";

const PgLive = PgClient.layer({
  url: Redacted.make(TEST_DATABASE_URL),
  ssl: false,
}).pipe(Layer.orDie);

const TestDrizzleLive = Layer.sync(PgDrizzle, () => {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL, ssl: false });
  return drizzle({ client: pool });
});

export const TestDatabaseLive = Layer.mergeAll(PgLive, TestDrizzleLive);

export const truncateAll = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient;
  yield* sql`TRUNCATE TABLE practice_review, practice_item, practice, drill, player, "user" CASCADE`;
});
