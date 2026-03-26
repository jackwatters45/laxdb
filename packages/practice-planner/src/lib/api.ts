/**
 * Effect RPC client for the api-v2 worker.
 *
 * Production: uses `API` service binding (Worker-to-Worker, no network hop).
 * Local dev: uses fetch to the api-v2 dev server (Alchemy runs it separately).
 *
 * Only call runApi() from inside createServerFn handlers.
 */
import { RpcApiClient } from "@laxdb/api-v2/client";
import { Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

const isLocal = process.env.IS_LOCAL === "true";

function getServiceBindingFetch(): typeof fetch | undefined {
  if (isLocal) return undefined;
  const { env } = require("cloudflare:workers") as { env: Env };
  return env.API?.fetch.bind(env.API);
}

const rpcUrl = (apiFetch: typeof fetch | undefined) =>
  apiFetch
    ? "http://api/rpc"
    : `http://localhost:${process.env.API_PORT ?? "1337"}/rpc`;

function buildRuntime() {
  const apiFetch = getServiceBindingFetch();

  const protocol = RpcClient.layerProtocolHttp({
    url: rpcUrl(apiFetch),
  }).pipe(
    Layer.provide([
      apiFetch
        ? FetchHttpClient.layer.pipe(
            Layer.provide(Layer.succeed(FetchHttpClient.Fetch, apiFetch)),
          )
        : FetchHttpClient.layer,
      RpcSerialization.layerNdjson,
    ]),
  );

  return ManagedRuntime.make(RpcApiClient.layer.pipe(Layer.provide(protocol)));
}

let _runtime: ReturnType<typeof buildRuntime> | undefined;

function getRuntime() {
  return (_runtime ??= buildRuntime());
}

/**
 * Run an Effect that depends on the RPC client.
 * Only call from inside createServerFn handlers.
 */
export function runApi<A, E>(
  effect: Effect.Effect<A, E, RpcApiClient>,
): Promise<A> {
  return getRuntime().runPromise(effect);
}
