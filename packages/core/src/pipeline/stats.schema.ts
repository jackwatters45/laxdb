import { Schema } from "effect";

// League abbreviation literal type
export const LeagueAbbreviation = Schema.Literal(
  "PLL",
  "NLL",
  "MLL",
  "MSL",
  "WLA",
);
export type LeagueAbbreviation = typeof LeagueAbbreviation.Type;

// Sort options for leaderboard
export const StatSortColumn = Schema.Literal("points", "goals", "assists");
export type StatSortColumn = typeof StatSortColumn.Type;

// Player stat with joined details (for leaderboard display)
export class PlayerStatWithDetails extends Schema.Class<PlayerStatWithDetails>(
  "PlayerStatWithDetails",
)({
  // Stat fields
  statId: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  gamesPlayed: Schema.Number,
  // Player fields
  playerId: Schema.Number,
  playerName: Schema.String,
  position: Schema.NullOr(Schema.String),
  // Team fields
  teamId: Schema.Number,
  teamName: Schema.String,
  teamAbbreviation: Schema.NullOr(Schema.String),
  // League fields
  leagueId: Schema.Number,
  leagueAbbreviation: Schema.String,
  // Season fields
  seasonId: Schema.Number,
  seasonYear: Schema.Number,
}) {}

// Leaderboard entry (simplified for display)
export class LeaderboardEntry extends Schema.Class<LeaderboardEntry>(
  "LeaderboardEntry",
)({
  statId: Schema.Number,
  rank: Schema.Number,
  playerId: Schema.Number,
  playerName: Schema.String,
  position: Schema.NullOr(Schema.String),
  teamName: Schema.NullOr(Schema.String),
  teamAbbreviation: Schema.NullOr(Schema.String),
  leagueAbbreviation: Schema.String,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  gamesPlayed: Schema.Number,
}) {}

// Team stat summary
export class TeamStatSummary extends Schema.Class<TeamStatSummary>(
  "TeamStatSummary",
)({
  teamId: Schema.Number,
  teamName: Schema.String,
  teamAbbreviation: Schema.NullOr(Schema.String),
  leagueAbbreviation: Schema.String,
  seasonYear: Schema.Number,
  totalGoals: Schema.Number,
  totalAssists: Schema.Number,
  totalPoints: Schema.Number,
  playerCount: Schema.Number,
}) {}

// Input schemas
export class GetPlayerStatsInput extends Schema.Class<GetPlayerStatsInput>(
  "GetPlayerStatsInput",
)({
  playerId: Schema.Number,
  seasonId: Schema.optional(Schema.Number),
}) {}

export class GetLeaderboardInput extends Schema.Class<GetLeaderboardInput>(
  "GetLeaderboardInput",
)({
  leagues: Schema.Array(LeagueAbbreviation),
  sort: Schema.optionalWith(StatSortColumn, {
    default: () => "points" as const,
  }),
  cursor: Schema.optional(Schema.String),
  limit: Schema.optionalWith(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThan(0),
      Schema.lessThanOrEqualTo(100),
    ),
    { default: () => 50 },
  ),
}) {}

export class GetTeamStatsInput extends Schema.Class<GetTeamStatsInput>(
  "GetTeamStatsInput",
)({
  teamId: Schema.Number,
  seasonId: Schema.optional(Schema.Number),
}) {}

// Paginated response
export class LeaderboardResponse extends Schema.Class<LeaderboardResponse>(
  "LeaderboardResponse",
)({
  data: Schema.Array(LeaderboardEntry),
  nextCursor: Schema.NullOr(Schema.String),
}) {}
