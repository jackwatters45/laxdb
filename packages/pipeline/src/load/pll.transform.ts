/**
 * PLL Transform Functions
 *
 * Transform PLL extracted data into pro_* schema format.
 */

import type {
  PLLTeam,
  PLLPlayer,
  PLLTeamStanding,
  PLLEvent,
  PLLPlayerStats,
  PLLTeamStats,
} from "../pll/pll.schema";

// Note: Stats types are from @laxdb/core/pro-league but we return Record<string, unknown>
// for JSONB compatibility with the Effect Schema
import type {
  TransformContext,
  UpsertTeamInput,
  UpsertPlayerInput,
  UpsertPlayerSeasonInput,
  UpsertGameInput,
  UpsertStandingsInput,
  UpsertSeasonInput,
} from "./transform.types";

// =============================================================================
// SEASON TRANSFORM
// =============================================================================

/**
 * Create season input from PLL season info
 */
export const transformPLLSeason = (
  leagueId: number,
  year: number,
): UpsertSeasonInput => ({
  leagueId,
  externalId: String(year),
  year,
  displayName: String(year), // PLL uses single year (e.g., "2024")
  startDate: null,
  endDate: null,
  isCurrent: false,
});

// =============================================================================
// TEAM TRANSFORMS
// =============================================================================

/**
 * Transform PLLTeam to UpsertTeamInput
 */
export const transformPLLTeam = (
  team: PLLTeam,
  leagueId: number,
): UpsertTeamInput => ({
  leagueId,
  externalId: team.officialId,
  code: team.locationCode,
  name: team.fullName,
  shortName: team.location,
  city: team.location,
  logoUrl: team.urlLogo,
  primaryColor: null,
  secondaryColor: null,
  websiteUrl: null,
  isActive: true,
  firstSeasonYear: null,
  lastSeasonYear: null,
});

/**
 * Transform array of PLLTeams
 */
export const transformPLLTeams = (
  teams: PLLTeam[],
  leagueId: number,
): UpsertTeamInput[] => teams.map((team) => transformPLLTeam(team, leagueId));

// =============================================================================
// PLAYER TRANSFORMS
// =============================================================================

/**
 * Transform PLLPlayer to UpsertPlayerInput
 */
export const transformPLLPlayer = (
  player: PLLPlayer,
  leagueId: number,
): UpsertPlayerInput => {
  // Get current team info for position
  const currentTeam = player.allTeams.find(
    (t) => t.year === Math.max(...player.allTeams.map((x) => x.year)),
  );

  return {
    leagueId,
    externalId: player.officialId,
    firstName: player.firstName,
    lastName: player.lastNameSuffix
      ? `${player.lastName} ${player.lastNameSuffix}`
      : player.lastName,
    fullName: `${player.firstName} ${player.lastName}${player.lastNameSuffix ? ` ${player.lastNameSuffix}` : ""}`,
    position: currentTeam?.position ?? null,
    dateOfBirth: null, // Not available in PLL API
    birthplace: null,
    country: player.countryCode,
    height: null,
    weight: null,
    handedness: player.handedness,
    college: null, // Would need player detail call
    highSchool: null,
    profileUrl: player.profileUrl,
    photoUrl: null,
  };
};

/**
 * Transform array of PLLPlayers
 */
export const transformPLLPlayers = (
  players: PLLPlayer[],
  leagueId: number,
): UpsertPlayerInput[] =>
  players.map((player) => transformPLLPlayer(player, leagueId));

// =============================================================================
// STATS TRANSFORMS
// =============================================================================

/**
 * Check if player is a goalie based on position
 */
const isGoalie = (position: string | null): boolean =>
  position?.toUpperCase() === "G";

/**
 * Transform PLLPlayerStats to PlayerStats JSONB
 * Returns a plain object that can be serialized as JSONB
 */
