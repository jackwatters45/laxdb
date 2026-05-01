/**
 * Test server helper
 *
 * Spins up the API v2 RPC server in-process using the test database.
 * Since repos no longer bundle DatabaseLive, we provide TestDatabaseLive
 * at the top level and it flows through handlers → services → repos.
 */

import { DefaultsRpcHandlers } from "@laxdb/api/defaults/defaults.rpc-handlers";
import { DrillRpcHandlers } from "@laxdb/api/drill/drill.rpc-handlers";
import { PlayRpcHandlers } from "@laxdb/api/play/play.rpc-handlers";
import { PlayerRpcHandlers } from "@laxdb/api/player/player.rpc-handlers";
import { PracticeRpcHandlers } from "@laxdb/api/practice/practice.rpc-handlers";
import { LaxdbRpcV2 } from "@laxdb/api/rpc-group";
import {
  startNodeHttpTestServer,
  type TestServer,
} from "@laxdb/api/test/http-test-server";
import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpServer } from "effect/unstable/http";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

// Handler layers with test database instead of production DatabaseLive
const TestHandlers = Layer.mergeAll(
  DefaultsRpcHandlers,
  DrillRpcHandlers,
  PlayRpcHandlers,
  PlayerRpcHandlers,
  PracticeRpcHandlers,
).pipe(Layer.provide(TestDatabaseLive));

const RpcRouter = RpcServer.layerHttp({
  group: LaxdbRpcV2,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(TestHandlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const AllRoutes = RpcRouter.pipe(
  Layer.provide(HttpServer.layerServices),
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
