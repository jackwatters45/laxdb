import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { Miniflare } from "miniflare";

import {
  accounts,
  invitations,
  members,
  organizations,
  sessions,
  users,
  verifications,
} from "../auth/auth.sql";
import { clubTeams, reportRecipients, rosterPlayers } from "../club/club.sql";
import { defaultsTable } from "../defaults/defaults.sql";
import { drillTable } from "../drill/drill.sql";
import { DrizzleService, query } from "../drizzle/drizzle.service";
import { fineEvents, fines, fineTemplates } from "../fine/fine.sql";
import { fixtures, matchReports } from "../match/match.sql";
import { playTable } from "../play/play.sql";
import { playerTable } from "../player/player.sql";
import {
  practiceEdgeTable,
  practiceItemTable,
  practiceReviewTable,
  practiceTable,
} from "../practice/practice.sql";

type TestD1Database = Awaited<ReturnType<Miniflare["getD1Database"]>>;

const TEST_DATABASE_ID = "laxdb-test";

let miniflare: Miniflare | undefined;
let databasePromise: Promise<TestD1Database> | undefined;

const splitStatements = (sql: string) =>
  sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");

const applyTestSchema = async (db: TestD1Database) => {
  const { readFile } = await import("node:fs/promises");
  const schemaFile = new URL("./schema.sql", import.meta.url).pathname;
  const sql = await readFile(schemaFile, "utf-8");

  for (const statement of splitStatements(sql)) {
    // oxlint-disable-next-line no-await-in-loop -- schema statements must run in order
    await db.prepare(statement).run();
  }
};

export const getTestD1Database = () => {
  if (databasePromise === undefined) {
    miniflare = new Miniflare({
      script: "",
      modules: true,
      d1Databases: { DB: TEST_DATABASE_ID },
    });

    databasePromise = miniflare.getD1Database("DB").then(async (db) => {
      await applyTestSchema(db);
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
  yield* query(db.delete(matchReports));
  yield* query(db.delete(fixtures));
  yield* query(db.delete(rosterPlayers));
  yield* query(db.delete(reportRecipients));
  yield* query(db.delete(clubTeams));
  yield* query(db.delete(fineEvents));
  yield* query(db.delete(fines));
  yield* query(db.delete(fineTemplates));
  yield* query(db.delete(practiceEdgeTable));
  yield* query(db.delete(practiceReviewTable));
  yield* query(db.delete(practiceItemTable));
  yield* query(db.delete(practiceTable));
  yield* query(db.delete(playTable));
  yield* query(db.delete(drillTable));
  yield* query(db.delete(playerTable));
  yield* query(db.delete(invitations));
  yield* query(db.delete(members));
  yield* query(db.delete(organizations));
  yield* query(db.delete(sessions));
  yield* query(db.delete(accounts));
  yield* query(db.delete(verifications));
  yield* query(db.delete(users));
});

export const disposeTestDatabase = async () => {
  await miniflare?.dispose();
  miniflare = undefined;
  databasePromise = undefined;
};
