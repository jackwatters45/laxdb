/**
 * NLL Transform Functions
 *
 * Transform NLL extracted data into pro_* schema format.
 */

import type { PlayerStats } from "@laxdb/core/pro-league";

import type {
  NLLTeam,
  NLLPlayer,
  NLLStanding,
  NLLMatch,
  NLLPlayerStatsRow,
} from "../nll/nll.schema";

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
 * Create season input from NLL season info
 */
export const transformNLLSeason = (
  leagueId: number,
  seasonId: string,
  year: number,
): UpsertSeasonInput => ({
  leagueId,
  externalId: seasonId,
  year,
  displayName: `${year}-${String(year + 1).slice(2)}`, // "2024-25"
  startDate: null,
  endDate: null,
  isCurrent: false, // Will be set based on extraction config
});

// =============================================================================
// TEAM TRANSFORMS
// =============================================================================

/**
 * Transform NLLTeam to UpsertTeamInput
 */
export const transformNLLTeam = (
  team: NLLTeam,
  leagueId: number,
): UpsertTeamInput => ({
  leagueId,
  externalId: team.id,
  code: team.code,
  name: team.displayName ?? team.name ?? team.code,
  shortName: team.nickname,
  city: team.team_city,
  logoUrl: team.team_logo,
  primaryColor: null,
  secondaryColor: null,
  websiteUrl: team.team_website_url,
  isActive: true,
  firstSeasonYear: null,
  lastSeasonYear: null,
});

/**
 * Transform array of NLLTeams
 */
export const transformNLLTeams = (
  teams: NLLTeam[],
  leagueId: number,
): UpsertTeamInput[] => teams.map((team) => transformNLLTeam(team, leagueId));

// =============================================================================
// PLAYER TRANSFORMS
// =============================================================================

/**
 * Parse NLL date of birth string to Date
 * Format: "YYYY-MM-DD" or similar
 */
const parseNLLDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Transform NLLPlayer to UpsertPlayerInput
 */
export const transformNLLPlayer = (
  player: NLLPlayer,
  leagueId: number,
): UpsertPlayerInput => ({
  leagueId,
  externalId: player.personId,
  firstName: player.firstname,
  lastName: player.surname ?? player.fullname ?? "Unknown",
  fullName: player.fullname,
  position: player.position,
  dateOfBirth: parseNLLDate(player.dateOfBirth),
  birthplace: null,
  country: null,
  height: player.height,
  weight: player.weight ? Number.parseInt(player.weight, 10) : null,
  handedness: null,
  college: null,
  highSchool: null,
  profileUrl: null,
  photoUrl: null,
});

/**
 * Transform array of NLLPlayers
 */
export const transformNLLPlayers = (
  players: NLLPlayer[],
  leagueId: number,
): UpsertPlayerInput[] =>
  players.map((player) => transformNLLPlayer(player, leagueId));

// =============================================================================
// PLAYER SEASON / STATS TRANSFORMS
// =============================================================================

/**
 * Check if player is a goalie based on position
 */
const isGoalie = (position: string | null): boolean =>
  position?.toUpperCase() === "G";

/**
 * Transform NLLPlayerStatsRow to PlayerStats JSONB
 */
export const transformNLLPlayerStats = (
  statsRow: NLLPlayerStatsRow,
): PlayerStats => ({
  gamesPlayed: statsRow.games_played,
  goals: statsRow.goals,
  assists: statsRow.assists,
  points: statsRow.points,
  penaltyMinutes: statsRow.penalty_minutes,
  powerPlayGoals: statsRow.ppg,
  powerPlayAssists: statsRow.ppa,
  shortHandedGoals: statsRow.shg,
  looseBalls: statsRow.looseballs,
  turnovers: statsRow.turnovers,
  causedTurnovers: statsRow.caused_turnovers,
  blockedShots: statsRow.blocked_shots,
  shotsOnGoal: statsRow.shots_on_goal,
});

/**
 * Transform NLLPlayer basic season stats (from roster response)
 */
export const transformNLLBasicStats = (player: NLLPlayer): PlayerStats => {
  const matches = player.matches;
  if (!matches) return { gamesPlayed: 0 };

  return {
    gamesPlayed: matches.games_played,
    goals: matches.goals,
    assists: matches.assists,
    points: matches.points,
    penaltyMinutes: matches.penalty_minutes,
  };
};

/**
 * Transform NLLPlayer to UpsertPlayerSeasonInput
 * Requires context with resolved player/team IDs
 */
