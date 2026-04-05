/**
 * Test server for api HTTP + RPC integration tests.
 *
 * Serves the full API (HTTP routes + RPC) backed by TestDatabaseLive.
 */

import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpServer } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

import { DefaultsRpcHandlers } from "../defaults/defaults.rpc-handlers";
import { LaxdbApiV2 } from "../definition";
import { DrillsHandlersLive } from "../drill/drill.handlers";
import { DrillRpcHandlers } from "../drill/drill.rpc-handlers";
import { PlaysHandlersLive } from "../play/play.handlers";
import { PlayRpcHandlers } from "../play/play.rpc-handlers";
import { PlayersHandlersLive } from "../player/player.handlers";
import { PlayerRpcHandlers } from "../player/player.rpc-handlers";
import { PracticesHandlersLive } from "../practice/practice.handlers";
import { PracticeRpcHandlers } from "../practice/practice.rpc-handlers";
import { LaxdbRpcV2 } from "../rpc-group";

import { startNodeHttpTestServer, type TestServer } from "./http-test-server";

// RPC handlers backed by test DB
const TestRpcHandlers = Layer.mergeAll(
  DefaultsRpcHandlers,
  DrillRpcHandlers,
  PlayRpcHandlers,
  PlayerRpcHandlers,
  PracticeRpcHandlers,
).pipe(Layer.provide(TestDatabaseLive));

// HTTP API handlers backed by test DB
const TestHttpHandlers = Layer.mergeAll(
  DrillsHandlersLive,
  PlaysHandlersLive,
  PlayersHandlersLive,
  PracticesHandlersLive,
).pipe(Layer.provide(TestDatabaseLive));

const RpcRouter = RpcServer.layerHttp({
  group: LaxdbRpcV2,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(TestRpcHandlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const HttpApiRouter = HttpApiBuilder.layer(LaxdbApiV2).pipe(
  Layer.provide(TestHttpHandlers),
  Layer.provide(HttpServer.layerServices),
);

const DocsRoute = HttpApiScalar.layer(LaxdbApiV2);

const AllRoutes = Layer.mergeAll(RpcRouter, HttpApiRouter, DocsRoute).pipe(
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const expectRecord = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error("Expected an object response");
  }
  return value;
};

export const expectRecordArray = (
  value: unknown,
): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    throw new TypeError("Expected an array response");
  }

  return value.map((item) => expectRecord(item));
};

export const expectString = (value: unknown, label: string): string => {
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${label} to be a string`);
  }
  return value;
};

export const expectStringProp = (value: unknown, key: string): string =>
  expectString(expectRecord(value)[key], key);
