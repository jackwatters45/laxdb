/**
 * Play CLI integration tests
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

describe("Play RPC", () => {
  const minimalPlay = {
    name: "Zone Offense",
    category: "offense" as const,
    formation: null,
    description: null,
    personnelNotes: null,
    diagramUrl: null,
    videoUrl: null,
  };

  it("lists plays (empty)", async () => {
    const plays = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayList();
      }),
    );
    expect(plays).toEqual([]);
  });

  it("creates a play", async () => {
    const play = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayCreate(minimalPlay);
      }),
    );
    expect(play.name).toBe("Zone Offense");
    expect(play.category).toBe("offense");
    expect(play.publicId).toHaveLength(12);
  });

  it("creates a play with all fields", async () => {
    const play = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PlayCreate({
          ...minimalPlay,
          name: "Full Play",
          category: "emo",
          formation: "2-2-2",
          description: "Extra man offense play",
          personnelNotes: "Need strong shooters",
          tags: ["emo", "settled"],
          diagramUrl: "https://example.com/diagram.png",
          videoUrl: "https://example.com/video.mp4",
        });
      }),
    );
    expect(play.name).toBe("Full Play");
    expect(play.category).toBe("emo");
    expect(play.formation).toBe("2-2-2");
    expect(play.description).toBe("Extra man offense play");
    expect(play.tags).toEqual(["emo", "settled"]);
  });

  it("gets a play by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PlayCreate(minimalPlay);
        return yield* client.PlayGet({ publicId: created.publicId });
      }),
    );
    expect(found.name).toBe("Zone Offense");
  });

  it("lists all plays", async () => {
    const plays = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.PlayCreate(minimalPlay);
        yield* client.PlayCreate({ ...minimalPlay, name: "Clear 1" });
        return yield* client.PlayList();
      }),
    );
    expect(plays).toHaveLength(2);
  });

  it("updates a play", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PlayCreate(minimalPlay);
        return yield* client.PlayUpdate({
          publicId: created.publicId,
          name: "Updated Play",
        });
      }),
    );
    expect(updated.name).toBe("Updated Play");
  });

  it("deletes a play", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PlayCreate(minimalPlay);
        yield* client.PlayDelete({ publicId: created.publicId });
        return yield* client.PlayList();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent play fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* RpcApiClient;
          return yield* client.PlayGet({ publicId: "AbCdEfGhIjKl" });
        }),
      ),
    ).rejects.toThrow();
  });
});
