import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  GetLeaderboardInput,
  GetPlayerStatsInput,
  GetTeamStatsInput,
  LeaderboardResponse,
  PlayerStatWithDetails,
  TeamStatSummary,
} from "./stats.schema";

export const StatsErrors = Schema.Union(
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
);

export const StatsContract = {
  getPlayerStats: {
    success: Schema.Array(PlayerStatWithDetails),
    error: StatsErrors,
    payload: GetPlayerStatsInput,
  },
  getLeaderboard: {
    success: LeaderboardResponse,
    error: StatsErrors,
    payload: GetLeaderboardInput,
  },
  getTeamStats: {
    success: Schema.Array(TeamStatSummary),
    error: StatsErrors,
    payload: GetTeamStatsInput,
  },
} as const;
