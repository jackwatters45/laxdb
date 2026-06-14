import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isApiEnv = (value: unknown): value is { readonly API: Fetcher } =>
  isRecord(value) && isRecord(value.API) && "fetch" in value.API;

/** Forwards the raw request (cookies intact) to the api worker binding. */
const forwardAuthRequest = (request: Request) => {
  if (!isApiEnv(env)) throw new Error("Malvern worker API binding is invalid");
  return env.API.fetch(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => forwardAuthRequest(request),
      POST: ({ request }) => forwardAuthRequest(request),
    },
  },
});
