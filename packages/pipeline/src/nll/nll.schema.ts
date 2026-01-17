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
