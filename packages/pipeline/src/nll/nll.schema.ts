import { Schema } from "effect";

// NLL season ID - positive integer (e.g., 225 = 2025-26 season)
export const NLLSeasonId = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("NLLSeasonId"),
  Schema.annotations({
    description: "NLL season identifier (positive integer)",
  }),
);
export type NLLSeasonId = typeof NLLSeasonId.Type;

// NLL Team response schema
export class NLLTeam extends Schema.Class<NLLTeam>("NLLTeam")({
  id: Schema.String,
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  nickname: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  team_city: Schema.NullOr(Schema.String),
  team_logo: Schema.NullOr(Schema.String),
  team_website_url: Schema.NullOr(Schema.String),
}) {}

// NLL Player Season Stats - nested schema for player statistics
export class NLLPlayerSeasonStats extends Schema.Class<NLLPlayerSeasonStats>(
  "NLLPlayerSeasonStats",
)({
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  penalty_minutes: Schema.Number,
  games_played: Schema.Number,
}) {}

// NLL Player response schema
export class NLLPlayer extends Schema.Class<NLLPlayer>("NLLPlayer")({
  personId: Schema.String,
  firstname: Schema.NullOr(Schema.String),
  surname: Schema.NullOr(Schema.String),
  fullname: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  height: Schema.NullOr(Schema.String),
  weight: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  jerseyNumber: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_code: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  matches: Schema.optional(NLLPlayerSeasonStats),
}) {}

// NLL Standing response schema
export class NLLStanding extends Schema.Class<NLLStanding>("NLLStanding")({
  team_id: Schema.String,
  name: Schema.NullOr(Schema.String),
  wins: Schema.Number,
  losses: Schema.Number,
  games_played: Schema.Number,
  win_percentage: Schema.Number,
  goals_for: Schema.Number,
  goals_against: Schema.Number,
  goal_diff: Schema.Number,
  position: Schema.Number,
}) {}
