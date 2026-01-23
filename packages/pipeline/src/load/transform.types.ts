/**
 * Transform Layer Types
 *
 * Common types and utilities for transforming extracted data
 * into the pro_* schema format.
 */

import type {
  UpsertTeamInput,
  UpsertPlayerInput,
  UpsertPlayerSeasonInput,
  UpsertGameInput,
  UpsertStandingsInput,
  UpsertSeasonInput,
  LeagueCode,
} from "@laxdb/core/pro-league";

// =============================================================================
// TRANSFORM CONTEXT
// =============================================================================

/**
 * Context required for transforms - provides league and season info
 * that needs to be resolved before transforming entities
 */
export interface TransformContext {
  leagueId: number;
  leagueCode: LeagueCode;
  seasonId: number;
  seasonYear: number;
  seasonExternalId: string;
  /** Map of team external ID -> internal team ID (resolved during team upsert) */
  teamIdMap: Map<string, number>;
  /** Map of player external ID -> internal player ID (resolved during player upsert) */
  playerIdMap: Map<string, number>;
}

/**
 * Create empty context for a league/season
 */
export const createTransformContext = (
  leagueId: number,
  leagueCode: LeagueCode,
  seasonId: number,
  seasonYear: number,
  seasonExternalId: string,
): TransformContext => ({
  leagueId,
  leagueCode,
  seasonId,
  seasonYear,
  seasonExternalId,
  teamIdMap: new Map(),
  playerIdMap: new Map(),
});

// =============================================================================
// TRANSFORM RESULTS
// =============================================================================

/**
 * Result of transforming a full season's data
 */
export interface TransformResult {
  season: UpsertSeasonInput;
  teams: UpsertTeamInput[];
  players: UpsertPlayerInput[];
  playerSeasons: UpsertPlayerSeasonInput[];
  games: UpsertGameInput[];
  standings: UpsertStandingsInput[];
}

// =============================================================================
// TYPE EXPORTS (re-export for convenience)
// =============================================================================

export type {
  UpsertTeamInput,
  UpsertPlayerInput,
  UpsertPlayerSeasonInput,
  UpsertGameInput,
  UpsertStandingsInput,
  UpsertSeasonInput,
  LeagueCode,
};
