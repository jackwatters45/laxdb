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

export class PLLCurrentTeam extends Schema.Class<PLLCurrentTeam>(
  "PLLCurrentTeam",
)({
  officialId: Schema.String,
  jerseyNum: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
  locationCode: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  fullName: Schema.String,
  urlLogo: Schema.NullOr(Schema.String),
}) {}

export class PLLAdvancedPlayerStats extends Schema.Class<PLLAdvancedPlayerStats>(
  "PLLAdvancedPlayerStats",
)({
  gamesPlayed: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  shots: Schema.Number,
  touches: Schema.NullOr(Schema.Number),
  totalPasses: Schema.NullOr(Schema.Number),
  turnovers: Schema.Number,
  passRate: Schema.NullOr(Schema.Number),
  shotRate: Schema.NullOr(Schema.Number),
  goalRate: Schema.NullOr(Schema.Number),
  assistRate: Schema.NullOr(Schema.Number),
  turnoverRate: Schema.NullOr(Schema.Number),
}) {}

export class PLLAdvancedSeasonStats extends Schema.Class<PLLAdvancedSeasonStats>(
  "PLLAdvancedSeasonStats",
)({
  unassistedGoals: Schema.NullOr(Schema.Number),
  assistedGoals: Schema.NullOr(Schema.Number),
  settledGoals: Schema.NullOr(Schema.Number),
  fastbreakGoals: Schema.NullOr(Schema.Number),
  substitutionGoals: Schema.NullOr(Schema.Number),
  doorstepGoals: Schema.NullOr(Schema.Number),
  powerPlayGoals: Schema.NullOr(Schema.Number),

  assistOpportunities: Schema.NullOr(Schema.Number),
  settledAssists: Schema.NullOr(Schema.Number),
  powerPlayAssists: Schema.NullOr(Schema.Number),
  fastbreakAssists: Schema.NullOr(Schema.Number),
  dodgeAssists: Schema.NullOr(Schema.Number),
  pnrAssists: Schema.NullOr(Schema.Number),

  unassistedShots: Schema.NullOr(Schema.Number),
  unassistedShotPct: Schema.NullOr(Schema.Number),
  assistedShots: Schema.NullOr(Schema.Number),
  assistedShotPct: Schema.NullOr(Schema.Number),
  pipeShots: Schema.NullOr(Schema.Number),

  lhShots: Schema.NullOr(Schema.Number),
  lhGoals: Schema.NullOr(Schema.Number),
  lhShotPct: Schema.NullOr(Schema.Number),
  rhShots: Schema.NullOr(Schema.Number),
  rhGoals: Schema.NullOr(Schema.Number),
  rhShotPct: Schema.NullOr(Schema.Number),
}) {}

export class PLLAdvancedPlayer extends Schema.Class<PLLAdvancedPlayer>(
  "PLLAdvancedPlayer",
)({
  officialId: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  slug: Schema.NullOr(Schema.String),
  currentTeam: Schema.NullOr(PLLCurrentTeam),
  stats: Schema.NullOr(PLLAdvancedPlayerStats),
  advancedSeasonStats: Schema.NullOr(PLLAdvancedSeasonStats),
}) {}

export class PLLAdvancedPlayersResponse extends Schema.Class<PLLAdvancedPlayersResponse>(
  "PLLAdvancedPlayersResponse",
)({
  allPlayers: Schema.Array(PLLAdvancedPlayer),
}) {}

export class PLLAdvancedPlayersRequest extends Schema.Class<PLLAdvancedPlayersRequest>(
  "PLLAdvancedPlayersRequest",
)({
  year: PLLYear,
  limit: Schema.optionalWith(PositiveLimit, { default: () => 250 }),
  league: Schema.optionalWith(Schema.String, { default: () => "PLL" }),
}) {}

