import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Source priority reflects reliability: lower = more reliable
 * PLL=1, NLL=2, Gamesheet=3, StatsCrew=4, Pointstreak=5, Wayback=6
 */
export const leagueTable = pgTable(
  "pipeline_league",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    abbreviation: varchar("abbreviation", { length: 10 }).notNull().unique(),
    priority: integer("priority").notNull(),
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
    index("idx_pipeline_league_abbreviation").on(table.abbreviation),
    index("idx_pipeline_league_priority").on(table.priority),
  ],
);

export type LeagueSelect = typeof leagueTable.$inferSelect;
export type LeagueInsert = typeof leagueTable.$inferInsert;
