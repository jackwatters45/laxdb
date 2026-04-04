/**
 * Defaults CLI integration tests
 *
 * Tests the full RPC round-trip: client → HTTP → handler → service → DB
 */

import { RpcApiClient } from "@laxdb/api/client";
import { Effect } from "effect";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { apiLayer } from "../shared";

import { startTestServer, truncateAllTables, type TestServer } from "./server";

let testServer: TestServer;

const run = <A, E>(effect: Effect.Effect<A, E, RpcApiClient>) =>
  effect.pipe(Effect.provide(apiLayer(testServer.url)), Effect.runPromise);

beforeAll(async () => {
  testServer = await startTestServer();
});

afterAll(async () => {
  await testServer?.cleanup();
});

beforeEach(async () => {
  await truncateAllTables();
});

describe("Defaults RPC", () => {
  const scope = {
    scopeType: "global" as const,
    scopeId: "system",
    namespace: "practice",
  };

  it("gets namespace defaults (empty returns empty object)", async () => {
    const defaults = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DefaultsGetNamespace(scope);
      }),
    );
    expect(defaults).toEqual({});
  });

  it("patches namespace defaults", async () => {
    const defaults = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DefaultsPatchNamespace({
          ...scope,
          values: { duration: 90, location: "Main Field" },
        });
      }),
    );
    expect(defaults).toEqual({ duration: 90, location: "Main Field" });
  });

  it("patches are merged (not replaced)", async () => {
    const defaults = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          ...scope,
          values: { duration: 90 },
        });
        return yield* client.DefaultsPatchNamespace({
          ...scope,
          values: { location: "Main Field" },
        });
      }),
    );
    expect(defaults).toEqual({ duration: 90, location: "Main Field" });
  });

  it("get returns patched values", async () => {
    const defaults = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          ...scope,
          values: { duration: 120 },
        });
        return yield* client.DefaultsGetNamespace(scope);
      }),
    );
    expect(defaults).toEqual({ duration: 120 });
  });

  it("different scopes are independent", async () => {
    const [global, user] = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          ...scope,
          values: { duration: 90 },
        });
        yield* client.DefaultsPatchNamespace({
          scopeType: "user",
          scopeId: "usr123",
          namespace: "practice",
          values: { duration: 120 },
        });
        const g = yield* client.DefaultsGetNamespace(scope);
        const u = yield* client.DefaultsGetNamespace({
          scopeType: "user",
          scopeId: "usr123",
          namespace: "practice",
        });
        return [g, u] as const;
      }),
    );
    expect(global).toEqual({ duration: 90 });
    expect(user).toEqual({ duration: 120 });
  });
});
