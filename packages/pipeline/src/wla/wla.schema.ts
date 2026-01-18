import { Schema } from "effect";

// WLA (Western Lacrosse Association) data source: Pointstreak
// Season years range from 2005 to present (mapped to season IDs on Pointstreak)

export const WLASeasonId = Schema.Number.pipe(
  Schema.int(),
  Schema.between(2005, 2035),
  Schema.brand("WLASeasonId"),
  Schema.annotations({
    description: "WLA season year (e.g., 2024 for the 2024 season)",
  }),
);
export type WLASeasonId = typeof WLASeasonId.Type;

// WLA Team response schema
export class WLATeam extends Schema.Class<WLATeam>("WLATeam")({
  id: Schema.String,
  code: Schema.String,
  name: Schema.String,
  city: Schema.NullOr(Schema.String),
  logo_url: Schema.NullOr(Schema.String),
  website_url: Schema.NullOr(Schema.String),
}) {}

// WLA Player Stats nested schema (used in WLAPlayer)
export class WLAPlayerStats extends Schema.Class<WLAPlayerStats>(
  "WLAPlayerStats",
)({
  // Core stats
  games_played: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  penalty_minutes: Schema.Number,

  // Special teams goals (nullable - may not be tracked in all seasons)
  ppg: Schema.NullOr(Schema.Number), // power play goals
  shg: Schema.NullOr(Schema.Number), // short-handed goals
  gwg: Schema.NullOr(Schema.Number), // game-winning goals

  // Efficiency
  scoring_pct: Schema.NullOr(Schema.Number), // scoring percentage
}) {}

// WLA Player response schema
export class WLAPlayer extends Schema.Class<WLAPlayer>("WLAPlayer")({
  id: Schema.String,
  first_name: Schema.NullOr(Schema.String),
  last_name: Schema.NullOr(Schema.String),
  full_name: Schema.NullOr(Schema.String),
  jersey_number: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_code: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  stats: Schema.optional(WLAPlayerStats),
}) {}

// WLA Goalie Stats nested schema (used in WLAGoalie)
export class WLAGoalieStats extends Schema.Class<WLAGoalieStats>(
  "WLAGoalieStats",
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
}) {}