// Team stats (shared between regular, post, and champSeries)
export class PLLTeamStats extends Schema.Class<PLLTeamStats>("PLLTeamStats")({
  gamesPlayed: Schema.Number,
  scores: Schema.Number,
  scoresAgainst: Schema.Number,
  goals: Schema.Number,
  twoPointGoals: Schema.Number,
  onePointGoals: Schema.NullOr(Schema.Number),
  assists: Schema.Number,
  groundBalls: Schema.Number,
  turnovers: Schema.Number,
  causedTurnovers: Schema.Number,
  faceoffsWon: Schema.Number,
  faceoffsLost: Schema.Number,
  faceoffs: Schema.Number,
  faceoffPct: Schema.Number,
  shots: Schema.Number,
  shotPct: Schema.Number,
  twoPointShots: Schema.Number,
  twoPointShotPct: Schema.Number,
  twoPointShotsOnGoal: Schema.Number,
  twoPointShotsOnGoalPct: Schema.Number,
  shotsOnGoal: Schema.Number,
  shotsOnGoalPct: Schema.Number,
  goalsAgainst: Schema.Number,
  twoPointGoalsAgainst: Schema.Number,
  numPenalties: Schema.Number,
  pim: Schema.Number,
  clears: Schema.Number,
  clearAttempts: Schema.Number,
  clearPct: Schema.Number,
  rides: Schema.Number,
  rideAttempts: Schema.Number,
  ridesPct: Schema.Number,
  saves: Schema.Number,
  savePct: Schema.Number,
  saa: Schema.NullOr(Schema.Number),
  offsides: Schema.Number,
  shotClockExpirations: Schema.Number,
  powerPlayGoals: Schema.Number,
  powerPlayShots: Schema.Number,
  powerPlayPct: Schema.Number,
  powerPlayGoalsAgainst: Schema.Number,
  powerPlayShotsAgainst: Schema.Number,
  powerPlayGoalsAgainstPct: Schema.Number,
  shortHandedGoals: Schema.Number,
  shortHandedShots: Schema.Number,
  shortHandedPct: Schema.Number,
  shortHandedShotsAgainst: Schema.Number,
  shortHandedGoalsAgainst: Schema.Number,
  shortHandedGoalsAgainstPct: Schema.Number,
  manDownPct: Schema.Number,
  timesManUp: Schema.Number,
  timesShortHanded: Schema.Number,
  scoresPG: Schema.NullOr(Schema.Number),
  shotsPG: Schema.NullOr(Schema.Number),
  totalPasses: Schema.NullOr(Schema.Number),
  touches: Schema.NullOr(Schema.Number),
}) {}

export class PLLCoach extends Schema.Class<PLLCoach>("PLLCoach")({
  name: Schema.String,
  coachType: Schema.String,
}) {}

export class PLLTeamChampSeries extends Schema.Class<PLLTeamChampSeries>(
  "PLLTeamChampSeries",
)({
  teamWins: Schema.Number,
  teamLosses: Schema.Number,
  teamTies: Schema.Number,
  stats: Schema.NullOr(PLLTeamStats),
}) {}

export class PLLTeam extends Schema.Class<PLLTeam>("PLLTeam")({
  officialId: Schema.String,
  locationCode: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  fullName: Schema.String,
  urlLogo: Schema.NullOr(Schema.String),
  slogan: Schema.NullOr(Schema.String),
  teamWins: Schema.Number,
  teamLosses: Schema.Number,
  teamTies: Schema.Number,
  teamWinsPost: Schema.NullOr(Schema.Number),
  teamLossesPost: Schema.NullOr(Schema.Number),
  teamTiesPost: Schema.NullOr(Schema.Number),
  league: Schema.NullOr(Schema.String),
  coaches: Schema.Array(PLLCoach),
  stats: Schema.NullOr(PLLTeamStats),
  postStats: Schema.NullOr(PLLTeamStats),
  champSeries: Schema.optional(PLLTeamChampSeries),
}) {}

export class PLLTeamsResponse extends Schema.Class<PLLTeamsResponse>(
  "PLLTeamsResponse",
)({
  allTeams: Schema.Array(PLLTeam),
}) {}

export class PLLTeamsRequest extends Schema.Class<PLLTeamsRequest>(
  "PLLTeamsRequest",
)({
  year: PLLYear,
  sortBy: Schema.optionalWith(Schema.String, { default: () => "points" }),
  includeChampSeries: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
}) {}

