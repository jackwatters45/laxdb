import {
  date,
  index,
  integer,
  pgTable,
  serial,
  time,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { seasonTable } from "./seasons.sql";
import { teamTable } from "./teams.sql";

/**
 * Pipeline games table
 *
 * Stores schedule and results for games.
 *
 * status indicates the game state:
 * - 'scheduled': Game is upcoming
 * - 'in_progress': Game is currently being played
 * - 'final': Game is complete
 * - 'postponed': Game was postponed/cancelled
 *
 * source_id is the external game ID from the source API.
 * source_hash for change detection (idempotent upserts).
 *
 * KV caching: stats:game:{id} → TTL: 24 hours (immutable after final)
 */
export const gameTable = pgTable(
  "pipeline_game",
  {
    id: serial("id").primaryKey(),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasonTable.id, { onDelete: "cascade" }),
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    gameDate: date("game_date", { mode: "date" }).notNull(),
    gameTime: time("game_time"),
    venue: varchar("venue", { length: 200 }),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    status: varchar("status", { length: 20 }).notNull().default("scheduled"),
    sourceId: varchar("source_id", { length: 50 }),
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
    index("idx_pipeline_game_season_date").on(table.seasonId, table.gameDate),
    index("idx_pipeline_game_home_team").on(table.homeTeamId),
    index("idx_pipeline_game_away_team").on(table.awayTeamId),
    index("idx_pipeline_game_source").on(table.sourceId),
  ],
);

export type GameSelect = typeof gameTable.$inferSelect;
export type GameInsert = typeof gameTable.$inferInsert;
