import { Rpc, RpcGroup } from '@effect/rpc';
import { GameContract } from '@laxdb/core/game/game.contract';
import { GameService } from '@laxdb/core/game/game.service';
import { Effect, Layer } from 'effect';

export class GameRpcs extends RpcGroup.make(
  Rpc.make('GameList', {
    success: GameContract.list.success,
    error: GameContract.list.error,
    payload: GameContract.list.payload,
  }),
  Rpc.make('GameGet', {
    success: GameContract.get.success,
    error: GameContract.get.error,
    payload: GameContract.get.payload,
  }),
  Rpc.make('GameCreate', {
    success: GameContract.create.success,
    error: GameContract.create.error,
    payload: GameContract.create.payload,
  }),
  Rpc.make('GameUpdate', {
    success: GameContract.update.success,
    error: GameContract.update.error,
    payload: GameContract.update.payload,
  }),
  Rpc.make('GameDelete', {
    success: GameContract.delete.success,
    error: GameContract.delete.error,
    payload: GameContract.delete.payload,
  })
) {}

export const GameHandlers = GameRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* GameService;

    return {
      GameList: (payload) => service.list(payload),
      GameGet: (payload) => service.get(payload),
      GameCreate: (payload) => service.create(payload),
      GameUpdate: (payload) => service.update(payload),
      GameDelete: (payload) => service.delete(payload),
    };
  })
).pipe(Layer.provide(GameService.Default));