export class PLLCareerStatsPlayer extends Schema.Class<PLLCareerStatsPlayer>(
  "PLLCareerStatsPlayer",
)({
  name: Schema.String,
  experience: Schema.NullOr(Schema.Number),
  allYears: Schema.NullOr(Schema.Array(Schema.Number)),
  slug: Schema.NullOr(Schema.String),
}) {}

export class PLLCareerStat extends Schema.Class<PLLCareerStat>("PLLCareerStat")(
  {
    player: PLLCareerStatsPlayer,
    gamesPlayed: Schema.Number,
    points: Schema.Number,
    goals: Schema.Number,
    onePointGoals: Schema.NullOr(Schema.Number),
    twoPointGoals: Schema.Number,
    assists: Schema.Number,
    groundBalls: Schema.Number,
    saves: Schema.Number,
    faceoffsWon: Schema.Number,
  },
) {}

export class PLLCareerStatsResponse extends Schema.Class<PLLCareerStatsResponse>(
  "PLLCareerStatsResponse",
)({
  careerStats: Schema.Array(PLLCareerStat),
}) {}

export class PLLCareerStatsRequest extends Schema.Class<PLLCareerStatsRequest>(
  "PLLCareerStatsRequest",
)({
  stat: Schema.optional(Schema.String),
  limit: Schema.optional(PositiveLimit),
}) {}

export class PLLPlayerCareerStats extends Schema.Class<PLLPlayerCareerStats>(
  "PLLPlayerCareerStats",
)({
  gamesPlayed: Schema.Number,
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  turnovers: Schema.Number,
  shots: Schema.Number,
  shotPct: Schema.Number,
  shotsOnGoal: Schema.Number,
  shotsOnGoalPct: Schema.Number,
  gamesStarted: Schema.NullOr(Schema.Number),
  onePointGoals: Schema.NullOr(Schema.Number),
  twoPointGoals: Schema.Number,
  saves: Schema.Number,
  savePct: Schema.Number,
  scoresAgainst: Schema.NullOr(Schema.Number),
  foRecord: Schema.NullOr(Schema.String),
  faceoffs: Schema.Number,
  faceoffsWon: Schema.Number,
  faceoffPct: Schema.Number,
  causedTurnovers: Schema.Number,
  groundBalls: Schema.Number,
  powerPlayGoals: Schema.NullOr(Schema.Number),
  pimValue: Schema.NullOr(Schema.Number),
  numPenalties: Schema.NullOr(Schema.Number),
  twoPointGoalsAgainst: Schema.NullOr(Schema.Number),
}) {}

export class PLLPlayerAccolade extends Schema.Class<PLLPlayerAccolade>(
  "PLLPlayerAccolade",
)({
  awardName: Schema.String,
  years: Schema.Array(Schema.Number),
}) {}

export class PLLPlayerSeasonStats extends Schema.Class<PLLPlayerSeasonStats>(
  "PLLPlayerSeasonStats",
)({
  year: Schema.Number,
  seasonSegment: Schema.String,
  teamId: Schema.NullOr(Schema.String),
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
  groundBalls: Schema.Number,
  turnovers: Schema.Number,
  causedTurnovers: Schema.Number,
  faceoffsWon: Schema.Number,
  faceoffsLost: Schema.Number,
  faceoffs: Schema.Number,
  faceoffPct: Schema.Number,
  saves: Schema.Number,
  savePct: Schema.Number,
  goalsAgainst: Schema.Number,
  GAA: Schema.Number,
  plusMinus: Schema.Number,
}) {}

export class PLLPlayerDetail extends Schema.Class<PLLPlayerDetail>(
  "PLLPlayerDetail",
)({
  officialId: Schema.String,
  stats: Schema.NullOr(PLLPlayerStats),
  postStats: Schema.NullOr(PLLPlayerStats),
  careerStats: Schema.NullOr(PLLPlayerCareerStats),
  allSeasonStats: Schema.Array(PLLPlayerSeasonStats),
  accolades: Schema.Array(PLLPlayerAccolade),
  champSeries: Schema.NullOr(PLLChampSeries),
  advancedSeasonStats: Schema.NullOr(PLLAdvancedSeasonStats),
}) {}

