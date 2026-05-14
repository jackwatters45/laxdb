/**
 * Effect HTTP API client for the api worker.
 *
 * Production: uses `API` service binding (Worker-to-Worker, no network hop).
 * Local dev: uses fetch to the api dev server (Alchemy runs it separately).
 *
 * Only call runApi() from inside createServerFn handlers.
 */
import { makeApiClientLayer, type ApiClient } from "@laxdb/api/client";
import { type Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

const isLocal = process.env.IS_LOCAL === "true";

/**
 * In production, the API service binding gives us a Worker-to-Worker fetch
 * that resolves the virtual `http://api` URL with zero network hops.
 * In local dev, we fall back to the global fetch hitting localhost.
 */
type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

type ApiServiceBinding = {
  readonly fetch: typeof fetch;
};

type CloudflareWorkersModule = {
  env: { readonly API?: ApiServiceBinding };
};

const hasWorkerEnv = (value: unknown): value is CloudflareWorkersModule =>
  typeof value === "object" && value !== null && "env" in value;

function getApiFetch(): { fetch?: typeof fetch; url: string } {
  if (isLocal) {
    return { url: `http://localhost:${process.env.API_PORT ?? "1337"}` };
  }

  // oxlint-disable-next-line @typescript-eslint/no-require-imports -- Cloudflare exposes workers bindings via require in this environment
  const workersModule: unknown = require("cloudflare:workers");
  if (!hasWorkerEnv(workersModule)) {
    return { url: "http://api" };
  }

  const apiFetch: typeof fetch = Object.assign(
    (input: FetchInput, init?: FetchInit) =>
      workersModule.env.API?.fetch(input, init) ?? fetch(input, init),
    { preconnect: fetch.preconnect },
  );

  return { fetch: apiFetch, url: "http://api" };
}

function buildRuntime() {
  const api = getApiFetch();

  const http = api.fetch
    ? FetchHttpClient.layer.pipe(
        Layer.provide(Layer.succeed(FetchHttpClient.Fetch, api.fetch)),
      )
    : FetchHttpClient.layer;

  return ManagedRuntime.make(
    makeApiClientLayer(api.url).pipe(Layer.provide(http)),
  );
}

let _runtime: ReturnType<typeof buildRuntime> | undefined;

/**
 * Run an Effect that depends on the generated HTTP API client.
 * Only call from inside createServerFn handlers.
 *
 * Results are structured-cloned to convert Effect Schema.Class instances into
 * plain objects — seroval (TanStack Start's dehydration serializer) rejects
 * class instances.
 */
export async function runApi<A, E>(
  effect: Effect.Effect<A, E, ApiClient>,
): Promise<A> {
  const result = await (_runtime ??= buildRuntime()).runPromise(effect);
  return structuredClone(result);
}
