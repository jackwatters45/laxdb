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
