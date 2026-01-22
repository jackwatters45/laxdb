import { Rpc, RpcGroup } from "@effect/rpc";
import { PlayersContract } from "@laxdb/core/pipeline/players.contract";
import { PlayersService } from "@laxdb/pipeline/rpc/players.service";
import { Effect, Layer } from "effect";

export class PlayersRpcs extends RpcGroup.make(
  Rpc.make("PlayersGetPlayer", {
    success: PlayersContract.getPlayer.success,
    error: PlayersContract.getPlayer.error,
    payload: PlayersContract.getPlayer.payload,
  }),
  Rpc.make("PlayersSearchPlayers", {
    success: PlayersContract.searchPlayers.success,
    error: PlayersContract.searchPlayers.error,
    payload: PlayersContract.searchPlayers.payload,
  }),
) {}

export const PlayersHandlers = PlayersRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayersService;

    return {
      PlayersGetPlayer: (payload) => service.getPlayer(payload),
      PlayersSearchPlayers: (payload) => service.searchPlayers(payload),
    };
  }),
).pipe(Layer.provide(PlayersService.Default));
