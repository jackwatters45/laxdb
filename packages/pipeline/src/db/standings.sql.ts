import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { seasonTable } from "./seasons.sql";
import { teamTable } from "./teams.sql";

/**
 * Pipeline standings table
 *
 * Stores team standings per season.
 *
 * Fields track wins, losses, ties, points, and goal differentials.
 * rank is the team's position in the standings.
 *
 * source_hash for change detection (idempotent upserts).
 *
 * KV caching: stats:team:{id}:totals → TTL: 5 minutes (leaderboards)
 */
export const standingTable = pgTable(
  "pipeline_standing",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasonTable.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    division: varchar("division", { length: 100 }),
    conference: varchar("conference", { length: 100 }),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    ties: integer("ties").notNull().default(0),
    points: integer("points").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    goalDiff: integer("goal_diff").notNull().default(0),
    gamesPlayed: integer("games_played").notNull().default(0),
    rank: integer("rank"),
    sourceHash: varchar("source_hash", { length: 64 }),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_pipeline_standing_season_team").on(table.seasonId, table.teamId),
    index("idx_pipeline_standing_season").on(table.seasonId),
    index("idx_pipeline_standing_team").on(table.teamId),
  ],
);

export type StandingSelect = typeof standingTable.$inferSelect;
export type StandingInsert = typeof standingTable.$inferInsert;
