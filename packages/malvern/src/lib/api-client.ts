/**
 * Effect HTTP API client for the api worker.
 *
 * Server functions call the api worker with the generated Effect client.
 * Local dev uses the stable api dev port; deployed workers use the API service
 * binding. The apiAuth middleware captures the incoming request cookie and
 * runApi attaches it to the outgoing API request.
 */
import { makeApiClientLayer, type ApiClient } from "@laxdb/api/client";
import { createMiddleware } from "@tanstack/react-start";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

type ApiServiceBinding = { readonly fetch: typeof fetch };

type CloudflareWorkersModule = {
  readonly env: { readonly API: ApiServiceBinding };
};

const isLocal = process.env.IS_LOCAL === "true";
const localApiUrl = `http://localhost:${process.env.API_PORT ?? "1437"}`;
const apiUrl = isLocal ? localApiUrl : "http://api";

const loadApiBinding = Effect.promise(async () => {
  const workerModule = "cloudflare:" + "workers";
  const workers: CloudflareWorkersModule = await import(
    /* @vite-ignore */ workerModule
  );
  return workers.env.API;
});

const attachCookie = (request: Request, cookie: string | undefined) => {
  if (cookie !== undefined) request.headers.set("cookie", cookie);
  return request;
};

const toLocalApiRequest = (request: Request) => {
  const source = new URL(request.url);
  const target = new URL(`${source.pathname}${source.search}`, localApiUrl);
  return new Request(target, request);
};

const boundApiFetch =
  (cookie: string | undefined): typeof fetch =>
  async (input, init) => {
    const request = attachCookie(new Request(input, init), cookie);
    if (isLocal) return fetch(toLocalApiRequest(request));

    const api = await Effect.runPromise(loadApiBinding);
    return api.fetch(request);
  };

export const apiAuth = createMiddleware().server(async ({ request, next }) =>
  next({ context: { apiCookie: request.headers.get("cookie") ?? undefined } }),
);

const clientLayer = (cookie: string | undefined) =>
  makeApiClientLayer(apiUrl).pipe(
    Layer.provide(
      FetchHttpClient.layer.pipe(
        Layer.provide(
          Layer.succeed(FetchHttpClient.Fetch, boundApiFetch(cookie)),
        ),
      ),
    ),
  );

export async function runApi<A, E>(
  cookie: string | undefined,
  effect: Effect.Effect<A, E, ApiClient>,
): Promise<A> {
  const result = await Effect.runPromise(
    effect.pipe(
      Effect.provide(clientLayer(cookie)),
      Effect.tapError((error) =>
        Effect.sync(() => {
          console.log("[runApi] failed", error);
        }),
      ),
    ),
  );
  return structuredClone(result);
}
