import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { leagueTable } from "./leagues.sql";
import { seasonTable } from "./seasons.sql";

/**
 * Pipeline scrape_runs table
 *
 * Tracks extraction job runs for monitoring and resilience.
 *
 * entity_type indicates what data was scraped:
 * - 'teams': Team roster data
 * - 'players': Player biographical data
 * - 'stats': Player statistics
 * - 'games': Schedule and game results
 * - 'standings': League standings
 *
 * status indicates the job state:
 * - 'running': Job is currently executing
 * - 'success': Job completed successfully
 * - 'failed': Job failed with error
 *
 * Stores last successful scrape timestamp per source (rate limiting & resilience).
 */
export const scrapeRunTable = pgTable(
  "pipeline_scrape_run",
  {
    id: serial("id").primaryKey(),
    leagueId: integer("league_id")
      .notNull()
      .references(() => leagueTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id").references(() => seasonTable.id, {
      onDelete: "cascade",
    }),
    entityType: varchar("entity_type", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("running"),
    startedAt: timestamp("started_at", { mode: "date", precision: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: timestamp("completed_at", { mode: "date", precision: 3 }),
    recordsProcessed: integer("records_processed"),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_pipeline_scrape_run_league_entity_started").on(
      table.leagueId,
      table.entityType,
      table.startedAt,
    ),
    index("idx_pipeline_scrape_run_status").on(table.status),
  ],
);

export type ScrapeRunSelect = typeof scrapeRunTable.$inferSelect;
export type ScrapeRunInsert = typeof scrapeRunTable.$inferInsert;
