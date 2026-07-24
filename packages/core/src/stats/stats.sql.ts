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
import { fixtures } from "../match/match.sql";

export const fixtureTeamStats = sqliteTable(
  "fixture_team_stats",
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
    goalsForOverride: integer("goals_for_override"),
    goalsAgainstOverride: integer("goals_against_override"),
    assistedGoals: integer("assisted_goals").notNull().default(0),
    shots: integer("shots"),
    saves: integer("saves"),
    submittedByUserId: text("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("fixture_team_stats_fixture_idx").on(
      table.organizationId,
      table.fixtureId,
    ),
    index("fixture_team_stats_team_idx").on(table.organizationId, table.teamId),
  ],
);

export const fixturePlayerStats = sqliteTable(
  "fixture_player_stats",
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
    rosterPlayerId: text("roster_player_id")
      .notNull()
      .references(() => rosterPlayers.id, { onDelete: "cascade" }),
    goals: integer("goals").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    shots: integer("shots"),
    saves: integer("saves"),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("fixture_player_stats_player_idx").on(
      table.organizationId,
      table.fixtureId,
      table.rosterPlayerId,
    ),
    index("fixture_player_stats_team_player_idx").on(
      table.organizationId,
      table.teamId,
      table.rosterPlayerId,
    ),
  ],
);

export type FixtureTeamStatRow = typeof fixtureTeamStats.$inferSelect;
export type FixturePlayerStatRow = typeof fixturePlayerStats.$inferSelect;
