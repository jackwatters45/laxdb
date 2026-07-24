import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { organizations } from "../auth/auth.sql";
import { clubTeams, rosterPlayers } from "../club/club.sql";

export const gamedaySources = sqliteTable("gameday_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clientId: text("client_id").notNull(),
  baseUrl: text("base_url").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  updatedAt: timestamp("updated_at"),
});

export const gamedaySeasons = sqliteTable(
  "gameday_seasons",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_seasons_source_idx").on(table.sourceId),
    uniqueIndex("gameday_seasons_source_season_idx").on(
      table.sourceId,
      table.seasonId,
    ),
  ],
);

export const gamedayCompetitions = sqliteTable(
  "gameday_competitions",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_competitions_source_season_idx").on(
      table.sourceId,
      table.seasonId,
    ),
    uniqueIndex("gameday_competitions_external_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
    ),
  ],
);

export const gamedayTeams = sqliteTable(
  "gameday_teams",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    teamId: text("team_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_teams_source_season_idx").on(table.sourceId, table.seasonId),
    index("gameday_teams_name_idx").on(table.name),
    uniqueIndex("gameday_teams_external_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
      table.teamId,
    ),
  ],
);

export const gamedayFixtures = sqliteTable(
  "gameday_fixtures",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    fixtureId: text("fixture_id").notNull(),
    compName: text("comp_name"),
    round: text("round"),
    scheduledAt: timestamp("scheduled_at"),
    homeTeamId: text("home_team_id"),
    awayTeamId: text("away_team_id"),
    homeTeamName: text("home_team_name").notNull(),
    awayTeamName: text("away_team_name").notNull(),
    venueName: text("venue_name"),
    matchStatus: text("match_status"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_fixtures_source_season_idx").on(
      table.sourceId,
      table.seasonId,
    ),
    index("gameday_fixtures_comp_idx").on(table.compId),
    index("gameday_fixtures_scheduled_idx").on(table.scheduledAt),
    uniqueIndex("gameday_fixtures_external_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
      table.fixtureId,
    ),
  ],
);

export const gamedayLadderRows = sqliteTable(
  "gameday_ladder_rows",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    position: integer("position").notNull(),
    gamedayTeamId: text("gameday_team_id"),
    teamName: text("team_name").notNull(),
    played: integer("played").notNull(),
    wins: integer("wins").notNull(),
    losses: integer("losses").notNull(),
    draws: integer("draws").notNull(),
    byes: integer("byes").notNull(),
    forfeitsFor: integer("forfeits_for").notNull(),
    forfeitsGiven: integer("forfeits_given").notNull(),
    goalsFor: integer("goals_for").notNull(),
    goalsAgainst: integer("goals_against").notNull(),
    goalDifference: integer("goal_difference").notNull(),
    percentage: real("percentage").notNull(),
    premiershipPoints: integer("premiership_points").notNull(),
    sourceUploadedAt: text("source_uploaded_at"),
    fetchedAt: timestamp("fetched_at").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_ladder_rows_scope_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
    ),
    uniqueIndex("gameday_ladder_rows_team_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
      table.teamName,
    ),
  ],
);

export const gamedayPlayers = sqliteTable(
  "gameday_players",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_players_source_idx").on(table.sourceId),
    uniqueIndex("gameday_players_external_idx").on(
      table.sourceId,
      table.playerId,
    ),
  ],
);

export const gamedayRosterEntries = sqliteTable(
  "gameday_roster_entries",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    teamId: text("team_id").notNull(),
    playerId: text("player_id").notNull(),
    playerName: text("player_name").notNull(),
    gamesPlayed: integer("games_played"),
    totalAssists: integer("total_assists"),
    totalScore: integer("total_score"),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gameday_roster_entries_team_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
      table.teamId,
    ),
    uniqueIndex("gameday_roster_entries_external_idx").on(
      table.sourceId,
      table.seasonId,
      table.compId,
      table.teamId,
      table.playerId,
    ),
  ],
);

export const rosterPlayerGamedayLinks = sqliteTable(
  "roster_player_gameday_links",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    rosterPlayerId: text("roster_player_id")
      .notNull()
      .references(() => rosterPlayers.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    gamedayTeamId: text("gameday_team_id").notNull(),
    gamedayPlayerId: text("gameday_player_id").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("roster_player_gameday_links_org_idx").on(table.organizationId),
    index("roster_player_gameday_links_player_idx").on(table.rosterPlayerId),
    uniqueIndex("roster_player_gameday_links_external_idx").on(
      table.organizationId,
      table.sourceId,
      table.seasonId,
      table.compId,
      table.gamedayTeamId,
      table.gamedayPlayerId,
    ),
    uniqueIndex("roster_player_gameday_links_player_external_idx").on(
      table.rosterPlayerId,
      table.sourceId,
      table.seasonId,
      table.compId,
      table.gamedayTeamId,
      table.gamedayPlayerId,
    ),
  ],
);

export const clubTeamGamedayLinks = sqliteTable(
  "club_team_gameday_links",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clubTeamId: text("club_team_id")
      .notNull()
      .references(() => clubTeams.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => gamedaySources.id, { onDelete: "cascade" }),
    seasonId: text("season_id").notNull(),
    compId: text("comp_id").notNull(),
    gamedayTeamId: text("gameday_team_id").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("club_team_gameday_links_org_idx").on(table.organizationId),
    index("club_team_gameday_links_club_team_idx").on(table.clubTeamId),
    uniqueIndex("club_team_gameday_links_external_idx").on(
      table.organizationId,
      table.sourceId,
      table.seasonId,
      table.compId,
      table.gamedayTeamId,
    ),
    uniqueIndex("club_team_gameday_links_club_external_idx").on(
      table.clubTeamId,
      table.sourceId,
      table.seasonId,
      table.compId,
      table.gamedayTeamId,
    ),
  ],
);

export type GamedaySource = typeof gamedaySources.$inferSelect;
export type NewGamedaySource = typeof gamedaySources.$inferInsert;
export type GamedaySeasonRow = typeof gamedaySeasons.$inferSelect;
export type NewGamedaySeason = typeof gamedaySeasons.$inferInsert;
export type GamedayCompetitionRow = typeof gamedayCompetitions.$inferSelect;
export type NewGamedayCompetition = typeof gamedayCompetitions.$inferInsert;
export type GamedayTeamRow = typeof gamedayTeams.$inferSelect;
export type NewGamedayTeam = typeof gamedayTeams.$inferInsert;
export type GamedayFixtureRow = typeof gamedayFixtures.$inferSelect;
export type NewGamedayFixture = typeof gamedayFixtures.$inferInsert;
export type GamedayPlayerRow = typeof gamedayPlayers.$inferSelect;
export type NewGamedayPlayer = typeof gamedayPlayers.$inferInsert;
export type GamedayRosterEntryRow = typeof gamedayRosterEntries.$inferSelect;
export type NewGamedayRosterEntry = typeof gamedayRosterEntries.$inferInsert;
export type ClubTeamGamedayLink = typeof clubTeamGamedayLinks.$inferSelect;
export type NewClubTeamGamedayLink = typeof clubTeamGamedayLinks.$inferInsert;
export type RosterPlayerGamedayLink =
  typeof rosterPlayerGamedayLinks.$inferSelect;
export type NewRosterPlayerGamedayLink =
  typeof rosterPlayerGamedayLinks.$inferInsert;
