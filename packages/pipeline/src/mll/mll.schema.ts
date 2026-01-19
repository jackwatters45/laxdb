import { Schema } from "effect";

// MLL (Major League Lacrosse) operated from 2001 to 2020
// The league merged with the PLL after the 2020 season
export const MLLYear = Schema.Number.pipe(
  Schema.int(),
  Schema.between(2001, 2020),
  Schema.brand("MLLYear"),
  Schema.annotations({
    description: "MLL season year (2001-2020)",
  }),
);
export type MLLYear = typeof MLLYear.Type;

// MLL Team response schema
export class MLLTeam extends Schema.Class<MLLTeam>("MLLTeam")({
  id: Schema.String,
  name: Schema.String,
  city: Schema.NullOr(Schema.String),
  abbreviation: Schema.NullOr(Schema.String),
  founded_year: Schema.NullOr(Schema.Number),
  final_year: Schema.NullOr(Schema.Number),
}) {}

// MLL Player response schema
export class MLLPlayer extends Schema.Class<MLLPlayer>("MLLPlayer")({
  id: Schema.String,
  name: Schema.String,
  first_name: Schema.NullOr(Schema.String),
  last_name: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  college: Schema.NullOr(Schema.String),
  stats: Schema.optional(Schema.suspend(() => MLLPlayerStats)),
}) {}

// MLL Player Stats nested schema
export class MLLPlayerStats extends Schema.Class<MLLPlayerStats>(
  "MLLPlayerStats",
)({
  // Core stats (always present)
  games_played: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,

  // Shooting stats (nullable - may not be available for all seasons)
  shots: Schema.NullOr(Schema.Number),
  shot_pct: Schema.NullOr(Schema.Number),

  // Ball control stats (nullable)
  ground_balls: Schema.NullOr(Schema.Number),
  caused_turnovers: Schema.NullOr(Schema.Number),
  turnovers: Schema.NullOr(Schema.Number),

  // Faceoff stats (nullable - only for faceoff specialists)
  faceoffs_won: Schema.NullOr(Schema.Number),
  faceoffs_lost: Schema.NullOr(Schema.Number),
  faceoff_pct: Schema.NullOr(Schema.Number),
}) {}

// MLL Goalie response schema
export class MLLGoalie extends Schema.Class<MLLGoalie>("MLLGoalie")({
  id: Schema.String,
  name: Schema.String,
  first_name: Schema.NullOr(Schema.String),
  last_name: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  stats: Schema.optional(Schema.suspend(() => MLLGoalieStats)),
}) {}

// MLL Goalie Stats nested schema
export class MLLGoalieStats extends Schema.Class<MLLGoalieStats>(
  "MLLGoalieStats",
)({
  // Core goalie stats (always present)
  games_played: Schema.Number,
  wins: Schema.Number,
  losses: Schema.Number,

  // Goals against / saves
  goals_against: Schema.Number,
  saves: Schema.Number,

  // Calculated stats (nullable - may not be available for all seasons)
  gaa: Schema.NullOr(Schema.Number), // Goals Against Average
  save_pct: Schema.NullOr(Schema.Number), // Save Percentage
}) {}

// MLL Standing response schema
export class MLLStanding extends Schema.Class<MLLStanding>("MLLStanding")({
  team_id: Schema.String,
  team_name: Schema.NullOr(Schema.String),
  position: Schema.Number,

  // Win/Loss record
  wins: Schema.Number,
  losses: Schema.Number,
  games_played: Schema.Number,

  // Goals
  goals_for: Schema.Number,
  goals_against: Schema.Number,
  goal_diff: Schema.Number,

  // Percentage
  win_pct: Schema.Number,
}) {}

// MLL Stat Leader response schema
export class MLLStatLeader extends Schema.Class<MLLStatLeader>("MLLStatLeader")(
  {
    player_id: Schema.String,
    player_name: Schema.String,
    team_id: Schema.NullOr(Schema.String),
    team_name: Schema.NullOr(Schema.String),
    stat_type: Schema.String,
    stat_value: Schema.Number,
    rank: Schema.Number,
  },
) {}

// MLL Game response schema (from Wayback Machine archives)
export class MLLGame extends Schema.Class<MLLGame>("MLLGame")({
  id: Schema.String,
  date: Schema.NullOr(Schema.String),
  status: Schema.NullOr(Schema.String),

  // Team references
  home_team_id: Schema.NullOr(Schema.String),
  away_team_id: Schema.NullOr(Schema.String),
  home_team_name: Schema.NullOr(Schema.String),
  away_team_name: Schema.NullOr(Schema.String),

  // Scores (nullable - may not have scores for all games)
  home_score: Schema.NullOr(Schema.Number),
  away_score: Schema.NullOr(Schema.Number),

  // Location
  venue: Schema.NullOr(Schema.String),

  // Source tracking
  source_url: Schema.NullOr(Schema.String),
}) {}

// ============================================================================
// MLL Request Schemas
// ============================================================================

// Request schema for fetching MLL teams by year
export class MLLTeamsRequest extends Schema.Class<MLLTeamsRequest>(
  "MLLTeamsRequest",
)({
  year: MLLYear,
}) {}

// Request schema for fetching MLL players by year
export class MLLPlayersRequest extends Schema.Class<MLLPlayersRequest>(
  "MLLPlayersRequest",
)({
  year: MLLYear,
}) {}

// Request schema for fetching MLL goalies by year
export class MLLGoaliesRequest extends Schema.Class<MLLGoaliesRequest>(
  "MLLGoaliesRequest",
)({
  year: MLLYear,
}) {}

// Request schema for fetching MLL standings by year
export class MLLStandingsRequest extends Schema.Class<MLLStandingsRequest>(
  "MLLStandingsRequest",
)({
  year: MLLYear,
}) {}

// Request schema for fetching MLL stat leaders by year
export class MLLStatLeadersRequest extends Schema.Class<MLLStatLeadersRequest>(
  "MLLStatLeadersRequest",
)({
  year: MLLYear,
  statType: Schema.optional(Schema.String),
}) {}

// Request schema for fetching MLL schedule by year
export class MLLScheduleRequest extends Schema.Class<MLLScheduleRequest>(
  "MLLScheduleRequest",
)({
  year: MLLYear,
}) {}

// ============================================================================
// Wayback Machine CDX API Response Schemas
// ============================================================================

// Single entry from the Wayback Machine CDX API
// See: https://archive.org/developers/wayback-cdx-server.html
export class WaybackCDXEntry extends Schema.Class<WaybackCDXEntry>(
  "WaybackCDXEntry",
)({
  urlkey: Schema.String,
  timestamp: Schema.String,
  original: Schema.String,
  mimetype: Schema.String,
  statuscode: Schema.String,
  digest: Schema.String,
  length: Schema.String,
}) {}

// CDX API returns an array of entries
export const WaybackCDXResponse = Schema.Array(WaybackCDXEntry);