export const transformNLLPlayerSeason = (
  player: NLLPlayer,
  ctx: TransformContext,
  statsRow?: NLLPlayerStatsRow,
): UpsertPlayerSeasonInput | null => {
  const playerId = ctx.playerIdMap.get(player.personId);
  if (!playerId) return null;

  const teamId = player.team_id ? ctx.teamIdMap.get(player.team_id) : null;
  const position = player.position;
  const isG = isGoalie(position);

  // Use detailed stats if available, otherwise basic stats
  const stats = statsRow
    ? transformNLLPlayerStats(statsRow)
    : transformNLLBasicStats(player);

  // Cast stats to Record type expected by schema
  // Safe because we control the stats structure
  const statsRecord = isG
    ? null
    : (stats as unknown as Record<string, unknown>);
  const goalieRecord = isG
    ? (stats as unknown as Record<string, unknown>)
    : null;

  return {
    playerId,
    seasonId: ctx.seasonId,
    teamId: teamId ?? null,
    jerseyNumber: player.jerseyNumber
      ? Number.parseInt(player.jerseyNumber, 10)
      : null,
    position,
    isCaptain: false,
    stats: statsRecord,
    postSeasonStats: null,
    goalieStats: goalieRecord,
    postSeasonGoalieStats: null,
    gamesPlayed: stats.gamesPlayed ?? 0,
  };
};

// =============================================================================
// GAME TRANSFORMS
// =============================================================================

/**
 * Map NLL status to our game status
 */
const mapNLLGameStatus = (
  status: string | null,
): "scheduled" | "in_progress" | "final" | "postponed" | "cancelled" => {
  if (!status) return "scheduled";
  const s = status.toLowerCase();
  if (s.includes("final") || s.includes("complete")) return "final";
  if (s.includes("live") || s.includes("progress")) return "in_progress";
  if (s.includes("postpone")) return "postponed";
  if (s.includes("cancel")) return "cancelled";
  return "scheduled";
};

/**
 * Parse NLL game date string to Date
 */
const parseNLLGameDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Transform NLLMatch to UpsertGameInput
 */
export const transformNLLGame = (
  match: NLLMatch,
  ctx: TransformContext,
): UpsertGameInput | null => {
  const homeTeamId = ctx.teamIdMap.get(match.squads.home.id);
  const awayTeamId = ctx.teamIdMap.get(match.squads.away.id);

  if (!homeTeamId || !awayTeamId) return null;

  return {
    seasonId: ctx.seasonId,
    externalId: match.id,
    homeTeamId,
    awayTeamId,
    gameDate: parseNLLGameDate(match.date),
    week: null,
    gameNumber: null,
    venue: match.venue.name,
    venueCity: match.venue.city,
    status: mapNLLGameStatus(match.status),
    homeScore: match.squads.home.score,
    awayScore: match.squads.away.score,
    isOvertime: false,
    overtimePeriods: 0,
    playByPlayUrl: null,
    homeTeamStats: null,
    awayTeamStats: null,
    broadcaster: null,
    streamUrl: null,
  };
};

/**
 * Transform array of NLLMatches
 */
export const transformNLLGames = (
  matches: NLLMatch[],
  ctx: TransformContext,
): UpsertGameInput[] =>
  matches
    .map((match) => transformNLLGame(match, ctx))
    .filter((g): g is UpsertGameInput => g !== null);

// =============================================================================
// STANDINGS TRANSFORMS
// =============================================================================

/**
 * Transform NLLStanding to UpsertStandingsInput
 */
export const transformNLLStanding = (
  standing: NLLStanding,
  ctx: TransformContext,
  snapshotDate: Date,
): UpsertStandingsInput | null => {
  const teamId = ctx.teamIdMap.get(standing.team_id);
  if (!teamId) return null;

  return {
    seasonId: ctx.seasonId,
    teamId,
    snapshotDate,
    position: standing.position,
    wins: standing.wins,
    losses: standing.losses,
    ties: 0,
    overtimeLosses: 0,
    points: null, // NLL doesn't use points system
    winPercentage: Math.round(standing.win_percentage * 1000), // Store as integer (750 = .750)
    goalsFor: standing.goals_for,
    goalsAgainst: standing.goals_against,
    goalDifferential: standing.goal_diff,
    conference: null,
    division: null,
    clinchStatus: null,
    seed: null,
  };
};

/**
 * Transform array of NLLStandings
 */
export const transformNLLStandings = (
  standings: NLLStanding[],
  ctx: TransformContext,
  snapshotDate: Date,
): UpsertStandingsInput[] =>
  standings
    .map((s) => transformNLLStanding(s, ctx, snapshotDate))
    .filter((s): s is UpsertStandingsInput => s !== null);