export const transformPLLPlayerStats = (
  stats: PLLPlayerStats,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {
    gamesPlayed: stats.gamesPlayed,
    goals: stats.goals,
    twoPointGoals: stats.twoPointGoals,
    assists: stats.assists,
    points: stats.points,
    scoringPoints: stats.scoringPoints,
    shots: stats.shots,
    shotPct: stats.shotPct,
    shotsOnGoal: stats.shotsOnGoal,
    shotsOnGoalPct: stats.shotsOnGoalPct,
    twoPointShots: stats.twoPointShots,
    twoPointShotPct: stats.twoPointShotPct,
    groundBalls: stats.groundBalls,
    turnovers: stats.turnovers,
    causedTurnovers: stats.causedTurnovers,
    faceoffsWon: stats.faceoffsWon,
    faceoffsLost: stats.faceoffsLost,
    faceoffs: stats.faceoffs,
    faceoffPct: stats.faceoffPct,
    plusMinus: stats.plusMinus,
  };

  // Add optional fields only if defined
  if (stats.onePointGoals != null) result.onePointGoals = stats.onePointGoals;
  if (stats.twoPointShotsOnGoal != null)
    result.twoPointShotsOnGoal = stats.twoPointShotsOnGoal;
  if (stats.twoPointShotsOnGoalPct != null)
    result.twoPointShotsOnGoalPct = stats.twoPointShotsOnGoalPct;
  if (stats.foRecord != null) result.foRecord = stats.foRecord;
  if (stats.numPenalties != null) result.numPenalties = stats.numPenalties;
  if (stats.pim != null) result.pim = stats.pim;
  if (stats.pimValue != null) result.pimValue = stats.pimValue;
  if (stats.powerPlayGoals != null)
    result.powerPlayGoals = stats.powerPlayGoals;
  if (stats.powerPlayShots != null)
    result.powerPlayShots = stats.powerPlayShots;
  if (stats.shortHandedGoals != null)
    result.shortHandedGoals = stats.shortHandedGoals;
  if (stats.shortHandedShots != null)
    result.shortHandedShots = stats.shortHandedShots;
  if (stats.tof != null) result.tof = stats.tof;
  if (stats.touches != null) result.touches = stats.touches;
  if (stats.totalPasses != null) result.totalPasses = stats.totalPasses;
  if (stats.unassistedGoals != null)
    result.unassistedGoals = stats.unassistedGoals;
  if (stats.assistedGoals != null) result.assistedGoals = stats.assistedGoals;
  if (stats.passRate != null) result.passRate = stats.passRate;
  if (stats.shotRate != null) result.shotRate = stats.shotRate;
  if (stats.goalRate != null) result.goalRate = stats.goalRate;
  if (stats.assistRate != null) result.assistRate = stats.assistRate;
  if (stats.turnoverRate != null) result.turnoverRate = stats.turnoverRate;

  return result;
};

/**
 * Transform PLLPlayerStats to GoalieStats JSONB
 */
export const transformPLLGoalieStats = (
  stats: PLLPlayerStats,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {
    gamesPlayed: stats.gamesPlayed,
    saves: stats.saves,
    savePct: stats.savePct,
    goalsAgainst: stats.goalsAgainst,
    goalsAgainstAvg: stats.GAA,
  };

  // Add optional fields only if defined
  if (stats.goalieWins != null) result.wins = stats.goalieWins;
  if (stats.goalieLosses != null) result.losses = stats.goalieLosses;
  if (stats.goalieTies != null) result.ties = stats.goalieTies;
  if (stats.twoPointGoalsAgainst != null)
    result.twoPointGoalsAgainst = stats.twoPointGoalsAgainst;
  if (stats.twoPtGaa != null) result.twoPtGaa = stats.twoPtGaa;
  if (stats.scoresAgainst != null) result.scoresAgainst = stats.scoresAgainst;
  if (stats.saa != null) result.saa = stats.saa;
  if (stats.powerPlayGoalsAgainst != null)
    result.powerPlayGoalsAgainst = stats.powerPlayGoalsAgainst;
  if (stats.shortHandedGoalsAgainst != null)
    result.shortHandedGoalsAgainst = stats.shortHandedGoalsAgainst;

  return result;
};

/**
 * Transform PLLTeamStats to TeamStats JSONB
 */
