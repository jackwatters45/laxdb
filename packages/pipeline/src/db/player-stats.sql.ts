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
import { sourcePlayerTable } from "./source-players.sql";
import { teamTable } from "./teams.sql";

/**
 * Pipeline player stats table
 *
 * Stores per-game and season total statistics for players.
 * game_id is nullable for season totals from sources without per-game data.
 *
 * stat_type indicates the context:
 * - 'regular': Regular season stats
 * - 'playoff': Playoff stats
 * - 'career': Career totals (rarely used at per-game level)
 *
 * Stats are NOT comparable across leagues - different rules/categories.
 * Idempotent upserts via unique constraint on (source_player_id, season_id, game_id).
 */
export const playerStatTable = pgTable(
  "pipeline_player_stat",
  {
    id: serial("id").primaryKey(),
    sourcePlayerId: integer("source_player_id")
      .notNull()
      .references(() => sourcePlayerTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasonTable.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    gameId: varchar("game_id", { length: 50 }),
    statType: varchar("stat_type", { length: 20 }).notNull().default("regular"),
    // Offensive stats
    goals: integer("goals").default(0),
    assists: integer("assists").default(0),
    points: integer("points").default(0),
    shots: integer("shots").default(0),
    shotsOnGoal: integer("shots_on_goal").default(0),
    // Possession stats
    groundBalls: integer("ground_balls").default(0),
    turnovers: integer("turnovers").default(0),
    causedTurnovers: integer("caused_turnovers").default(0),
    // Faceoff stats
    faceoffWins: integer("faceoff_wins").default(0),
    faceoffLosses: integer("faceoff_losses").default(0),
    // Goalie stats
    saves: integer("saves").default(0),
    goalsAgainst: integer("goals_against").default(0),
    // Aggregate
    gamesPlayed: integer("games_played").default(0),
    // Change detection
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
    unique("uniq_pipeline_player_stat_player_season_game").on(
      table.sourcePlayerId,
      table.seasonId,
      table.gameId,
    ),
    index("idx_pipeline_player_stat_player_season").on(
      table.sourcePlayerId,
      table.seasonId,
    ),
    index("idx_pipeline_player_stat_team_game").on(table.teamId, table.gameId),
    index("idx_pipeline_player_stat_season").on(table.seasonId),
  ],
);

export type PlayerStatSelect = typeof playerStatTable.$inferSelect;
export type PlayerStatInsert = typeof playerStatTable.$inferInsert;
