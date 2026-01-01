import { Schema } from "effect";

// PLL started in 2019, allow reasonable future years
const PLLYear = Schema.Number.pipe(
  Schema.between(2019, 2035),
  Schema.annotations({ description: "PLL season year (2019-2035)" }),
);

const PositiveLimit = Schema.Number.pipe(
  Schema.positive(),
  Schema.int(),
  Schema.lessThanOrEqualTo(1000),
  Schema.annotations({ description: "Result limit (1-1000)" }),
);

export class PLLTeamStanding extends Schema.Class<PLLTeamStanding>(
  "PLLTeamStanding",
)({
  teamId: Schema.String,
  fullName: Schema.String,
  location: Schema.NullOr(Schema.String),
  locationCode: Schema.NullOr(Schema.String),
  urlLogo: Schema.String,
  seed: Schema.NullOr(Schema.Number),
  wins: Schema.Number,
  losses: Schema.Number,
  ties: Schema.Number,
  scores: Schema.Number,
  scoresAgainst: Schema.Number,
  scoreDiff: Schema.Number,
  conferenceWins: Schema.Number,
  conferenceLosses: Schema.Number,
  conferenceTies: Schema.Number,
  conferenceScores: Schema.Number,
  conferenceScoresAgainst: Schema.Number,
  conference: Schema.NullOr(Schema.String),
  conferenceSeed: Schema.NullOr(Schema.Number),
}) {}

export class PLLStandingsResponse extends Schema.Class<PLLStandingsResponse>(
  "PLLStandingsResponse",
)({
  data: Schema.Struct({
    items: Schema.Array(PLLTeamStanding),
  }),
}) {}

export class PLLStandingsRequest extends Schema.Class<PLLStandingsRequest>(
  "PLLStandingsRequest",
)({
  year: PLLYear,
  champSeries: Schema.optionalWith(Schema.Boolean, { default: () => false }),
}) {}

export class PLLPlayerStats extends Schema.Class<PLLPlayerStats>(
  "PLLPlayerStats",
)({
  gamesPlayed: Schema.Number,
  goals: Schema.Number,
  twoPointGoals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  scoringPoints: Schema.Number,
  shots: Schema.Number,
  shotPct: Schema.Number,
  shotsOnGoal: Schema.Number,
  shotsOnGoalPct: Schema.Number,
  twoPointShots: Schema.Number,
  twoPointShotPct: Schema.Number,
  twoPointShotsOnGoal: Schema.optional(Schema.Number),
  twoPointShotsOnGoalPct: Schema.optional(Schema.Number),
  groundBalls: Schema.Number,
  turnovers: Schema.Number,
  causedTurnovers: Schema.Number,
  faceoffsWon: Schema.Number,
  faceoffsLost: Schema.Number,
  faceoffs: Schema.Number,
  faceoffPct: Schema.Number,
  foRecord: Schema.optional(Schema.String),
  saves: Schema.Number,
  savePct: Schema.Number,
  goalsAgainst: Schema.Number,
  twoPointGoalsAgainst: Schema.optional(Schema.Number),
  GAA: Schema.Number,
  twoPtGaa: Schema.optional(Schema.Number),
  plusMinus: Schema.Number,
  onePointGoals: Schema.optional(Schema.Number),
  scoresAgainst: Schema.optional(Schema.Number),
  saa: Schema.optional(Schema.Number),
  numPenalties: Schema.optional(Schema.Number),
  pim: Schema.optional(Schema.Number),
  pimValue: Schema.optional(Schema.Number),
  powerPlayGoals: Schema.optional(Schema.Number),
  powerPlayShots: Schema.optional(Schema.Number),
  powerPlayGoalsAgainst: Schema.optional(Schema.Number),
  shortHandedGoals: Schema.optional(Schema.Number),
  shortHandedShots: Schema.optional(Schema.Number),
  shortHandedGoalsAgainst: Schema.optional(Schema.Number),
  tof: Schema.optional(Schema.Number),
  goalieWins: Schema.optional(Schema.Number),
  goalieLosses: Schema.optional(Schema.Number),
  goalieTies: Schema.optional(Schema.Number),
  shotTurnovers: Schema.optional(Schema.Number),
  touches: Schema.optional(Schema.Number),
  totalPasses: Schema.optional(Schema.Number),
  unassistedGoals: Schema.optional(Schema.Number),
  assistedGoals: Schema.optional(Schema.Number),
  passRate: Schema.optional(Schema.Number),
  shotRate: Schema.optional(Schema.Number),
  goalRate: Schema.optional(Schema.Number),
  assistRate: Schema.optional(Schema.Number),
  turnoverRate: Schema.optional(Schema.Number),
}) {}

export class PLLPlayerTeam extends Schema.Class<PLLPlayerTeam>("PLLPlayerTeam")(
  {
    officialId: Schema.String,
    location: Schema.NullOr(Schema.String),
    locationCode: Schema.NullOr(Schema.String),
    urlLogo: Schema.NullOr(Schema.String),
    league: Schema.NullOr(Schema.String),
    position: Schema.NullOr(Schema.String),
    positionName: Schema.NullOr(Schema.String),
    jerseyNum: Schema.NullOr(Schema.Number),
    year: Schema.Number,
    fullName: Schema.String,
  },
) {}

