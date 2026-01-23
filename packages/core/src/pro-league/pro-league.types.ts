/**
 * JSONB type definitions for pro-league stats
 *
 * These types are used with Drizzle's $type<T>() to provide type safety
 * for JSONB columns. The stats structures vary by league, so we use a
 * flexible structure with optional fields.
 */

// =============================================================================
// PLAYER STATS (Field players - A, M, D, SSDM, LSM, FO)
// =============================================================================

/**
 * Field player stats - covers offense, defense, and specialist positions
 * All fields optional to handle league variations
 */
export interface PlayerStats {
  // Games
  gamesPlayed?: number;
  gamesStarted?: number;

  // Offense
  goals?: number;
  onePointGoals?: number;
  twoPointGoals?: number; // PLL-specific
  assists?: number;
  points?: number;
  scoringPoints?: number;

  // Shooting
  shots?: number;
  shotsOnGoal?: number;
  shotPct?: number;
  shotsOnGoalPct?: number;
  twoPointShots?: number;
  twoPointShotPct?: number;
  twoPointShotsOnGoal?: number;
  twoPointShotsOnGoalPct?: number;

  // Possession
  groundBalls?: number;
  looseBalls?: number;
  turnovers?: number;
  causedTurnovers?: number;

  // Faceoffs (FO specialists)
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffs?: number;
  faceoffPct?: number;
  foRecord?: string; // "150-75" format

  // Defense
  blockedShots?: number;

  // Penalties
  penaltyMinutes?: number;
  numPenalties?: number;
  pim?: number;
  pimValue?: number;

  // Power play / Short-handed
  powerPlayGoals?: number;
  powerPlayAssists?: number;
  powerPlayShots?: number;
  shortHandedGoals?: number;
  shortHandedShots?: number;

  // Plus/Minus
  plusMinus?: number;

  // Time on field (seconds)
  tof?: number;
  timeOnField?: number;

  // Advanced (PLL-specific)
  touches?: number;
  totalPasses?: number;
  unassistedGoals?: number;
  assistedGoals?: number;
  passRate?: number;
  shotRate?: number;
  goalRate?: number;
  assistRate?: number;
  turnoverRate?: number;

  // Shot breakdown (PLL advanced)
  lhShots?: number; // Left-hand shots
  lhGoals?: number;
  lhShotPct?: number;
  rhShots?: number; // Right-hand shots
  rhGoals?: number;
  rhShotPct?: number;

  // Goal types (PLL advanced)
  settledGoals?: number;
  fastbreakGoals?: number;
  substitutionGoals?: number;
  doorstepGoals?: number;

  // Assist types (PLL advanced)
  assistOpportunities?: number;
  settledAssists?: number;
  fastbreakAssists?: number;
  dodgeAssists?: number;
  pnrAssists?: number; // Pick and roll

  // Injury (if tracked)
  injuryStatus?: string;
  injuryDescription?: string;
}

// =============================================================================
// GOALIE STATS
// =============================================================================

/**
 * Goalie-specific statistics
 * All fields optional to handle league variations
 */
export interface GoalieStats {
  // Games
  gamesPlayed?: number;
  gamesStarted?: number;
  minutes?: number;

  // Record
  wins?: number;
  losses?: number;
  ties?: number;

  // Saves
  saves?: number;
  savePct?: number;

  // Goals against
  goalsAgainst?: number;
  goalsAgainstAvg?: number; // GAA
  twoPointGoalsAgainst?: number;
  twoPtGaa?: number;
  scoresAgainst?: number; // Total points allowed (PLL)
  saa?: number; // Scores against average

  // Power play / Short-handed
  powerPlayGoalsAgainst?: number;
  shortHandedGoalsAgainst?: number;
  powerPlayShotsAgainst?: number;
  shortHandedShotsAgainst?: number;

  // Clearing
  clears?: number;
  clearAttempts?: number;
  clearPct?: number;

  // Advanced
  shotsFaced?: number;
  highSaves?: number;
  lowSaves?: number;
  stickSaves?: number;

