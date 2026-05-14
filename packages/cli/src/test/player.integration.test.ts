/**
 * Player CLI integration tests
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

describe("Player HTTP API", () => {
  it("lists players (empty)", async () => {
    const players = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Players.listPlayers();
      }),
    );
    expect(players).toEqual([]);
  });

  it("creates a player", async () => {
    const player = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Players.createPlayer({
          payload: {
            name: "Alice",
            email: "alice@test.com",
          },
        });
      }),
    );
    expect(player.name).toBe("Alice");
    expect(player.email).toBe("alice@test.com");
    expect(player.publicId).toHaveLength(12);
  });

  it("gets a player by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Players.createPlayer({
          payload: {
            name: "Bob",
            email: "bob@test.com",
          },
        });
        return yield* client.Players.getPlayer({
          payload: { publicId: created.publicId },
        });
      }),
    );
    expect(found.name).toBe("Bob");
  });

  it("lists all players", async () => {
    const players = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        yield* client.Players.createPlayer({
          payload: { name: "A", email: "a@test.com" },
        });
        yield* client.Players.createPlayer({
          payload: { name: "B", email: "b@test.com" },
        });
        return yield* client.Players.listPlayers();
      }),
    );
    expect(players).toHaveLength(2);
  });

  it("updates a player", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Players.createPlayer({
          payload: {
            name: "Original",
            email: "orig@test.com",
          },
        });
        return yield* client.Players.updatePlayer({
          payload: {
            publicId: created.publicId,
            name: "Updated",
          },
        });
      }),
    );
    expect(updated.name).toBe("Updated");
    expect(updated.email).toBe("orig@test.com");
  });

  it("deletes a player", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Players.createPlayer({
          payload: {
            name: "ToDelete",
            email: "del@test.com",
          },
        });
        yield* client.Players.deletePlayer({
          payload: { publicId: created.publicId },
        });
        return yield* client.Players.listPlayers();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent player fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Players.getPlayer({
            payload: { publicId: "AbCdEfGhIjKl" },
          });
        }),
      ),
    ).rejects.toThrow();
  });

  it("delete nonexistent player fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Players.deletePlayer({
            payload: { publicId: "AbCdEfGhIjKl" },
          });
        }),
      ),
    ).rejects.toThrow();
  });
});