export class PLLPlayerDetailResponse extends Schema.Class<PLLPlayerDetailResponse>(
  "PLLPlayerDetailResponse",
)({
  player: Schema.NullOr(PLLPlayerDetail),
}) {}

export class PLLPlayerDetailRequest extends Schema.Class<PLLPlayerDetailRequest>(
  "PLLPlayerDetailRequest",
)({
  id: Schema.String,
  year: Schema.optional(PLLYear),
  statsYear: Schema.optional(PLLYear),
}) {}

export class PLLTeamEvent extends Schema.Class<PLLTeamEvent>("PLLTeamEvent")({
  id: Schema.String,
  slugname: Schema.NullOr(Schema.String),
  externalId: Schema.NullOr(Schema.String),
  startTime: Schema.NullOr(Schema.String),
  week: Schema.NullOr(Schema.Number),
  venue: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  broadcaster: Schema.NullOr(Schema.String),
  eventStatus: Schema.NullOr(Schema.String),
}) {}

export class PLLTeamCoach extends Schema.Class<PLLTeamCoach>("PLLTeamCoach")({
  officialId: Schema.String,
  coachType: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
}) {}

export class PLLTeamRosterPlayer extends Schema.Class<PLLTeamRosterPlayer>(
  "PLLTeamRosterPlayer",
)({
  officialId: Schema.String,
  slug: Schema.NullOr(Schema.String),
  firstName: Schema.String,
  lastName: Schema.String,
  lastNameSuffix: Schema.NullOr(Schema.String),
  jerseyNum: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
  positionName: Schema.NullOr(Schema.String),
  handedness: Schema.NullOr(Schema.String),
  profileUrl: Schema.NullOr(Schema.String),
  injuryStatus: Schema.NullOr(Schema.String),
  injuryDescription: Schema.NullOr(Schema.String),
  isCaptain: Schema.NullOr(Schema.Boolean),
}) {}

export class PLLTeamDetail extends Schema.Class<PLLTeamDetail>("PLLTeamDetail")(
  {
    officialId: Schema.String,
    urlLogo: Schema.NullOr(Schema.String),
    location: Schema.NullOr(Schema.String),
    locationCode: Schema.NullOr(Schema.String),
    fullName: Schema.String,
    league: Schema.NullOr(Schema.String),
    slogan: Schema.NullOr(Schema.String),
    teamWins: Schema.Number,
    teamLosses: Schema.Number,
    teamTies: Schema.Number,
    teamWinsPost: Schema.NullOr(Schema.Number),
    teamLossesPost: Schema.NullOr(Schema.Number),
    teamTiesPost: Schema.NullOr(Schema.Number),
    allYears: Schema.Array(Schema.Number),
    coaches: Schema.Array(PLLTeamCoach),
    events: Schema.Array(PLLTeamEvent),
    roster: Schema.Array(PLLTeamRosterPlayer),
    stats: Schema.NullOr(PLLTeamStats),
    postStats: Schema.NullOr(PLLTeamStats),
    champSeries: Schema.optional(PLLTeamChampSeries),
  },
) {}

export class PLLTeamDetailResponse extends Schema.Class<PLLTeamDetailResponse>(
  "PLLTeamDetailResponse",
)({
  team: Schema.NullOr(PLLTeamDetail),
}) {}

export class PLLTeamDetailRequest extends Schema.Class<PLLTeamDetailRequest>(
  "PLLTeamDetailRequest",
)({
  id: Schema.String,
  year: Schema.optional(PLLYear),
  statsYear: Schema.optional(PLLYear),
  eventsYear: Schema.optional(PLLYear),
  includeChampSeries: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
}) {}

export class PLLTeamStatsOnly extends Schema.Class<PLLTeamStatsOnly>(
  "PLLTeamStatsOnly",
)({
  stats: Schema.NullOr(PLLTeamStats),
}) {}

