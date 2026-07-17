import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { organizations, users } from "../auth/auth.sql";
import { clubTeams, rosterPlayers } from "../club/club.sql";

export const fixtures = sqliteTable(
  "fixtures",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => clubTeams.id, { onDelete: "cascade" }),
    gamedayFixtureId: text("gameday_fixture_id").notNull(),
    compId: text("comp_id"),
    compName: text("comp_name"),
    round: text("round"),
    scheduledAt: timestamp("scheduled_at"),
    homeTeamName: text("home_team_name").notNull(),
    awayTeamName: text("away_team_name").notNull(),
    isHome: integer("is_home", { mode: "boolean" }).notNull().default(true),
    venueName: text("venue_name"),
    matchStatus: text("match_status"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("fixtures_org_idx").on(table.organizationId),
    index("fixtures_team_idx").on(table.teamId),
    index("fixtures_scheduled_idx").on(table.scheduledAt),
    uniqueIndex("fixtures_team_gameday_idx").on(
      table.teamId,
      table.gamedayFixtureId,
    ),
  ],
);

export const matchImages = sqliteTable(
  "match_images",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fixtureId: text("fixture_id")
      .notNull()
      .references(() => fixtures.id, { onDelete: "cascade" }),
    uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    objectKey: text("object_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type")
      .$type<"image/jpeg" | "image/png" | "image/webp" | "image/gif">()
      .notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    index("match_images_org_idx").on(table.organizationId),
    index("match_images_fixture_idx").on(table.fixtureId),
  ],
);

export const matchReports = sqliteTable(
  "match_reports",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fixtureId: text("fixture_id")
      .notNull()
      .references(() => fixtures.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => clubTeams.id, { onDelete: "cascade" }),
    submittedByUserId: text("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    topPlayer1Id: text("top_player_1_id")
      .notNull()
      .references(() => rosterPlayers.id, { onDelete: "restrict" }),
    topPlayer2Id: text("top_player_2_id").references(() => rosterPlayers.id, {
      onDelete: "restrict",
    }),
    topPlayer3Id: text("top_player_3_id").references(() => rosterPlayers.id, {
      onDelete: "restrict",
    }),
    blurb: text("blurb"),
    sentTo: text("sent_to", { mode: "json" })
      .$type<readonly string[]>()
      .notNull()
      .default(sql`'[]'`),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("match_reports_org_idx").on(table.organizationId),
    index("match_reports_team_idx").on(table.teamId),
    uniqueIndex("match_reports_fixture_idx").on(table.fixtureId),
  ],
);

export type Fixture = typeof fixtures.$inferSelect;
export type NewFixture = typeof fixtures.$inferInsert;
export type MatchImage = typeof matchImages.$inferSelect;
export type NewMatchImage = typeof matchImages.$inferInsert;
export type MatchReport = typeof matchReports.$inferSelect;
export type NewMatchReport = typeof matchReports.$inferInsert;
