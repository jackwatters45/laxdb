import { Rpc, RpcGroup } from "@effect/rpc";
import { StatsContract } from "@laxdb/core/pipeline/stats.contract";
import { StatsService } from "@laxdb/pipeline/rpc/stats.service";
import { Effect, Layer } from "effect";

export class StatsRpcs extends RpcGroup.make(
  Rpc.make("StatsGetPlayerStats", {
    success: StatsContract.getPlayerStats.success,
    error: StatsContract.getPlayerStats.error,
    payload: StatsContract.getPlayerStats.payload,
  }),
  Rpc.make("StatsGetLeaderboard", {
    success: StatsContract.getLeaderboard.success,
    error: StatsContract.getLeaderboard.error,
    payload: StatsContract.getLeaderboard.payload,
  }),
  Rpc.make("StatsGetTeamStats", {
    success: StatsContract.getTeamStats.success,
    error: StatsContract.getTeamStats.error,
    payload: StatsContract.getTeamStats.payload,
  }),
) {}

export const StatsHandlers = StatsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* StatsService;

    return {
      StatsGetPlayerStats: (payload) => service.getPlayerStats(payload),
      StatsGetLeaderboard: (payload) => service.getLeaderboard(payload),
      StatsGetTeamStats: (payload) => service.getTeamStats(payload),
    };
  }),
).pipe(Layer.provide(StatsService.Default));
