import { PlayerContract } from "@laxdb/core-v2/player/player.contract";
import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class PlayerRpcs extends RpcGroup.make(
  Rpc.make("PlayerList", {
    success: PlayerContract.list.success,
    error: PlayerContract.list.error,
    payload: PlayerContract.list.payload,
  }),
  Rpc.make("PlayerGet", {
    success: PlayerContract.get.success,
    error: PlayerContract.get.error,
    payload: PlayerContract.get.payload,
  }),
  Rpc.make("PlayerCreate", {
    success: PlayerContract.create.success,
    error: PlayerContract.create.error,
    payload: PlayerContract.create.payload,
  }),
  Rpc.make("PlayerUpdate", {
    success: PlayerContract.update.success,
    error: PlayerContract.update.error,
    payload: PlayerContract.update.payload,
  }),
  Rpc.make("PlayerDelete", {
    success: PlayerContract.delete.success,
    error: PlayerContract.delete.error,
    payload: PlayerContract.delete.payload,
  }),
) {}

export const PlayerHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return {
      PlayerList: () => service.list(),
      PlayerGet: (payload) => service.getByPublicId(payload),
      PlayerCreate: (payload) => service.create(payload),
      PlayerUpdate: (payload) => service.update(payload),
      PlayerDelete: (payload) => service.delete(payload),
    };
  }),
).pipe(Layer.provide(PlayerService.layer));
