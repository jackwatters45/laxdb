/**
 * Defaults CLI integration tests
 *
 * Tests the full generated HTTP client round-trip: client → HTTP → handler → service → DB
 */

import { ApiClient } from "@laxdb/api/client";
import { Effect } from "effect";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { apiLayer } from "../shared";

import { startTestServer, truncateAllTables, type TestServer } from "./server";

let testServer: TestServer;

const run = <A, E>(effect: Effect.Effect<A, E, ApiClient>) =>
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

describe("Defaults HTTP API", () => {
  it("gets an empty namespace by default", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Defaults.getNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
          },
        });
      }),
    );
    expect(values).toEqual({});
  });

  it("patches a namespace", async () => {
    const values = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
            values: {
              durationMinutes: 90,
              location: "Main Field",
            },
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
        const client = yield* ApiClient;
        yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
            values: {
              durationMinutes: 90,
            },
          },
        });
        return yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
            values: {
              location: "Indoor",
            },
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
        const client = yield* ApiClient;
        yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
            values: { durationMinutes: 120 },
          },
        });
        return yield* client.Defaults.getNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
          },
        });
      }),
    );
    expect(values).toEqual({ durationMinutes: 120 });
  });

  it("different scopes are independent", async () => {
    const [global, user] = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
            values: { durationMinutes: 90 },
          },
        });
        yield* client.Defaults.patchNamespace({
          payload: {
            scopeType: "user",
            scopeId: "usr123",
            namespace: "practice",
            values: { durationMinutes: 120 },
          },
        });
        const g = yield* client.Defaults.getNamespace({
          payload: {
            scopeType: "global",
            scopeId: "global",
            namespace: "practice",
          },
        });
        const u = yield* client.Defaults.getNamespace({
          payload: {
            scopeType: "user",
            scopeId: "usr123",
            namespace: "practice",
          },
        });
        return [g, u] as const;
      }),
    );
    expect(global).toEqual({ durationMinutes: 90 });
    expect(user).toEqual({ durationMinutes: 120 });
  });
});
