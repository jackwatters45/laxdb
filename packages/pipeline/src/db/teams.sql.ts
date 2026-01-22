import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { leagueTable } from "./leagues.sql";

/**
 * Pipeline teams table
 *
 * Stores team data per league.
 * source_id is the external team ID from source API.
 * source_hash for change detection (idempotent upserts).
 */
export const teamTable = pgTable(
  "pipeline_team",
  {
    id: serial("id").primaryKey(),
    leagueId: integer("league_id")
      .notNull()
      .references(() => leagueTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    abbreviation: varchar("abbreviation", { length: 10 }),
    city: varchar("city", { length: 100 }),
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
    index("idx_pipeline_team_league_id").on(table.leagueId),
    index("idx_pipeline_team_league_source").on(table.leagueId, table.sourceId),
    index("idx_pipeline_team_name").on(table.name),
  ],
);

export type TeamSelect = typeof teamTable.$inferSelect;
export type TeamInsert = typeof teamTable.$inferInsert;
