import type { KVNamespace } from "@cloudflare/workers-types";
import { Config, Data, Effect, Layer, Redacted, ServiceMap } from "effect";

import {
  cloudflareKvDelete,
  cloudflareKvGet,
  cloudflareKvSet,
} from "../../../runtime/cloudflare-kv-runtime.js";

export class KVError extends Data.TaggedError("KVError")<{
  cause: unknown;
  msg: string;
}> {}

export interface CloudflareKvApiConfig {
  readonly accountId: string;
  readonly namespaceId: string;
  readonly apiToken: string;
}

const makeKvError = (operation: string, key: string, cause: unknown) =>
  new KVError({ msg: `Failed to ${operation} key: ${key}`, cause });

const makeBindingBackedService = (kv: KVNamespace) => ({
  get: Effect.fn("KV:get")(function* (key: string) {
    return yield* Effect.tryPromise({
      try: () => kv.get(key),
      catch: (cause) => makeKvError("get", key, cause),
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
      catch: (cause) => makeKvError("set", key, cause),
    }).pipe(Effect.asVoid);
  }),

  delete: Effect.fn("KV:delete")(function* (key: string) {
    return yield* Effect.tryPromise({
      try: () => kv.delete(key),
      catch: (cause) => makeKvError("delete", key, cause),
    }).pipe(Effect.asVoid);
  }),
});

const makeCloudflareApiBackedService = (config: CloudflareKvApiConfig) => ({
  get: Effect.fn("KV:get")(function* (key: string) {
    return yield* Effect.tryPromise({
      try: () =>
        cloudflareKvGet({
          accountId: config.accountId,
          namespaceId: config.namespaceId,
          apiToken: config.apiToken,
          key,
        }),
      catch: (cause) => makeKvError("get", key, cause),
    }).pipe(Effect.tapError(Effect.logError));
  }),

  set: Effect.fn("KV:set")(function* (
    key: string,
    value: string,
    ttlSeconds?: number,
  ) {
    return yield* Effect.tryPromise({
      try: () =>
        cloudflareKvSet({
          accountId: config.accountId,
          namespaceId: config.namespaceId,
          apiToken: config.apiToken,
          key,
          value,
          ...(ttlSeconds === undefined ? {} : { ttlSeconds }),
        }),
      catch: (cause) => makeKvError("set", key, cause),
    }).pipe(Effect.asVoid);
  }),

  delete: Effect.fn("KV:delete")(function* (key: string) {
    return yield* Effect.tryPromise({
      try: () =>
        cloudflareKvDelete({
          accountId: config.accountId,
          namespaceId: config.namespaceId,
          apiToken: config.apiToken,
          key,
        }),
      catch: (cause) => makeKvError("delete", key, cause),
    }).pipe(Effect.asVoid);
  }),
});

const cloudflareKvApiConfig = Effect.gen(function* () {
  const accountId = yield* Config.string("CLOUDFLARE_ACCOUNT_ID");
  const namespaceId = yield* Config.string("CLOUDFLARE_KV_NAMESPACE_ID");
  const apiToken = yield* Config.redacted("CLOUDFLARE_API_TOKEN");

  return {
    accountId,
    namespaceId,
    apiToken: Redacted.value(apiToken),
  } satisfies CloudflareKvApiConfig;
});

export class KVService extends ServiceMap.Service<KVService>()("KVService", {
  make: Effect.map(cloudflareKvApiConfig, makeCloudflareApiBackedService),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

export const KVServiceLive = KVService.layer;

export const KVServiceLiveFromBinding = (kvNamespace: KVNamespace) =>
  Layer.succeed(KVService, makeBindingBackedService(kvNamespace));

export const KVServiceLiveFromCloudflareApi = (config: CloudflareKvApiConfig) =>
  Layer.succeed(KVService, makeCloudflareApiBackedService(config));

export const KVServiceLiveFromCloudflareApiEnv = KVService.layer;
