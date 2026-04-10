import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { Auth } from "distilled-cloudflare";
import * as KV from "distilled-cloudflare/kv";

const cloudflareLayer = (apiToken) =>
  Layer.mergeAll(FetchHttpClient.layer, Auth.fromToken(apiToken));

export async function cloudflareKvGet(input) {
  const response = await Effect.runPromise(
    KV.workersKvNamespaceReadKeyValuePair({
      account_id: input.accountId,
      namespace_id: input.namespaceId,
      key_name: input.key,
    }).pipe(Effect.provide(cloudflareLayer(input.apiToken))),
  );

  if (response.result === null || response.result === undefined) {
    return null;
  }

  if (typeof response.result === "string") {
    return response.result;
  }

  return JSON.stringify(response.result);
}

export async function cloudflareKvSet(input) {
  const body = new FormData();
  body.append("value", input.value);

  await Effect.runPromise(
    KV.workersKvNamespaceWriteKeyValuePairWithMetadata({
      account_id: input.accountId,
      namespace_id: input.namespaceId,
      key_name: input.key,
      expiration_ttl: input.ttlSeconds,
      body,
    }).pipe(Effect.provide(cloudflareLayer(input.apiToken))),
  );
}

export async function cloudflareKvDelete(input) {
  await Effect.runPromise(
    KV.deleteKeyValuePair({
      account_id: input.accountId,
      namespace_id: input.namespaceId,
      key_name: input.key,
    }).pipe(Effect.provide(cloudflareLayer(input.apiToken))),
  );
}