  // Time
  timeOnField?: number;
}

// =============================================================================
// TEAM STATS
// =============================================================================

/**
 * Team-level statistics (typically for a game or season aggregate)
 * All fields optional to handle league variations
 */
export interface TeamStats {
  // Games
  gamesPlayed?: number;

  // Scoring
  scores?: number; // Total points (PLL: 1pt + 2pt)
  scoresAgainst?: number;
  goals?: number;
  goalsAgainst?: number;
  onePointGoals?: number;
  twoPointGoals?: number;
  twoPointGoalsAgainst?: number;
  assists?: number;

  // Shooting
  shots?: number;
  shotsOnGoal?: number;
  shotPct?: number;
  shotsOnGoalPct?: number;
  twoPointShots?: number;
  twoPointShotPct?: number;
  twoPointShotsOnGoal?: number;
  twoPointShotsOnGoalPct?: number;

  // Possession
  groundBalls?: number;
  turnovers?: number;
  causedTurnovers?: number;

  // Faceoffs
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffs?: number;
  faceoffPct?: number;

  // Goaltending
  saves?: number;
  savePct?: number;
  saa?: number;

  // Penalties
  numPenalties?: number;
  pim?: number;
  penaltyMinutes?: number;
  offsides?: number;
  shotClockExpirations?: number;

  // Special teams
  powerPlayGoals?: number;
  powerPlayShots?: number;
  powerPlayPct?: number;
  powerPlayGoalsAgainst?: number;
  powerPlayShotsAgainst?: number;
  powerPlayGoalsAgainstPct?: number;
  shortHandedGoals?: number;
  shortHandedShots?: number;
  shortHandedPct?: number;
  shortHandedShotsAgainst?: number;
  shortHandedGoalsAgainst?: number;
  shortHandedGoalsAgainstPct?: number;
  manDownPct?: number;
  timesManUp?: number;
  timesShortHanded?: number;

  // Clearing/Rides
  clears?: number;
  clearAttempts?: number;
  clearPct?: number;
  rides?: number;
  rideAttempts?: number;
  ridesPct?: number;

  // Per game averages
  scoresPG?: number;
  shotsPG?: number;

  // Advanced
  touches?: number;
  totalPasses?: number;
}

// =============================================================================
// PLAY-BY-PLAY TYPES (for R2 storage)
// =============================================================================

/**
 * Single play/action in a game
 */
export interface PlayByPlayAction {
  id: number | string;
  period: number;
  minutes: number;
  seconds: number;
  teamId?: string;
  playerId?: string;
  playerName?: string;
  actionType: string; // 'goal', 'save', 'faceoff', 'penalty', etc.
  description?: string;
  // Additional context
  assistPlayerId?: string;
  assistPlayerName?: string;
  isGoal?: boolean;
  isTwoPoint?: boolean;
  isPowerPlay?: boolean;
  isShortHanded?: boolean;
}

/**
 * Full play-by-play for a game (stored in R2)
 */
export interface GamePlayByPlay {
  gameId: string;
  seasonId: string;
  leagueCode: string;
  homeTeamId: string;
  awayTeamId: string;
  actions: PlayByPlayAction[];
  extractedAt: string; // ISO timestamp
  source: string;
}

// =============================================================================
// LEAGUE-SPECIFIC TYPE GUARDS
// =============================================================================

/**
 * Check if stats have PLL-specific fields
 */
export const isPLLStats = (stats: PlayerStats): boolean =>
  stats.twoPointGoals !== undefined || stats.touches !== undefined;

/**
 * Check if stats have NLL-specific fields
 */
export const isNLLStats = (stats: PlayerStats): boolean =>
  stats.looseBalls !== undefined && stats.twoPointGoals === undefined;

/**
 * Check if goalie stats are present
 */
export const hasGoalieStats = (
  stats: GoalieStats | null | undefined,
): stats is GoalieStats =>
  stats !== null && stats !== undefined && stats.saves !== undefined;
