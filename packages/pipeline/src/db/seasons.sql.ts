import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { leagueTable } from "./leagues.sql";

/**
 * Pipeline seasons table
 *
 * Stores season data per league.
 * source_season_id stores external IDs (e.g., Gamesheet season IDs: 9567, 6007, 3246)
 */
export const seasonTable = pgTable(
  "pipeline_season",
  {
    id: serial("id").primaryKey(),
    leagueId: integer("league_id")
      .notNull()
      .references(() => leagueTable.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    name: varchar("name", { length: 100 }),
    sourceSeasonId: varchar("source_season_id", { length: 50 }),
    startDate: date("start_date", { mode: "date" }),
    endDate: date("end_date", { mode: "date" }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_pipeline_season_league_year").on(table.leagueId, table.year),
    index("idx_pipeline_season_league_id").on(table.leagueId),
    index("idx_pipeline_season_year").on(table.year),
    index("idx_pipeline_season_source_id").on(table.sourceSeasonId),
  ],
);

export type SeasonSelect = typeof seasonTable.$inferSelect;
export type SeasonInsert = typeof seasonTable.$inferInsert;
