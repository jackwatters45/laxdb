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
 * Pipeline team_seasons junction table
 *
 * Links teams to seasons they participated in.
 * Teams can exist across multiple seasons.
 */
export const teamSeasonTable = pgTable(
  "pipeline_team_season",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id")
      .notNull()
      .references(() => seasonTable.id, { onDelete: "cascade" }),
    division: varchar("division", { length: 100 }),
    conference: varchar("conference", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_pipeline_team_season").on(table.teamId, table.seasonId),
    index("idx_pipeline_team_season_team_id").on(table.teamId),
    index("idx_pipeline_team_season_season_id").on(table.seasonId),
  ],
);

export type TeamSeasonSelect = typeof teamSeasonTable.$inferSelect;
export type TeamSeasonInsert = typeof teamSeasonTable.$inferInsert;
