import { Schema } from "effect";

// MSL (Major Series Lacrosse) data sources:
// - Gamesheet: 2023-present (season IDs: 3246, 6007, 9567)
// - Pointstreak: 2009-2018 (league ID: 832)
// Season ID is a positive integer unique to each Gamesheet season

export const MSLSeasonId = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("MSLSeasonId"),
  Schema.annotations({
    description: "MSL Gamesheet season ID (e.g., 9567 for 2025)",
  }),
);
export type MSLSeasonId = typeof MSLSeasonId.Type;

// Year to Gamesheet Season ID mapping
export const MSL_GAMESHEET_SEASONS: Record<number, number> = {
  2025: 9567,
  2024: 6007,
  2023: 3246,
};

// Pointstreak league ID for historical data (2009-2018)
export const MSL_POINTSTREAK_LEAGUE_ID = 832;

// Years available on each platform
export const MSL_GAMESHEET_YEARS = [2023, 2024, 2025] as const;
export const MSL_POINTSTREAK_YEARS = [
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018,
] as const;

// Helper to get Gamesheet season ID from year
export function getMSLSeasonId(year: number): number | undefined {
  return MSL_GAMESHEET_SEASONS[year];
}

// Helper to check if year has Gamesheet data
export function hasMSLGamesheetData(year: number): boolean {
  return year in MSL_GAMESHEET_SEASONS;
}

// Helper to check if year has Pointstreak data
export function hasMSLPointstreakData(year: number): boolean {
  return MSL_POINTSTREAK_YEARS.includes(
    year as (typeof MSL_POINTSTREAK_YEARS)[number],
  );
}

// MSL Player Stats nested schema (used in MSLPlayer)
export class MSLPlayerStats extends Schema.Class<MSLPlayerStats>(
  "MSLPlayerStats",
)({
  // Core stats
  games_played: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  penalty_minutes: Schema.Number,

  // Per-game stats
  points_per_game: Schema.Number,

  // Power play stats (nullable - may not be tracked in all seasons)
  ppg: Schema.NullOr(Schema.Number), // power play goals
  ppa: Schema.NullOr(Schema.Number), // power play assists

  // Short-handed stats (nullable)
  shg: Schema.NullOr(Schema.Number), // short-handed goals
  sha: Schema.NullOr(Schema.Number), // short-handed assists

  // Situational goals (nullable)
  gwg: Schema.NullOr(Schema.Number), // game-winning goals
  fg: Schema.NullOr(Schema.Number), // first goals
  otg: Schema.NullOr(Schema.Number), // overtime goals
}) {}

// MSL Player response schema
export class MSLPlayer extends Schema.Class<MSLPlayer>("MSLPlayer")({
  id: Schema.String,
  name: Schema.String,
  first_name: Schema.NullOr(Schema.String),
  last_name: Schema.NullOr(Schema.String),
  jersey_number: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  stats: Schema.optional(Schema.suspend(() => MSLPlayerStats)),
}) {}

// MSL Team response schema
export class MSLTeam extends Schema.Class<MSLTeam>("MSLTeam")({
  id: Schema.String,
  name: Schema.String,
  city: Schema.NullOr(Schema.String),
  abbreviation: Schema.NullOr(Schema.String),
  logo_url: Schema.NullOr(Schema.String),
  website_url: Schema.NullOr(Schema.String),
}) {}

// MSL Goalie Stats nested schema (used in MSLGoalie)
export class MSLGoalieStats extends Schema.Class<MSLGoalieStats>(
  "MSLGoalieStats",
)({
  // Core goalie stats
  games_played: Schema.Number,
  wins: Schema.Number,
  losses: Schema.Number,
  ties: Schema.Number,

  // Goals against / saves
  goals_against: Schema.Number,
  saves: Schema.Number,
  shots_against: Schema.Number,

  // Calculated stats
  gaa: Schema.Number, // Goals Against Average
  save_pct: Schema.Number, // Save Percentage

  // Additional stats
  shutouts: Schema.Number,
  minutes_played: Schema.Number,
}) {}

// MSL Goalie response schema
export class MSLGoalie extends Schema.Class<MSLGoalie>("MSLGoalie")({
  id: Schema.String,
  name: Schema.String,
  first_name: Schema.NullOr(Schema.String),
  last_name: Schema.NullOr(Schema.String),
  jersey_number: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  stats: Schema.optional(Schema.suspend(() => MSLGoalieStats)),
}) {}

// MSL Standing response schema
export class MSLStanding extends Schema.Class<MSLStanding>("MSLStanding")({
  team_id: Schema.String,
  team_name: Schema.NullOr(Schema.String),
  position: Schema.Number,

  // Win/loss record
  wins: Schema.Number,
  losses: Schema.Number,
  ties: Schema.Number,
  games_played: Schema.Number,
  points: Schema.Number,

  // Goal stats
  goals_for: Schema.Number,
  goals_against: Schema.Number,
  goal_diff: Schema.Number,

  // Streak info
  streak: Schema.NullOr(Schema.String),
}) {}

// MSL Game Period Score nested schema (used in MSLGame)
export class MSLGamePeriodScore extends Schema.Class<MSLGamePeriodScore>(
  "MSLGamePeriodScore",
)({
  period: Schema.Number,
  home_score: Schema.Number,
  away_score: Schema.Number,
}) {}
