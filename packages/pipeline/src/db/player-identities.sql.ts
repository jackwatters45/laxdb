import {
  index,
  integer,
  pgTable,
  real,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { canonicalPlayerTable } from "./canonical-players.sql";
import { sourcePlayerTable } from "./source-players.sql";

/**
 * Pipeline player identities linking table
 *
 * Links source players to their canonical (golden record) player.
 * Each source_player maps to exactly one canonical_player (unique constraint).
 * Multiple source_players can link to the same canonical_player (many-to-one).
 *
 * match_method indicates how the link was established:
 * - 'exact': normalized_name + DOB match (confidence = 1.0)
 * - 'fuzzy': similarity-based matching (future Phase 2)
 * - 'manual': human-verified link
 *
 * confidence_score: 0.0-1.0
 * MVP uses exact match only (confidence = 1.0)
 */
export const playerIdentityTable = pgTable(
  "pipeline_player_identity",
  {
    id: serial("id").primaryKey(),
    canonicalPlayerId: integer("canonical_player_id")
      .notNull()
      .references(() => canonicalPlayerTable.id, { onDelete: "cascade" }),
    sourcePlayerId: integer("source_player_id")
      .notNull()
      .references(() => sourcePlayerTable.id, { onDelete: "cascade" }),
    confidenceScore: real("confidence_score").notNull().default(1.0),
    matchMethod: varchar("match_method", { length: 20 })
      .notNull()
      .default("exact"),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("uniq_pipeline_player_identity_source").on(table.sourcePlayerId),
    index("idx_pipeline_player_identity_canonical").on(table.canonicalPlayerId),
  ],
);

export type PlayerIdentitySelect = typeof playerIdentityTable.$inferSelect;
export type PlayerIdentityInsert = typeof playerIdentityTable.$inferInsert;
