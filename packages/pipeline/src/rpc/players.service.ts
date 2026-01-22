import { NotFoundError } from "@laxdb/core/error";
import type {
  GetPlayerInput,
  SearchPlayersInput,
} from "@laxdb/core/pipeline/players.schema";
import { parsePostgresError } from "@laxdb/core/util";
import { Effect } from "effect";

import { PlayersRepo } from "./players.repo";

export class PlayersService extends Effect.Service<PlayersService>()(
  "PlayersService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* PlayersRepo;

      return {
        getPlayer: (input: GetPlayerInput) =>
          Effect.gen(function* () {
            const player = yield* repo.getPlayer(input);
            if (player === null) {
              return yield* Effect.fail(
                new NotFoundError({
                  domain: "Player",
                  id: input.playerId,
                  message: `Player not found: ${input.playerId}`,
                }),
              );
            }
            return player;
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap((player) =>
              Effect.log(`Fetched player: ${player.displayName}`),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to fetch player: ${error._tag}`),
            ),
          ),

        searchPlayers: (input: SearchPlayersInput) =>
          Effect.gen(function* () {
            return yield* repo.searchPlayers(input);
          }).pipe(
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parsePostgresError(error)),
            ),
            Effect.tap((results) =>
              Effect.log(
                `Search returned ${results.length} players for query: "${input.query}"`,
              ),
            ),
            Effect.tapError((error) =>
              Effect.logError(`Failed to search players: ${error._tag}`),
            ),
          ),
      } as const;
    }),
    dependencies: [PlayersRepo.Default],
  },
) {}