export class PLLChampSeriesTeam extends Schema.Class<PLLChampSeriesTeam>(
  "PLLChampSeriesTeam",
)({
  officialId: Schema.String,
  locationCode: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  positionName: Schema.NullOr(Schema.String),
}) {}

export class PLLChampSeries extends Schema.Class<PLLChampSeries>(
  "PLLChampSeries",
)({
  position: Schema.NullOr(Schema.String),
  positionName: Schema.NullOr(Schema.String),
  team: Schema.optional(PLLChampSeriesTeam),
  stats: Schema.optional(PLLPlayerStats),
}) {}

export class PLLPlayer extends Schema.Class<PLLPlayer>("PLLPlayer")({
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  lastNameSuffix: Schema.NullOr(Schema.String),
  jerseyNum: Schema.NullOr(Schema.Number),
  collegeYear: Schema.NullOr(Schema.Number),
  country: Schema.NullOr(Schema.String),
  countryCode: Schema.NullOr(Schema.String),
  handedness: Schema.NullOr(Schema.String),
  injuryDescription: Schema.NullOr(Schema.String),
  injuryStatus: Schema.NullOr(Schema.String),
  isCaptain: Schema.NullOr(Schema.Boolean),
  profileUrl: Schema.NullOr(Schema.String),
  experience: Schema.NullOr(Schema.Number),
  expFromYear: Schema.NullOr(Schema.Number),
  allYears: Schema.optional(Schema.Array(Schema.Number)),
  slug: Schema.NullOr(Schema.String),
  allTeams: Schema.Array(PLLPlayerTeam),
  stats: Schema.optional(PLLPlayerStats),
  postStats: Schema.optional(PLLPlayerStats),
  champSeries: Schema.optional(PLLChampSeries),
}) {}

export class PLLPlayersResponse extends Schema.Class<PLLPlayersResponse>(
  "PLLPlayersResponse",
)({
  allPlayers: Schema.Array(PLLPlayer),
}) {}

export class PLLPlayersRequest extends Schema.Class<PLLPlayersRequest>(
  "PLLPlayersRequest",
)({
  season: PLLYear,
  league: Schema.optionalWith(Schema.String, { default: () => "PLL" }),
  includeReg: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  includePost: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  includeZPP: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  limit: Schema.optional(PositiveLimit),
}) {}

export class PLLStatLeader extends Schema.Class<PLLStatLeader>("PLLStatLeader")(
  {
    officialId: Schema.String,
    profileUrl: Schema.NullOr(Schema.String),
    firstName: Schema.String,
    lastName: Schema.String,
    position: Schema.NullOr(Schema.String),
    statType: Schema.String,
    slug: Schema.NullOr(Schema.String),
    statValue: Schema.NumberFromString,
    playerRank: Schema.Number,
    jerseyNum: Schema.NullOr(Schema.String),
    teamId: Schema.String,
    year: Schema.Number,
  },
) {}

export class PLLStatLeadersResponse extends Schema.Class<PLLStatLeadersResponse>(
  "PLLStatLeadersResponse",
)({
  playerStatLeaders: Schema.Array(PLLStatLeader),
}) {}

export type SeasonSegment = "regular" | "post";

export class PLLStatLeadersRequest extends Schema.Class<PLLStatLeadersRequest>(
  "PLLStatLeadersRequest",
)({
  year: PLLYear,
  seasonSegment: Schema.optionalWith(Schema.Literal("regular", "post"), {
    default: () => "regular" as const,
  }),
  statList: Schema.optional(Schema.Array(Schema.String)),
  limit: Schema.optional(PositiveLimit),
}) {}

export class PLLStandingTeam extends Schema.Class<PLLStandingTeam>(
  "PLLStandingTeam",
)({
  officialId: Schema.String,
  location: Schema.NullOr(Schema.String),
  locationCode: Schema.NullOr(Schema.String),
  urlLogo: Schema.NullOr(Schema.String),
  fullName: Schema.String,
}) {}

export class PLLGraphQLStanding extends Schema.Class<PLLGraphQLStanding>(
  "PLLGraphQLStanding",
)({
  team: PLLStandingTeam,
  seed: Schema.NullOr(Schema.Number),
  wins: Schema.optional(Schema.Number),
  losses: Schema.optional(Schema.Number),
  ties: Schema.optional(Schema.Number),
  scores: Schema.optional(Schema.Number),
  scoresAgainst: Schema.optional(Schema.Number),
  scoreDiff: Schema.optional(Schema.Number),
  csWins: Schema.optional(Schema.Number),
  csLosses: Schema.optional(Schema.Number),
  csTies: Schema.optional(Schema.Number),
  csScores: Schema.optional(Schema.Number),
  csScoresAgainst: Schema.optional(Schema.Number),
  csScoreDiff: Schema.optional(Schema.Number),
  conferenceWins: Schema.Number,
  conferenceLosses: Schema.Number,
  conferenceTies: Schema.Number,
  conferenceScores: Schema.Number,
  conferenceScoresAgainst: Schema.Number,
  conference: Schema.NullOr(Schema.String),
  conferenceSeed: Schema.NullOr(Schema.Number),
}) {}

export class PLLGraphQLStandingsResponse extends Schema.Class<PLLGraphQLStandingsResponse>(
  "PLLGraphQLStandingsResponse",
)({
  standings: Schema.Array(PLLGraphQLStanding),
}) {}
