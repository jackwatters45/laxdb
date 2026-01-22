import { NotFoundError } from "@laxdb/core/error";
import {
  type GetLeaderboardInput,
  type GetPlayerStatsInput,
  type GetTeamStatsInput,
  LeaderboardResponse,
} from "@laxdb/core/pipeline/stats.schema";
import { parsePostgresError } from "@laxdb/core/util";
import { Effect } from "effect";

import { StatsRepo } from "./stats.repo";

export class StatsService extends Effect.Service<StatsService>()(
  "StatsService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* StatsRepo;

      return {
        getPlayerStats: (input: GetPlayerStatsInput) =>
          Effect.gen(function* () {
            const stats = yield* repo.getPlayerStats(input);
            if (stats.length === 0) {
              return yield* Effect.fail(
                new NotFoundError({
                  domain: "PlayerStats",
                  id: input.playerId,
                  message: `No stats found for player ${input.playerId}`,
                }),
              );
            }
            return stats;
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap(() =>
              Effect.log(`Fetched stats for player ${input.playerId}`),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch player stats: ${error._tag}`),
            ),
          ),

        getLeaderboard: (input: GetLeaderboardInput) =>
          Effect.gen(function* () {
            const result = yield* repo.getLeaderboard(input);
            return new LeaderboardResponse(result);
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap((result) =>
              Effect.log(
                `Fetched leaderboard: ${result.data.length} entries, leagues=${input.leagues.join(",")}`,
              ),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch leaderboard: ${error._tag}`),
            ),
          ),

        getTeamStats: (input: GetTeamStatsInput) =>
          Effect.gen(function* () {
            const stats = yield* repo.getTeamStats(input);
            if (stats.length === 0) {
              return yield* Effect.fail(
                new NotFoundError({
                  domain: "TeamStats",
                  id: input.teamId,
                  message: `No stats found for team ${input.teamId}`,
                }),
              );
            }
            return stats;
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap(() =>
              Effect.log(`Fetched stats for team ${input.teamId}`),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch team stats: ${error._tag}`),
            ),
          ),
      } as const;
    }),
    dependencies: [StatsRepo.Default],
  },
) {}
