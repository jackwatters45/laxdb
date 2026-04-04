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
  it("gets an empty namespace by default", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DefaultsGetNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
        });
      }),
    );
    expect(values).toEqual({});
  });

  it("patches a namespace", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DefaultsPatchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            durationMinutes: 90,
            location: "Main Field",
          },
        });
      }),
    );
    expect(values).toEqual({
      durationMinutes: 90,
      location: "Main Field",
    });
  });

  it("merges namespace updates", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            durationMinutes: 90,
          },
        });
        return yield* client.DefaultsPatchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            location: "Indoor",
          },
        });
      }),
    );
    expect(values).toEqual({
      durationMinutes: 90,
      location: "Indoor",
    });
  });

  it("get returns patched values", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: { durationMinutes: 120 },
        });
        return yield* client.DefaultsGetNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
        });
      }),
    );
    expect(values).toEqual({ durationMinutes: 120 });
  });

  it("different scopes are independent", async () => {
    const [global, user] = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DefaultsPatchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: { durationMinutes: 90 },
        });
        yield* client.DefaultsPatchNamespace({
          scopeType: "user",
          scopeId: "usr123",
          namespace: "practice",
          values: { durationMinutes: 120 },
        });
        const g = yield* client.DefaultsGetNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
        });
        const u = yield* client.DefaultsGetNamespace({
          scopeType: "user",
          scopeId: "usr123",
          namespace: "practice",
        });
        return [g, u] as const;
      }),
    );
    expect(global).toEqual({ durationMinutes: 90 });
    expect(user).toEqual({ durationMinutes: 120 });
  });
});
