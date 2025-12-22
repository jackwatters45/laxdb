import type { KVNamespace } from '@cloudflare/workers-types';
import { Context, Data, Effect, Layer } from 'effect';

export class KVError extends Data.TaggedError('KVError')<{
  cause: unknown;
  msg: string;
}> {}

export class KVNamespaceBinding extends Context.Tag('KVNamespaceBinding')<
  KVNamespaceBinding,
  KVNamespace
>() {}

export class KVService extends Effect.Service<KVService>()('KVService', {
  effect: Effect.gen(function* () {
    const kv = yield* KVNamespaceBinding;

    return {
      get: Effect.fn('KV:get')(function* (key: string) {
        return yield* Effect.tryPromise(() => kv.get(key)).pipe(
          Effect.tapError(Effect.logError),
          Effect.mapError(
            (cause) => new KVError({ msg: `Failed to get key: ${key}`, cause })
          )
        );
      }),

      set: Effect.fn('KV:set')(function* (
        key: string,
        value: string,
        ttlSeconds?: number
      ) {
        return yield* Effect.tryPromise(() =>
          kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : {})
        ).pipe(
          Effect.mapError(
            (cause) => new KVError({ msg: `Failed to set key: ${key}`, cause })
          ),
          Effect.asVoid
        );
      }),

      delete: Effect.fn('KV:delete')(function* (key: string) {
        return yield* Effect.tryPromise(() => kv.delete(key)).pipe(
          Effect.mapError(
            (cause) =>
              new KVError({
                msg: `Failed to delete key: ${key}`,
                cause,
              })
          ),
          Effect.asVoid
        );
      }),
    };
  }),
  dependencies: [],
}) {}

export const KVServiceLive = (kvNamespace: KVNamespace) =>
  KVService.Default.pipe(
    Layer.provide(Layer.succeed(KVNamespaceBinding, kvNamespace))
  );
