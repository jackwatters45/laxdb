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
const hasWorkerEnv = (value: unknown): value is { env: Env } =>
  typeof value === "object" && value !== null && "env" in value;

function getApiFetch(): { fetch?: typeof fetch; url: string } {
  if (isLocal) {
    return { url: `http://localhost:${process.env.API_PORT ?? "1337"}/rpc` };
  }

  // oxlint-disable-next-line @typescript-eslint/no-require-imports -- Cloudflare exposes workers bindings via require in this environment
  const workersModule: unknown = require("cloudflare:workers");
  if (!hasWorkerEnv(workersModule)) {
    return { url: "http://api/rpc" };
  }

  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- Env typing guarantees the binding shape once the module guard passes
  const apiBinding = workersModule.env.API;
  if (!apiBinding) {
    return { url: "http://api/rpc" };
  }

  return {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Worker service bindings expose a fetch method at runtime
    fetch: apiBinding.fetch.bind(apiBinding),
    url: "http://api/rpc",
  };
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
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- serialization preserves the result shape while removing class metadata
  return JSON.parse(JSON.stringify(result)) as A;
}
