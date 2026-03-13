import { PlayerContract } from "@laxdb/core-v2/player/player.contract";
import { Player } from "@laxdb/core-v2/player/player.schema";
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

const asPlayer = (row: typeof Player.Type) => new Player(row);

export const PlayerHandlers = PlayerRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlayerService;

    return {
      PlayerList: () =>
        service.list().pipe(Effect.map((rows) => rows.map(asPlayer))),
      PlayerGet: (payload) =>
        service.getByPublicId(payload).pipe(Effect.map(asPlayer)),
      PlayerCreate: (payload) =>
        service.create(payload).pipe(Effect.map(asPlayer)),
      PlayerUpdate: (payload) =>
        service.update(payload).pipe(Effect.map(asPlayer)),
      PlayerDelete: (payload) =>
        service.delete(payload).pipe(Effect.map(asPlayer)),
    };
  }),
).pipe(Layer.provide(PlayerService.layer));
