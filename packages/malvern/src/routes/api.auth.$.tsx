import { createFileRoute } from "@tanstack/react-router";

const isLocal = process.env.IS_LOCAL === "true";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isApiEnv = (value: unknown): value is { readonly API: Fetcher } =>
  isRecord(value) && isRecord(value.API) && "fetch" in value.API;

const hasWorkerEnv = (value: unknown): value is { env: unknown } =>
  isRecord(value) && "env" in value;

/**
 * Forwards the raw request (cookies intact) to the api worker. Production uses
 * the `API` service binding; local dev rewrites the URL to the api dev server.
 */
const forwardAuthRequest = (request: Request) => {
  if (isLocal) {
    const target = new URL(request.url);
    target.protocol = "http:";
    target.host = `localhost:${process.env.API_PORT ?? "1337"}`;
    // Pass redirects through to the browser; following them here would
    // swallow Better Auth's Set-Cookie on the verify 302.
    return fetch(new Request(target, request), { redirect: "manual" });
  }

  // oxlint-disable-next-line @typescript-eslint/no-require-imports -- Cloudflare exposes workers bindings via require in this environment
  const workersModule: unknown = require("cloudflare:workers");
  if (!hasWorkerEnv(workersModule) || !isApiEnv(workersModule.env)) {
    throw new Error("Malvern worker API binding is invalid");
  }
  return workersModule.env.API.fetch(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => forwardAuthRequest(request),
      POST: ({ request }) => forwardAuthRequest(request),
    },
  },
});
