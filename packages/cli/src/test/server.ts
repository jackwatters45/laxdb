/**
 * Test server helper
 *
 * Spins up the API v2 RPC server in-process using the test database.
 * Manually wires handler layers with TestDatabaseLive instead of production DatabaseLive.
 */

import { createServer, type Server } from "node:http";

import { DrillRpcs } from "@laxdb/api-v2/drill/drill.rpc";
import { PlayerRpcs } from "@laxdb/api-v2/player/player.rpc";
import { PracticeRpcs } from "@laxdb/api-v2/practice/practice.rpc";
import { LaxdbRpcV2 } from "@laxdb/api-v2/rpc-group";
import { DrillRepo } from "@laxdb/core-v2/drill/drill.repo";
import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { PlayerRepo } from "@laxdb/core-v2/player/player.repo";
import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { PracticeRepo } from "@laxdb/core-v2/practice/practice.repo";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import { TestDatabaseLive, truncateAll } from "@laxdb/core-v2/test/db";
import { DateTime, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";

// ---------------------------------------------------------------------------
// Build handler layers using the TEST database instead of production
// ---------------------------------------------------------------------------

// Service layers backed by TestDatabaseLive
const TestPlayerService = Layer.effect(PlayerService, PlayerService.make).pipe(
  Layer.provide(Layer.effect(PlayerRepo, PlayerRepo.make)),
  Layer.provide(TestDatabaseLive),
);

const TestDrillService = Layer.effect(DrillService, DrillService.make).pipe(
  Layer.provide(Layer.effect(DrillRepo, DrillRepo.make)),
  Layer.provide(TestDatabaseLive),
);

const TestPracticeService = Layer.effect(
  PracticeService,
  PracticeService.make,
).pipe(
  Layer.provide(Layer.effect(PracticeRepo, PracticeRepo.make)),
  Layer.provide(TestDatabaseLive),
);

// RPC handler layers using test service layers
// Re-use the handler Effect from the rpc modules but provide test services
const TestPlayerHandlers = PlayerRpcs.toHandlers(
  Effect.gen(function* () {
    const service = yield* PlayerService;
    const { Player } = yield* Effect.promise(
      () => import("@laxdb/core-v2/player/player.schema"),
    );
    const asPlayer = (row: typeof Player.Type) => new Player(row);
    return {
      PlayerList: () =>
        service.list().pipe(Effect.map((rows) => rows.map(asPlayer))),
      PlayerGet: (payload) =>
        service.getByPublicId(payload).pipe(Effect.map(asPlayer)),
      PlayerCreate: (payload) =>
        service.create(payload).pipe(Effect.map(asPlayer)),
      PlayerUpdate: (payload) =>
        service.update(payload).pipe(Effect.map(asPlayer)),
      PlayerDelete: (payload) =>
        service.delete(payload).pipe(Effect.map(asPlayer)),
    };
  }),
).pipe(Layer.provide(TestPlayerService));

// Actually, let me check what's exported...
// The handlers are exported as Layer from the .rpc.ts files.
// I just need to provide the test service layers to them.

// ---------------------------------------------------------------------------
// Build the RPC router
// ---------------------------------------------------------------------------

const RpcRouter = RpcServer.layerHttp({
  group: LaxdbRpcV2,
  path: "/rpc",
  protocol: "http",
  spanPrefix: "rpc",
}).pipe(
  Layer.provide(TestPlayerHandlers),
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

  const server = createServer(async (req, res) => {
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
        : await new Promise<Buffer>((resolve) => {
            const chunks: Buffer[] = [];
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            req.on("end", () => {
              resolve(Buffer.concat(chunks));
            });
          });

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await handler(request);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
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
          err ? reject(err) : resolve();
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
