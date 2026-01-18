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
