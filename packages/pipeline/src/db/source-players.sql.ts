import {
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
 * Pipeline source players table
 *
 * Stores raw player data per source (league).
 * Each player record is unique per (league_id, source_id).
 * normalized_name is lowercase, no special chars, for identity matching.
 * Soft deletes with deleted_at for audit trail.
 */
export const sourcePlayerTable = pgTable(
  "pipeline_source_player",
  {
    id: serial("id").primaryKey(),
    leagueId: integer("league_id")
      .notNull()
      .references(() => leagueTable.id, { onDelete: "cascade" }),
    sourceId: varchar("source_id", { length: 50 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    fullName: varchar("full_name", { length: 200 }),
    normalizedName: varchar("normalized_name", { length: 200 }),
    position: varchar("position", { length: 50 }),
    jerseyNumber: varchar("jersey_number", { length: 10 }),
    dob: timestamp("dob", { mode: "date", precision: 3 }),
    hometown: varchar("hometown", { length: 200 }),
    college: varchar("college", { length: 200 }),
    handedness: varchar("handedness", { length: 10 }),
    heightInches: integer("height_inches"),
    weightLbs: integer("weight_lbs"),
    sourceHash: varchar("source_hash", { length: 64 }),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
  },
  (table) => [
    unique("uniq_pipeline_source_player_league_source").on(
      table.leagueId,
      table.sourceId,
    ),
    index("idx_pipeline_source_player_league_id").on(table.leagueId),
    index("idx_pipeline_source_player_normalized_name").on(
      table.normalizedName,
    ),
    index("idx_pipeline_source_player_source_id").on(table.sourceId),
  ],
);

export type SourcePlayerSelect = typeof sourcePlayerTable.$inferSelect;
export type SourcePlayerInsert = typeof sourcePlayerTable.$inferInsert;
