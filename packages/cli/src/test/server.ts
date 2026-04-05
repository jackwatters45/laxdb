/**
 * Test server helper
 *
 * Spins up the API v2 RPC server in-process using the test database.
 * Since repos no longer bundle DatabaseLive, we provide TestDatabaseLive
 * at the top level and it flows through handlers → services → repos.
 */

import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import { DefaultsRpcHandlers } from "@laxdb/api/defaults/defaults.rpc-handlers";
import { DrillRpcHandlers } from "@laxdb/api/drill/drill.rpc-handlers";
import { PlayRpcHandlers } from "@laxdb/api/play/play.rpc-handlers";
import { PlayerRpcHandlers } from "@laxdb/api/player/player.rpc-handlers";
import { PracticeRpcHandlers } from "@laxdb/api/practice/practice.rpc-handlers";
import { emptyRequestContext } from "@laxdb/api/request-context";
import { LaxdbRpcV2 } from "@laxdb/api/rpc-group";
import { TestDatabaseLive, truncateAll } from "@laxdb/core/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
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

export interface TestServer {
  url: string;
  server: Server;
  cleanup: () => Promise<void>;
}

/**
 * Start a test API server on a random port.
 * Call `cleanup()` when done.
 */
export async function startTestServer(): Promise<TestServer> {
  const { handler, dispose } = HttpRouter.toWebHandler(AllRoutes);

  const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    const url = `http://localhost${req.url ?? "/"}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            req.on("end", () => {
              resolve(Buffer.concat(chunks));
            });
            req.on("error", reject);
          });

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await handler(request, emptyRequestContext);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  };

  const server = createServer((req, res) => {
    void handleRequest(req, res).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      res.statusCode = 500;
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
 * Truncate all tables — run before each test for isolation.
 */
export const truncateAllTables = () =>
  Effect.provide(truncateAll, TestDatabaseLive).pipe(Effect.runPromise);

export { truncateAll, TestDatabaseLive };