export const transformPLLTeamStats = (
  stats: PLLTeamStats,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {
    gamesPlayed: stats.gamesPlayed,
    scores: stats.scores,
    scoresAgainst: stats.scoresAgainst,
    goals: stats.goals,
    goalsAgainst: stats.goalsAgainst,
    twoPointGoals: stats.twoPointGoals,
    twoPointGoalsAgainst: stats.twoPointGoalsAgainst,
    assists: stats.assists,
    shots: stats.shots,
    shotsOnGoal: stats.shotsOnGoal,
    shotPct: stats.shotPct,
    shotsOnGoalPct: stats.shotsOnGoalPct,
    twoPointShots: stats.twoPointShots,
    twoPointShotPct: stats.twoPointShotPct,
    twoPointShotsOnGoal: stats.twoPointShotsOnGoal,
    twoPointShotsOnGoalPct: stats.twoPointShotsOnGoalPct,
    groundBalls: stats.groundBalls,
    turnovers: stats.turnovers,
    causedTurnovers: stats.causedTurnovers,
    faceoffsWon: stats.faceoffsWon,
    faceoffsLost: stats.faceoffsLost,
    faceoffs: stats.faceoffs,
    faceoffPct: stats.faceoffPct,
    saves: stats.saves,
    savePct: stats.savePct,
    numPenalties: stats.numPenalties,
    pim: stats.pim,
    offsides: stats.offsides,
    shotClockExpirations: stats.shotClockExpirations,
    powerPlayGoals: stats.powerPlayGoals,
    powerPlayShots: stats.powerPlayShots,
    powerPlayPct: stats.powerPlayPct,
    powerPlayGoalsAgainst: stats.powerPlayGoalsAgainst,
    powerPlayShotsAgainst: stats.powerPlayShotsAgainst,
    powerPlayGoalsAgainstPct: stats.powerPlayGoalsAgainstPct,
    shortHandedGoals: stats.shortHandedGoals,
    shortHandedShots: stats.shortHandedShots,
    shortHandedPct: stats.shortHandedPct,
    shortHandedShotsAgainst: stats.shortHandedShotsAgainst,
    shortHandedGoalsAgainst: stats.shortHandedGoalsAgainst,
    shortHandedGoalsAgainstPct: stats.shortHandedGoalsAgainstPct,
    manDownPct: stats.manDownPct,
    timesManUp: stats.timesManUp,
    timesShortHanded: stats.timesShortHanded,
    clears: stats.clears,
    clearAttempts: stats.clearAttempts,
    clearPct: stats.clearPct,
    rides: stats.rides,
    rideAttempts: stats.rideAttempts,
    ridesPct: stats.ridesPct,
  };

  // Add optional fields only if defined
  if (stats.onePointGoals != null) result.onePointGoals = stats.onePointGoals;
  if (stats.saa != null) result.saa = stats.saa;
  if (stats.scoresPG != null) result.scoresPG = stats.scoresPG;
  if (stats.shotsPG != null) result.shotsPG = stats.shotsPG;
  if (stats.touches != null) result.touches = stats.touches;
  if (stats.totalPasses != null) result.totalPasses = stats.totalPasses;

  return result;
};

// =============================================================================
// PLAYER SEASON TRANSFORMS
// =============================================================================

/**
 * Transform PLLPlayer to UpsertPlayerSeasonInput
 */
export const transformPLLPlayerSeason = (
  player: PLLPlayer,
  ctx: TransformContext,
): UpsertPlayerSeasonInput | null => {
  const playerId = ctx.playerIdMap.get(player.officialId);
  if (!playerId) return null;

  // Find team for this season
  const seasonTeam = player.allTeams.find((t) => t.year === ctx.seasonYear);
  const teamId = seasonTeam
    ? ctx.teamIdMap.get(seasonTeam.officialId)
    : undefined;
  const position = seasonTeam?.position ?? null;
  const isG = isGoalie(position);

  // Transform stats - returns Record<string, unknown> for JSONB
  const stats = player.stats ? transformPLLPlayerStats(player.stats) : null;
  const postStats = player.postStats
    ? transformPLLPlayerStats(player.postStats)
    : null;
  const goalieStats =
    isG && player.stats ? transformPLLGoalieStats(player.stats) : null;
  const postGoalieStats =
    isG && player.postStats ? transformPLLGoalieStats(player.postStats) : null;

  return {
    playerId,
    seasonId: ctx.seasonId,
    teamId: teamId ?? null,
    jerseyNumber: seasonTeam?.jerseyNum ?? player.jerseyNum ?? null,
    position,
    isCaptain: player.isCaptain ?? false,
    stats: isG ? null : stats,
    postSeasonStats: isG ? null : postStats,
    goalieStats: goalieStats,
    postSeasonGoalieStats: postGoalieStats,
    gamesPlayed: player.stats?.gamesPlayed ?? 0,
  };
};

