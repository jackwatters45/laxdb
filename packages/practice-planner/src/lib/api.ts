/**
 * Effect RPC client for the api worker.
 *
 * Production: uses `API` service binding (Worker-to-Worker, no network hop).
 * Local dev: uses fetch to the api dev server (Alchemy runs it separately).
 *
 * Only call runApi() from inside createServerFn handlers.
 */
import { RpcApiClient } from "@laxdb/api/client";
import { type Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

const isLocal = process.env.IS_LOCAL === "true";

/**
 * In production, the API service binding gives us a Worker-to-Worker fetch
 * that resolves the virtual `http://api/rpc` URL with zero network hops.
 * In local dev, we fall back to the global fetch hitting localhost.
 */
type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

type CloudflareWorkersModule = {
  env: Env;
};

const isCloudflareWorkersModule = (
  value: unknown,
): value is CloudflareWorkersModule =>
  typeof value === "object" && value !== null && "env" in value;

function getApiFetch(): { fetch?: typeof fetch; url: string } {
  if (isLocal) {
    return { url: `http://localhost:${process.env.API_PORT ?? "1337"}/rpc` };
  }
  const cloudflareWorkers: unknown = require("cloudflare:workers");
  if (!isCloudflareWorkersModule(cloudflareWorkers)) {
    throw new Error("cloudflare:workers env binding is unavailable");
  }
  const apiFetch: typeof fetch = (input: FetchInput, init?: FetchInit) =>
    cloudflareWorkers.env.API.fetch(input, init);
  return { fetch: apiFetch, url: "http://api/rpc" };
}

function buildRuntime() {
  const api = getApiFetch();

  const http = api.fetch
    ? FetchHttpClient.layer.pipe(
        Layer.provide(Layer.succeed(FetchHttpClient.Fetch, api.fetch)),
      )
    : FetchHttpClient.layer;

  const protocol = RpcClient.layerProtocolHttp({ url: api.url }).pipe(
    Layer.provide([http, RpcSerialization.layerNdjson]),
  );

  return ManagedRuntime.make(RpcApiClient.layer.pipe(Layer.provide(protocol)));
}

let _runtime: ReturnType<typeof buildRuntime> | undefined;

/**
 * Run an Effect that depends on the RPC client.
 * Only call from inside createServerFn handlers.
 *
 * Results are round-tripped through JSON to convert Effect Schema.Class
 * instances into plain objects — seroval (TanStack Start's dehydration
 * serializer) rejects class instances.
 */
export async function runApi<A, E>(
  effect: Effect.Effect<A, E, RpcApiClient>,
): Promise<A> {
  const result = await (_runtime ??= buildRuntime()).runPromise(effect);
  // JSON round-trip strips Effect Schema.Class metadata; the shape is
  // guaranteed by Effect's schema encoder so the cast is safe.
  return JSON.parse(JSON.stringify(result)) as A;
}
