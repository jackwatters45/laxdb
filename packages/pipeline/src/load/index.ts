/**
 * Load Module - Transform & Load extracted data to database
 *
 * Usage:
 *   import { transformNLLTeams, transformPLLPlayers } from "@laxdb/pipeline/load";
 */

// Transform types and utilities
export {
  createTransformContext,
  type TransformContext,
  type TransformResult,
  type UpsertTeamInput,
  type UpsertPlayerInput,
  type UpsertPlayerSeasonInput,
  type UpsertGameInput,
  type UpsertStandingsInput,
  type UpsertSeasonInput,
  type LeagueCode,
} from "./transform.types";

// NLL transforms
export {
  transformNLLSeason,
  transformNLLTeam,
  transformNLLTeams,
  transformNLLPlayer,
  transformNLLPlayers,
  transformNLLPlayerStats,
  transformNLLBasicStats,
  transformNLLPlayerSeason,
  transformNLLGame,
  transformNLLGames,
  transformNLLStanding,
  transformNLLStandings,
} from "./nll.transform";

// PLL transforms
export {
  transformPLLSeason,
  transformPLLTeam,
  transformPLLTeams,
  transformPLLPlayer,
  transformPLLPlayers,
  transformPLLPlayerStats,
  transformPLLGoalieStats,
  transformPLLTeamStats,
  transformPLLPlayerSeason,
  transformPLLGame,
  transformPLLGames,
  transformPLLStanding,
  transformPLLStandings,
} from "./pll.transform";

// Load service
export { LoadService, makeLoadService, LoadError } from "./load.service";
export type { LoadResult } from "./load.service";
