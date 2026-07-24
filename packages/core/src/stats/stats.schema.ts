import { Schema } from "effect";

const Id = Schema.String.check(Schema.isMinLength(1));
const Count = Schema.Number.check(
  Schema.isInt({ message: "Statistic must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(0, { message: "Statistic cannot be negative" }),
);
const NullableCount = Schema.NullOr(Count);

export class FixtureTeamStat extends Schema.Class<FixtureTeamStat>(
  "FixtureTeamStat",
)({
  fixtureId: Id,
  teamId: Id,
  goalsForOverride: NullableCount,
  goalsAgainstOverride: NullableCount,
  assistedGoals: Count,
  shots: NullableCount,
  saves: NullableCount,
  effectiveGoalsFor: Count,
  effectiveGoalsAgainst: Count,
  updatedAt: Schema.NullOr(Schema.Date),
}) {}

export class FixturePlayerStat extends Schema.Class<FixturePlayerStat>(
  "FixturePlayerStat",
)({
  rosterPlayerId: Id,
  playerName: Schema.String,
  jerseyNumber: NullableCount,
  goals: Count,
  assists: Count,
  points: Count,
  shots: NullableCount,
  saves: NullableCount,
}) {}

export class FixtureStatSheet extends Schema.Class<FixtureStatSheet>(
  "FixtureStatSheet",
)({
  fixtureId: Id,
  team: Schema.NullOr(FixtureTeamStat),
  players: Schema.Array(FixturePlayerStat),
}) {}

export class UpsertFixturePlayerStatInput extends Schema.Class<UpsertFixturePlayerStatInput>(
  "UpsertFixturePlayerStatInput",
)({
  rosterPlayerId: Id,
  goals: Count,
  assists: Count,
  shots: NullableCount,
  saves: NullableCount,
}) {}

export class UpsertFixtureStatSheetInput extends Schema.Class<UpsertFixtureStatSheetInput>(
  "UpsertFixtureStatSheetInput",
)({
  organizationId: Id,
  fixtureId: Id,
  submittedByUserId: Schema.NullOr(Id),
  goalsForOverride: NullableCount,
  goalsAgainstOverride: NullableCount,
  assistedGoals: Count,
  shots: NullableCount,
  saves: NullableCount,
  players: Schema.Array(UpsertFixturePlayerStatInput),
}) {}

export class FixtureStatsInput extends Schema.Class<FixtureStatsInput>(
  "FixtureStatsInput",
)({
  organizationId: Id,
  fixtureId: Id,
}) {}

export class TeamSeasonStatsInput extends Schema.Class<TeamSeasonStatsInput>(
  "TeamSeasonStatsInput",
)({
  organizationId: Id,
  teamId: Id,
  seasonId: Schema.optional(Id),
}) {}

export class TeamSeasonSummary extends Schema.Class<TeamSeasonSummary>(
  "TeamSeasonSummary",
)({
  teamId: Id,
  seasonId: Schema.NullOr(Id),
  played: Count,
  wins: Count,
  losses: Count,
  draws: Count,
  goalsFor: Count,
  goalsAgainst: Count,
  goalDifference: Schema.Number.check(Schema.isInt()),
  assistedGoals: Count,
  shots: NullableCount,
  saves: NullableCount,
  gamesWithStats: Count,
}) {}

export class ManualPlayerSeasonTotal extends Schema.Class<ManualPlayerSeasonTotal>(
  "ManualPlayerSeasonTotal",
)({
  rosterPlayerId: Id,
  playerName: Schema.String,
  jerseyNumber: NullableCount,
  gamesPlayed: Count,
  goals: Count,
  assists: Count,
  points: Count,
  shots: NullableCount,
  saves: NullableCount,
}) {}

export class GamedayPlayerSeasonTotal extends Schema.Class<GamedayPlayerSeasonTotal>(
  "GamedayPlayerSeasonTotal",
)({
  rosterPlayerId: Id,
  playerName: Schema.String,
  jerseyNumber: NullableCount,
  gamesPlayed: NullableCount,
  goals: NullableCount,
  assists: NullableCount,
  points: NullableCount,
}) {}

export class TeamPlayerStats extends Schema.Class<TeamPlayerStats>(
  "TeamPlayerStats",
)({
  teamId: Id,
  seasonId: Schema.NullOr(Id),
  manual: Schema.Array(ManualPlayerSeasonTotal),
  gameday: Schema.Array(GamedayPlayerSeasonTotal),
}) {}

export class StandingRow extends Schema.Class<StandingRow>("StandingRow")({
  position: Count,
  gamedayTeamId: Schema.NullOr(Id),
  teamName: Schema.String,
  played: Count,
  wins: Count,
  losses: Count,
  draws: Count,
  byes: Count,
  forfeitsFor: Count,
  forfeitsGiven: Count,
  goalsFor: Count,
  goalsAgainst: Count,
  goalDifference: Schema.Number.check(Schema.isInt()),
  percentage: Schema.Number,
  premiershipPoints: Count,
}) {}

export class TeamStandings extends Schema.Class<TeamStandings>("TeamStandings")(
  {
    teamId: Id,
    seasonId: Id,
    compId: Id,
    compName: Schema.String,
    gamedayTeamId: Id,
    sourceUploadedAt: Schema.NullOr(Schema.String),
    fetchedAt: Schema.Date,
    rows: Schema.Array(StandingRow),
  },
) {}