export class PLLTeamStatsResponse extends Schema.Class<PLLTeamStatsResponse>(
  "PLLTeamStatsResponse",
)({
  team: Schema.NullOr(PLLTeamStatsOnly),
}) {}

export class PLLTeamStatsRequest extends Schema.Class<PLLTeamStatsRequest>(
  "PLLTeamStatsRequest",
)({
  id: Schema.String,
  year: Schema.optional(PLLYear),
  segment: Schema.Literal("regular", "post"),
}) {}

export class PLLEventTeam extends Schema.Class<PLLEventTeam>("PLLEventTeam")({
  officialId: Schema.String,
  year: Schema.Number,
  urlLogo: Schema.NullOr(Schema.String),
  fullName: Schema.String,
  location: Schema.NullOr(Schema.String),
  locationCode: Schema.NullOr(Schema.String),
  league: Schema.NullOr(Schema.String),
  conference: Schema.NullOr(Schema.String),
  slogan: Schema.NullOr(Schema.String),
  teamWins: Schema.Number,
  teamLosses: Schema.Number,
  teamTies: Schema.Number,
  teamTiesPost: Schema.NullOr(Schema.Number),
  teamLossesPost: Schema.NullOr(Schema.Number),
  teamWinsPost: Schema.NullOr(Schema.Number),
  seed: Schema.NullOr(Schema.Number),
  shopImg: Schema.NullOr(Schema.String),
  teamColor: Schema.NullOr(Schema.String),
  backgroundColor: Schema.NullOr(Schema.String),
  spotifyId: Schema.NullOr(Schema.String),
  twTag: Schema.NullOr(Schema.String),
  igTag: Schema.NullOr(Schema.String),
  team_id: Schema.String,
}) {}

export class PLLEvent extends Schema.Class<PLLEvent>("PLLEvent")({
  id: Schema.Number,
  slugname: Schema.NullOr(Schema.String),
  eventId: Schema.NullOr(Schema.String),
  externalId: Schema.NullOr(Schema.String),
  league: Schema.NullOr(Schema.String),
  seasonSegment: Schema.NullOr(Schema.String),
  startTime: Schema.NullOr(Schema.String),
  week: Schema.NullOr(Schema.String),
  year: Schema.Number,
  gameNumber: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
  venue: Schema.NullOr(Schema.String),
  venueLocation: Schema.NullOr(Schema.String),
  urlStreaming: Schema.NullOr(Schema.String),
  urlTicket: Schema.NullOr(Schema.String),
  urlPreview: Schema.NullOr(Schema.String),
  broadcaster: Schema.NullOr(Schema.Array(Schema.String)),
  addToCalendarId: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  weekendTicketId: Schema.NullOr(Schema.String),
  suiteId: Schema.NullOr(Schema.String),
  waitlistUrl: Schema.NullOr(Schema.String),
  waitlist: Schema.NullOr(Schema.Boolean),
  eventStatus: Schema.NullOr(Schema.Number),
  period: Schema.NullOr(Schema.Number),
  clockMinutes: Schema.NullOr(Schema.Number),
  clockSeconds: Schema.NullOr(Schema.Number),
  clockTenths: Schema.NullOr(Schema.Number),
  gameStatus: Schema.NullOr(Schema.String),
  externalEventId: Schema.NullOr(Schema.String),
  visitorScore: Schema.NullOr(Schema.Number),
  homeScore: Schema.NullOr(Schema.Number),
  homeTeam: Schema.NullOr(PLLEventTeam),
  awayTeam: Schema.NullOr(PLLEventTeam),
  ticketId: Schema.NullOr(Schema.String),
  snl: Schema.NullOr(Schema.Boolean),
}) {}

export class PLLEventsResponse extends Schema.Class<PLLEventsResponse>(
  "PLLEventsResponse",
)({
  data: Schema.Struct({
    items: Schema.Array(PLLEvent),
  }),
}) {}

export class PLLEventsRequest extends Schema.Class<PLLEventsRequest>(
  "PLLEventsRequest",
)({
  year: PLLYear,
  includeCS: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  includeWLL: Schema.optionalWith(Schema.Boolean, { default: () => true }),
}) {}
