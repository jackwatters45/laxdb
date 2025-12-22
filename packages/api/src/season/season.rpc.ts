import { Rpc, RpcGroup } from '@effect/rpc';
import { SeasonContract } from '@laxdb/core/season/season.contract';
import { SeasonService } from '@laxdb/core/season/season.service';
import { Effect, Layer } from 'effect';

export class SeasonRpcs extends RpcGroup.make(
  Rpc.make('SeasonList', {
    success: SeasonContract.list.success,
    error: SeasonContract.list.error,
    payload: SeasonContract.list.payload,
  }),
  Rpc.make('SeasonGet', {
    success: SeasonContract.get.success,
    error: SeasonContract.get.error,
    payload: SeasonContract.get.payload,
  }),
  Rpc.make('SeasonCreate', {
    success: SeasonContract.create.success,
    error: SeasonContract.create.error,
    payload: SeasonContract.create.payload,
  }),
  Rpc.make('SeasonUpdate', {
    success: SeasonContract.update.success,
    error: SeasonContract.update.error,
    payload: SeasonContract.update.payload,
  }),
  Rpc.make('SeasonDelete', {
    success: SeasonContract.delete.success,
    error: SeasonContract.delete.error,
    payload: SeasonContract.delete.payload,
  })
) {}

export const SeasonHandlers = SeasonRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* SeasonService;

    return {
      SeasonList: (payload) => service.list(payload),
      SeasonGet: (payload) => service.get(payload),
      SeasonCreate: (payload) => service.create(payload),
      SeasonUpdate: (payload) => service.update(payload),
      SeasonDelete: (payload) => service.delete(payload),
    };
  })
).pipe(Layer.provide(SeasonService.Default));
