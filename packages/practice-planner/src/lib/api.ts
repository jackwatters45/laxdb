/**
 * Effect RPC client for the api-v2 worker.
 *
 * Production: uses `API` service binding (Worker-to-Worker, no network hop).
 * Local dev: uses fetch to the api-v2 dev server (Alchemy runs it separately).
 *
 * Only call runApi() from inside createServerFn handlers.
 */
import { RpcPracticeClient } from "@laxdb/api-v2/practice/practice.client";
import type { Effect} from "effect";
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

// ---------------------------------------------------------------------------
// Protocol layer — service binding in prod, direct fetch in local dev
// ---------------------------------------------------------------------------

const isLocal = process.env.IS_LOCAL === "true";

function getServiceBindingFetch(): typeof fetch | undefined {
  if (isLocal) return undefined;
  const { env } = require("cloudflare:workers") as { env: Env };
  return env.API?.fetch.bind(env.API);
}

let _runtime: ManagedRuntime.ManagedRuntime<RpcPracticeClient, never> | undefined;

function getRuntime() {
  if (_runtime) return _runtime;
  console.log("[api] building runtime...");

  const apiFetch = getServiceBindingFetch();

  const rpcUrl = apiFetch
    ? "http://api/rpc"
    : `http://localhost:${process.env.API_PORT ?? "1337"}/rpc`;

  const protocol = RpcClient.layerProtocolHttp({ url: rpcUrl }).pipe(
    Layer.provide([
      apiFetch
        ? FetchHttpClient.layer.pipe(
            Layer.provide(Layer.succeed(FetchHttpClient.Fetch, apiFetch)),
          )
        : FetchHttpClient.layer,
      RpcSerialization.layerNdjson,
    ]),
  );

  const ApiLive = RpcPracticeClient.layer.pipe(Layer.provide(protocol));

  _runtime = ManagedRuntime.make(ApiLive);
  console.log("[api] runtime created");
  return _runtime;
}

// ---------------------------------------------------------------------------
// Convenience runner
// ---------------------------------------------------------------------------

export function runApi<A, E>(
  effect: Effect.Effect<A, E, RpcPracticeClient>,
): Promise<A> {
  return getRuntime().runPromise(effect);
}
