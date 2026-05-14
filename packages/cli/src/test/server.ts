/**
 * Test server helper.
 *
 * Spins up the generated HTTP API in-process using the test database. Since
 * repos no longer bundle DatabaseLive, we provide TestDatabaseLive at the top
 * level and it flows through handlers → services → repos.
 */

import { LaxdbApi } from "@laxdb/api/definition";
import { HttpGroupsLive } from "@laxdb/api/groups/index";
import {
  startNodeHttpTestServer,
  type TestServer,
} from "@laxdb/api/test/http-test-server";
import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpServer } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApi).pipe(
  Layer.provide(HttpGroupsLive.pipe(Layer.provide(TestDatabaseLive))),
  Layer.provide(HttpServer.layerServices),
);

const AllRoutes = HttpApiRouter.pipe(
  Layer.provide(DateTime.layerCurrentZoneLocal),
);

/**
 * Start a test API server on a random port.
 * Call `cleanup()` when done.
 */
export type { TestServer } from "@laxdb/api/test/http-test-server";

export const startTestServer = (): Promise<TestServer> =>
  startNodeHttpTestServer(AllRoutes);

/**
 * Truncate all tables — run before each test for isolation.
 */
export const truncateAllTables = () =>
  Effect.provide(truncateAll, TestDatabaseLive).pipe(Effect.runPromise);

export { truncateAll, TestDatabaseLive };
