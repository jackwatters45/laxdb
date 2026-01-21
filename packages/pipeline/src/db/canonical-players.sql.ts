import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { sourcePlayerTable } from "./source-players.sql";

/**
 * Pipeline canonical players table
 *
 * The "golden record" for each player, linking multiple source records.
 * primary_source_player_id points to the most reliable source (by league priority).
 * Biographical data is populated from the primary source.
 */
export const canonicalPlayerTable = pgTable(
  "pipeline_canonical_player",
  {
    id: serial("id").primaryKey(),
    primarySourcePlayerId: integer("primary_source_player_id")
      .notNull()
      .references(() => sourcePlayerTable.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 200 }).notNull(),
    position: varchar("position", { length: 50 }),
    dob: timestamp("dob", { mode: "date", precision: 3 }),
    hometown: varchar("hometown", { length: 200 }),
    college: varchar("college", { length: 200 }),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_pipeline_canonical_player_primary_source").on(
      table.primarySourcePlayerId,
    ),
    index("idx_pipeline_canonical_player_display_name").on(table.displayName),
  ],
);

export type CanonicalPlayerSelect = typeof canonicalPlayerTable.$inferSelect;
export type CanonicalPlayerInsert = typeof canonicalPlayerTable.$inferInsert;