// =============================================================================
// GAME TRANSFORMS
// =============================================================================

/**
 * Map PLL eventStatus to game status
 * PLL: 0 = scheduled, 1 = in progress, 2 = final
 */
const mapPLLGameStatus = (
  eventStatus: number | null,
  gameStatus: string | null,
): "scheduled" | "in_progress" | "final" | "postponed" | "cancelled" => {
  if (eventStatus === 2) return "final";
  if (eventStatus === 1) return "in_progress";
  if (gameStatus?.toLowerCase().includes("postpone")) return "postponed";
  if (gameStatus?.toLowerCase().includes("cancel")) return "cancelled";
  return "scheduled";
};

/**
 * Parse PLL event startTime to Date
 * Format: ISO timestamp string
 */
const parsePLLEventDate = (startTime: string | null): Date => {
  if (!startTime) return new Date();
  const date = new Date(startTime);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Transform PLLEvent to UpsertGameInput
 */
export const transformPLLGame = (
  event: PLLEvent,
  ctx: TransformContext,
): UpsertGameInput | null => {
  if (!event.homeTeam || !event.awayTeam) return null;

  const homeTeamId = ctx.teamIdMap.get(event.homeTeam.officialId);
  const awayTeamId = ctx.teamIdMap.get(event.awayTeam.officialId);

  if (!homeTeamId || !awayTeamId) return null;

  return {
    seasonId: ctx.seasonId,
    externalId: event.externalId ?? event.slugname ?? String(event.id),
    homeTeamId,
    awayTeamId,
    gameDate: parsePLLEventDate(event.startTime),
    week: event.week,
    gameNumber: event.gameNumber,
    venue: event.venue,
    venueCity: event.venueLocation ?? event.location,
    status: mapPLLGameStatus(event.eventStatus, event.gameStatus),
    homeScore: event.homeScore,
    awayScore: event.visitorScore,
    isOvertime: false, // Not directly available in event list
    overtimePeriods: 0,
    playByPlayUrl: null, // Will be set during play-by-play upload
    homeTeamStats: null, // Would need event detail
    awayTeamStats: null,
    broadcaster:
      event.broadcaster && event.broadcaster.length > 0
        ? event.broadcaster.join(", ")
        : null,
    streamUrl: event.urlStreaming,
  };
};

/**
 * Transform array of PLLEvents
 */
export const transformPLLGames = (
  events: PLLEvent[],
  ctx: TransformContext,
): UpsertGameInput[] =>
  events
    .map((event) => transformPLLGame(event, ctx))
    .filter((g): g is UpsertGameInput => g !== null);

// =============================================================================
// STANDINGS TRANSFORMS
// =============================================================================

/**
 * Transform PLLTeamStanding to UpsertStandingsInput
 */
export const transformPLLStanding = (
  standing: PLLTeamStanding,
  ctx: TransformContext,
  snapshotDate: Date,
): UpsertStandingsInput | null => {
  const teamId = ctx.teamIdMap.get(standing.teamId);
  if (!teamId) return null;

  // PLL doesn't have explicit position in standings, derive from seed or wins
  const position = standing.seed ?? 0;

  return {
    seasonId: ctx.seasonId,
    teamId,
    snapshotDate,
    position,
    wins: standing.wins,
    losses: standing.losses,
    ties: standing.ties,
    overtimeLosses: 0, // PLL doesn't track OT losses
    points: null, // PLL doesn't use points system
    winPercentage:
      standing.wins + standing.losses > 0
        ? Math.round(
            (standing.wins /
              (standing.wins + standing.losses + standing.ties)) *
              1000,
          )
        : 0,
    goalsFor: standing.scores,
    goalsAgainst: standing.scoresAgainst,
    goalDifferential: standing.scoreDiff,
    conference: standing.conference,
    division: null,
    clinchStatus: null,
    seed: standing.seed,
  };
};

/**
 * Transform array of PLLStandings
 */
export const transformPLLStandings = (
  standings: PLLTeamStanding[],
  ctx: TransformContext,
  snapshotDate: Date,
): UpsertStandingsInput[] =>
  standings
    .map((s) => transformPLLStanding(s, ctx, snapshotDate))
    .filter((s): s is UpsertStandingsInput => s !== null);
