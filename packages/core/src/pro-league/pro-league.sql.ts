import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { ids, timestamp, timestamps } from "../drizzle/drizzle.type";

import type { GoalieStats, PlayerStats, TeamStats } from "./pro-league.types";

// =============================================================================
// PRO LEAGUE - Reference table for professional lacrosse leagues
// =============================================================================

export const proLeagueTable = pgTable(
  "pro_league",
  {
    ...ids,
    code: varchar("code", { length: 10 }).notNull().unique(), // pll, nll, mll, msl, wla
    name: text("name").notNull(), // "Premier Lacrosse League"
    shortName: text("short_name"), // "PLL"
    country: varchar("country", { length: 2 }), // "US", "CA"
    isActive: boolean("is_active").notNull().default(true),
    foundedYear: integer("founded_year"),
    defunctYear: integer("defunct_year"), // For MLL (2020)
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    ...timestamps,
  },
  (table) => [
    index("idx_pro_league_code").on(table.code),
    index("idx_pro_league_active").on(table.isActive),
  ],
);

export type ProLeague = typeof proLeagueTable.$inferSelect;
export type ProLeagueInsert = typeof proLeagueTable.$inferInsert;

// =============================================================================
// PRO SEASON - Season per league with external season identifiers
// =============================================================================

export const proSeasonTable = pgTable(
  "pro_season",
  {
    ...ids,
    leagueId: integer("league_id")
      .notNull()
      .references(() => proLeagueTable.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(), // League-specific season ID (e.g., "225" for NLL)
    year: integer("year").notNull(), // Primary year (e.g., 2024 for 2024-25)
    displayName: text("display_name").notNull(), // "2024-25" or "2024"
    startDate: date("start_date", { mode: "date" }),
    endDate: date("end_date", { mode: "date" }),
    isCurrent: boolean("is_current").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("pro_season_league_external").on(table.leagueId, table.externalId),
    index("idx_pro_season_league").on(table.leagueId),
    index("idx_pro_season_year").on(table.year),
    index("idx_pro_season_current").on(table.isCurrent),
  ],
);

export type ProSeason = typeof proSeasonTable.$inferSelect;
export type ProSeasonInsert = typeof proSeasonTable.$inferInsert;

// =============================================================================
// PRO TEAM - Teams with external IDs, logos, colors
// =============================================================================

export const proTeamTable = pgTable(
  "pro_team",
  {
    ...ids,
    leagueId: integer("league_id")
      .notNull()
      .references(() => proLeagueTable.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(), // League-specific team ID
    code: varchar("code", { length: 10 }), // Team code/abbreviation (e.g., "ATL", "TOR")
    name: text("name").notNull(), // Full name (e.g., "Atlas Lacrosse Club")
    shortName: text("short_name"), // Short name (e.g., "Atlas")
    city: text("city"), // Home city
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }), // Hex color (#RRGGBB)
    secondaryColor: varchar("secondary_color", { length: 7 }),
    websiteUrl: text("website_url"),
    isActive: boolean("is_active").notNull().default(true),
    // Tracking when team was active
    firstSeasonYear: integer("first_season_year"),
    lastSeasonYear: integer("last_season_year"), // null if still active
    ...timestamps,
  },
  (table) => [
    unique("pro_team_league_external").on(table.leagueId, table.externalId),
    index("idx_pro_team_league").on(table.leagueId),
    index("idx_pro_team_code").on(table.code),
    index("idx_pro_team_active").on(table.isActive),
  ],
);

export type ProTeam = typeof proTeamTable.$inferSelect;
export type ProTeamInsert = typeof proTeamTable.$inferInsert;

// =============================================================================
// PRO PLAYER - Players with external IDs, demographics
// Cross-league matching via canonical_player_id self-reference
// =============================================================================

