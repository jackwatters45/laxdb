/**
 * Test server for api HTTP + RPC integration tests.
 *
 * Serves the full API (HTTP routes + RPC) backed by TestDatabaseLive.
 */

import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
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

export interface TestServer {
  url: string;
  server: Server;
  cleanup: () => Promise<void>;
}

const readRequestBody = (req: IncomingMessage): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });

const createHeaders = (req: IncomingMessage) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
};

const handleNodeRequest = async (
  handler: (request: Request) => Promise<Response>,
  req: IncomingMessage,
  res: ServerResponse,
) => {
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await readRequestBody(req);

  const request = new Request(`http://localhost${req.url ?? "/"}`, {
    method: req.method,
    headers: createHeaders(req),
    body,
  });

  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  const responseBody = await response.arrayBuffer();
  res.end(Buffer.from(responseBody));
};

/**
 * Start a test API server on a random port.
 */
export async function startTestServer(): Promise<TestServer> {
  const { handler, dispose } = HttpRouter.toWebHandler(AllRoutes);

  const server = createServer((req, res) => {
    void handleNodeRequest(handler, req, res).catch((cause: unknown) => {
      const message =
        cause instanceof Error ? cause.message : "Internal server error";
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(message);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const url = `http://localhost:${String(port)}`;

  return {
    url,
    server,
    cleanup: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await dispose();
    },
  };
}

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
