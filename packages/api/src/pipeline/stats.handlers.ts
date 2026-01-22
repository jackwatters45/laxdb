import { HttpApiBuilder } from "@effect/platform";
import { StatsService } from "@laxdb/pipeline/rpc/stats.service";
import { Effect, Layer } from "effect";

import { LaxdbApi } from "../definition";

// Stats HTTP API handlers
export const StatsHandlersLive = HttpApiBuilder.group(
  LaxdbApi,
  "Stats",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* StatsService;

      return handlers
        .handle("getLeaderboard", ({ payload }) => service.getLeaderboard(payload))
        .handle("getPlayerStats", ({ payload }) => service.getPlayerStats(payload))
        .handle("getTeamStats", ({ payload }) => service.getTeamStats(payload));
    }),
).pipe(Layer.provide(StatsService.Default));
