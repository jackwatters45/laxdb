import type { KVNamespace } from "@cloudflare/workers-types";
import { Data, Effect, Layer, ServiceMap } from "effect";

export class KVError extends Data.TaggedError("KVError")<{
  cause: unknown;
  msg: string;
}> {}

export class KVNamespaceBinding extends ServiceMap.Service<
  KVNamespaceBinding,
  KVNamespace
>()("KVNamespaceBinding") {}

export class KVService extends ServiceMap.Service<KVService>()("KVService", {
  make: Effect.gen(function* () {
    const kv = yield* KVNamespaceBinding;

    return {
      get: Effect.fn("KV:get")(function* (key: string) {
        return yield* Effect.tryPromise({
          try: () => kv.get(key),
          catch: (cause) =>
            new KVError({ msg: `Failed to get key: ${key}`, cause }),
        }).pipe(Effect.tapError(Effect.logError));
      }),

      set: Effect.fn("KV:set")(function* (
        key: string,
        value: string,
        ttlSeconds?: number,
      ) {
        return yield* Effect.tryPromise({
          try: () =>
            kv.put(key, value, ttlSeconds ? { expirationTtl: ttlSeconds } : {}),
          catch: (cause) =>
            new KVError({ msg: `Failed to set key: ${key}`, cause }),
        }).pipe(Effect.asVoid);
      }),

      delete: Effect.fn("KV:delete")(function* (key: string) {
        return yield* Effect.tryPromise({
          try: () => kv.delete(key),
          catch: (cause) =>
            new KVError({ msg: `Failed to delete key: ${key}`, cause }),
        }).pipe(Effect.asVoid);
      }),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

export const KVServiceLive = (kvNamespace: KVNamespace) =>
  KVService.layer.pipe(
    Layer.provide(Layer.succeed(KVNamespaceBinding, kvNamespace)),
  );
