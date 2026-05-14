/**
 * Test server for api HTTP integration tests.
 *
 * Serves the full generated HTTP API backed by TestDatabaseLive.
 */

import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import {
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";

import { LaxdbApi } from "../definition";
import { HttpGroupsLive } from "../layers";

import { startNodeHttpTestServer, type TestServer } from "./http-test-server";

const TestHttpHandlers = HttpGroupsLive.pipe(Layer.provide(TestDatabaseLive));

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApi).pipe(
  Layer.provide(TestHttpHandlers),
  Layer.provide(HttpServer.layerServices),
);

const DocsRoute = HttpApiScalar.layer(LaxdbApi);

const HealthRoute = HttpRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(HttpApiRouter, DocsRoute, HealthRoute).pipe(
  Layer.provide(DateTime.layerCurrentZoneLocal),
);

/**
 * Start a test API server on a random port.
 */
export type { TestServer } from "./http-test-server";

export const startTestServer = (): Promise<TestServer> =>
  startNodeHttpTestServer(AllRoutes);

/**
 * Truncate all tables.
 */
export const truncateAllTables = () =>
  Effect.provide(truncateAll, TestDatabaseLive).pipe(Effect.runPromise);

/**
 * POST JSON to an endpoint, return parsed response.
 */
export async function post(
  baseUrl: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}