export const proPlayerTable = pgTable(
  "pro_player",
  {
    ...ids,
    leagueId: integer("league_id")
      .notNull()
      .references(() => proLeagueTable.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(), // League-specific player ID
    // Cross-league matching: points to "master" record across leagues
    canonicalPlayerId: integer("canonical_player_id").references(
      (): AnyPgColumn => proPlayerTable.id,
      { onDelete: "set null" },
    ),
    firstName: text("first_name"),
    lastName: text("last_name").notNull(),
    fullName: text("full_name"), // Computed or source-provided
    position: varchar("position", { length: 20 }), // A, M, D, G, SSDM, LSM, FO
    dateOfBirth: date("date_of_birth", { mode: "date" }),
    birthplace: text("birthplace"), // City, State/Province
    country: varchar("country", { length: 2 }),
    height: varchar("height", { length: 10 }), // "6'2" or "188cm"
    weight: integer("weight"), // in lbs
    handedness: varchar("handedness", { length: 5 }), // "L", "R"
    college: text("college"),
    highSchool: text("high_school"),
    profileUrl: text("profile_url"),
    photoUrl: text("photo_url"),
    ...timestamps,
  },
  (table) => [
    unique("pro_player_league_external").on(table.leagueId, table.externalId),
    index("idx_pro_player_league").on(table.leagueId),
    index("idx_pro_player_name").on(table.lastName, table.firstName),
    index("idx_pro_player_canonical").on(table.canonicalPlayerId),
    index("idx_pro_player_position").on(table.position),
  ],
);

export type ProPlayer = typeof proPlayerTable.$inferSelect;
export type ProPlayerInsert = typeof proPlayerTable.$inferInsert;

// =============================================================================
// PRO PLAYER SEASON - Junction table: roster + stats per season
// JSONB for league-varying stats structures
// =============================================================================

export const proPlayerSeasonTable = pgTable(
  "pro_player_season",
  {
    ...ids,
    playerId: integer("player_id")
      .notNull()
      .references(() => proPlayerTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id")
      .notNull()
      .references(() => proSeasonTable.id, { onDelete: "cascade" }),
    teamId: integer("team_id").references(() => proTeamTable.id, {
      onDelete: "set null",
    }),
    // Roster info
    jerseyNumber: integer("jersey_number"),
    position: varchar("position", { length: 20 }), // May differ from player.position
    isCaptain: boolean("is_captain").default(false),
    // Stats - JSONB for flexibility across leagues
    stats: jsonb("stats").$type<PlayerStats>(),
    postSeasonStats: jsonb("post_season_stats").$type<PlayerStats>(),
    // For goalies - separate stats structure
    goalieStats: jsonb("goalie_stats").$type<GoalieStats>(),
    postSeasonGoalieStats: jsonb(
      "post_season_goalie_stats",
    ).$type<GoalieStats>(),
    // Metadata
    gamesPlayed: integer("games_played").default(0),
    ...timestamps,
  },
  (table) => [
    unique("pro_player_season_unique").on(table.playerId, table.seasonId),
    index("idx_pro_player_season_player").on(table.playerId),
    index("idx_pro_player_season_season").on(table.seasonId),
    index("idx_pro_player_season_team").on(table.teamId),
  ],
);

export type ProPlayerSeason = typeof proPlayerSeasonTable.$inferSelect;
export type ProPlayerSeasonInsert = typeof proPlayerSeasonTable.$inferInsert;

// =============================================================================
// PRO GAME - Games with scores, venue, status
// =============================================================================

export const proGameTable = pgTable(
  "pro_game",
  {
    ...ids,
    seasonId: integer("season_id")
      .notNull()
      .references(() => proSeasonTable.id, { onDelete: "cascade" }),
    externalId: text("external_id"), // League-specific game ID
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => proTeamTable.id, { onDelete: "cascade" }),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => proTeamTable.id, { onDelete: "cascade" }),
    // Scheduling
    gameDate: timestamp("game_date").notNull(),
    week: varchar("week", { length: 20 }), // "Week 1", "Championship Series"
    gameNumber: integer("game_number"), // Within season
    // Venue
    venue: text("venue"),
    venueCity: text("venue_city"),
    // Status
    status: varchar("status", { length: 20 }).notNull().default("scheduled"),
    // 'scheduled', 'in_progress', 'final', 'postponed', 'cancelled'
    // Scores
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    // Overtime/shootout tracking
    isOvertime: boolean("is_overtime").default(false),
    overtimePeriods: integer("overtime_periods").default(0),
    // Play-by-play stored in R2
    playByPlayUrl: text("play_by_play_url"), // R2 URL reference
    // Team stats for this game (JSONB)
    homeTeamStats: jsonb("home_team_stats").$type<TeamStats>(),
    awayTeamStats: jsonb("away_team_stats").$type<TeamStats>(),
    // Broadcast info
    broadcaster: text("broadcaster"),
    streamUrl: text("stream_url"),
    ...timestamps,
  },
  (table) => [
    unique("pro_game_season_external").on(table.seasonId, table.externalId),
    index("idx_pro_game_season").on(table.seasonId),
    index("idx_pro_game_home_team").on(table.homeTeamId),
    index("idx_pro_game_away_team").on(table.awayTeamId),
    index("idx_pro_game_date").on(table.gameDate),
    index("idx_pro_game_status").on(table.status),
  ],
);

