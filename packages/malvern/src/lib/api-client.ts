/**
 * Effect HTTP API client for the api worker.
 *
 * The malvern app runs as a Cloudflare Worker (dev and prod), so it reaches
 * the api worker through the `API` service binding — no network hop, no port.
 *
 * Service-binding fetches don't carry the browser's cookies, so the api can't
 * see the session. The `apiAuth` middleware captures the incoming request's
 * cookie at the server-fn boundary and passes it explicitly to `runApi`, which
 * attaches it to the binding request. No ambient request lookup happens inside
 * the Effect runtime (which runs on its own fibers, outside the request's
 * AsyncLocalStorage scope), so auth can't be silently dropped.
 */
import { makeApiClientLayer, type ApiClient } from "@laxdb/api/client";
import { createMiddleware } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

type ApiServiceBinding = { readonly fetch: typeof fetch };

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isApiEnv = (
  value: unknown,
): value is { readonly API: ApiServiceBinding } =>
  isRecord(value) && isRecord(value.API) && "fetch" in value.API;

/**
 * Server-fn middleware that lifts the incoming request's cookie onto
 * `context.apiCookie`. Runs at the server-fn boundary where the request is
 * in scope, so the value is captured synchronously and threaded explicitly.
 */
export const apiAuth = createMiddleware().server(async ({ request, next }) =>
  next({ context: { apiCookie: request.headers.get("cookie") ?? undefined } }),
);

const apiFetch =
  (cookie: string | undefined): typeof fetch =>
  (input, init) => {
    if (!isApiEnv(env)) {
      throw new Error("Malvern worker API binding is invalid");
    }
    const request = new Request(input, init);
    if (cookie !== undefined) request.headers.set("cookie", cookie);
    return env.API.fetch(request);
  };

const clientLayer = (cookie: string | undefined) =>
  makeApiClientLayer("http://api").pipe(
    Layer.provide(
      FetchHttpClient.layer.pipe(
        Layer.provide(Layer.succeed(FetchHttpClient.Fetch, apiFetch(cookie))),
      ),
    ),
  );

/**
 * Run an Effect that depends on the generated HTTP API client, forwarding the
 * caller's session cookie. Call from a server fn that uses `apiAuth`, passing
 * `context.apiCookie`.
 *
 * Results are structured-cloned to convert Effect Schema.Class instances into
 * plain objects — seroval (TanStack Start's dehydration serializer) rejects
 * class instances.
 */
export async function runApi<A, E>(
  cookie: string | undefined,
  effect: Effect.Effect<A, E, ApiClient>,
): Promise<A> {
  const result = await Effect.runPromise(
    effect.pipe(Effect.provide(clientLayer(cookie))),
  );
  return structuredClone(result);
}