export type ProGame = typeof proGameTable.$inferSelect;
export type ProGameInsert = typeof proGameTable.$inferInsert;

// =============================================================================
// PRO STANDINGS - Team standings per season (snapshot-based for time-series)
// =============================================================================

export const proStandingsTable = pgTable(
  "pro_standings",
  {
    ...ids,
    seasonId: integer("season_id")
      .notNull()
      .references(() => proSeasonTable.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => proTeamTable.id, { onDelete: "cascade" }),
    // Snapshot date for time-series analysis
    snapshotDate: date("snapshot_date", { mode: "date" }).notNull(),
    // Core standings
    position: integer("position").notNull(), // Rank in standings
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    ties: integer("ties").default(0),
    overtimeLosses: integer("overtime_losses").default(0),
    // Points (some leagues use points system)
    points: integer("points"),
    winPercentage: integer("win_percentage"), // Stored as integer (e.g., 750 = .750)
    // Goals
    goalsFor: integer("goals_for").default(0),
    goalsAgainst: integer("goals_against").default(0),
    goalDifferential: integer("goal_differential").default(0),
    // Conference/Division (if applicable)
    conference: varchar("conference", { length: 50 }),
    division: varchar("division", { length: 50 }),
    // Playoff qualification
    clinchStatus: varchar("clinch_status", { length: 10 }), // 'x', 'y', 'z', 'e'
    seed: integer("seed"),
    ...timestamps,
  },
  (table) => [
    // Unique per team per season per date
    unique("pro_standings_season_team_date").on(
      table.seasonId,
      table.teamId,
      table.snapshotDate,
    ),
    index("idx_pro_standings_season").on(table.seasonId),
    index("idx_pro_standings_team").on(table.teamId),
    index("idx_pro_standings_date").on(table.snapshotDate),
    index("idx_pro_standings_position").on(table.position),
  ],
);

export type ProStandings = typeof proStandingsTable.$inferSelect;
export type ProStandingsInsert = typeof proStandingsTable.$inferInsert;

// =============================================================================
// PRO DATA INGESTION - Extraction provenance tracking
// =============================================================================

export const proDataIngestionTable = pgTable(
  "pro_data_ingestion",
  {
    ...ids,
    leagueId: integer("league_id")
      .notNull()
      .references(() => proLeagueTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id").references(() => proSeasonTable.id, {
      onDelete: "set null",
    }),
    // What was extracted
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    // 'teams', 'players', 'games', 'standings', 'play_by_play', 'full_season'
    // Source info
    sourceUrl: text("source_url"),
    sourceType: varchar("source_type", { length: 20 }), // 'api', 'scrape', 'wayback'
    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // 'pending', 'running', 'completed', 'failed'
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    // Metrics
    recordsProcessed: integer("records_processed").default(0),
    recordsCreated: integer("records_created").default(0),
    recordsUpdated: integer("records_updated").default(0),
    recordsSkipped: integer("records_skipped").default(0),
    // Duration in milliseconds
    durationMs: integer("duration_ms"),
    // Error tracking
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    // Raw extraction output location in R2
    rawDataUrl: text("raw_data_url"),
    // Manifest version for incremental extractions
    manifestVersion: integer("manifest_version"),
    ...timestamps,
  },
  (table) => [
    index("idx_pro_ingestion_league").on(table.leagueId),
    index("idx_pro_ingestion_season").on(table.seasonId),
    index("idx_pro_ingestion_entity").on(table.entityType),
    index("idx_pro_ingestion_status").on(table.status),
    index("idx_pro_ingestion_created").on(table.createdAt),
  ],
);

export type ProDataIngestion = typeof proDataIngestionTable.$inferSelect;
export type ProDataIngestionInsert = typeof proDataIngestionTable.$inferInsert;
