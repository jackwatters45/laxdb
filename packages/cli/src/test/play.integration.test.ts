/**
 * Play CLI integration tests
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

describe("Play HTTP API", () => {
  const minimalPlay = {
    name: "2-3-1 Motion",
    category: "offense" as const,
    formation: null,
    description: null,
    personnelNotes: null,
    tags: [],
    diagramUrl: null,
    videoUrl: null,
  };

  it("lists plays (empty)", async () => {
    const plays = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Plays.listPlays();
      }),
    );
    expect(plays).toEqual([]);
  });

  it("creates a play", async () => {
    const play = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Plays.createPlay({ payload: minimalPlay });
      }),
    );
    expect(play.name).toBe("2-3-1 Motion");
    expect(play.category).toBe("offense");
    expect(play.publicId).toHaveLength(12);
  });

  it("gets a play by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Plays.createPlay({
          payload: minimalPlay,
        });
        return yield* client.Plays.getPlay({
          payload: { publicId: created.publicId },
        });
      }),
    );
    expect(found.name).toBe("2-3-1 Motion");
  });

  it("updates a play", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Plays.createPlay({
          payload: minimalPlay,
        });
        return yield* client.Plays.updatePlay({
          payload: {
            publicId: created.publicId,
            formation: "1-4-1",
            tags: ["invert"],
          },
        });
      }),
    );
    expect(updated.formation).toBe("1-4-1");
    expect(updated.tags).toEqual(["invert"]);
  });

  it("creates a play with all fields", async () => {
    const play = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Plays.createPlay({
          payload: {
            ...minimalPlay,
            name: "Full Play",
            category: "emo",
            formation: "2-2-2",
            description: "Extra man offense play",
            personnelNotes: "Need strong shooters",
            tags: ["emo", "settled"],
            diagramUrl: "https://example.com/diagram.png",
            videoUrl: "https://example.com/video.mp4",
          },
        });
      }),
    );
    expect(play.name).toBe("Full Play");
    expect(play.category).toBe("emo");
    expect(play.formation).toBe("2-2-2");
    expect(play.description).toBe("Extra man offense play");
    expect(play.tags).toEqual(["emo", "settled"]);
  });

  it("bulk-create smoke test creates multiple plays", async () => {
    const [createdPlays, listedPlays] = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* Effect.forEach(
          [
            minimalPlay,
            { ...minimalPlay, name: "Clear 1", category: "clear" as const },
          ],
          (item) => client.Plays.createPlay({ payload: item }),
          { concurrency: 5 },
        );
        const plays = yield* client.Plays.listPlays();
        return [created, plays] as const;
      }),
    );

    expect(createdPlays).toHaveLength(2);
    expect(listedPlays).toHaveLength(2);
  });

  it("lists all plays", async () => {
    const plays = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        yield* client.Plays.createPlay({ payload: minimalPlay });
        yield* client.Plays.createPlay({
          payload: { ...minimalPlay, name: "Clear 1" },
        });
        return yield* client.Plays.listPlays();
      }),
    );
    expect(plays).toHaveLength(2);
  });

  it("deletes a play", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Plays.createPlay({
          payload: minimalPlay,
        });
        yield* client.Plays.deletePlay({
          payload: { publicId: created.publicId },
        });
        return yield* client.Plays.listPlays();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent play fails with NotFoundError", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Plays.getPlay({
            payload: { publicId: "AbCdEfGhIjKl" },
          });
        }),
      ),
    ).rejects.toMatchObject({ _tag: "NotFoundError", domain: "Play" });
  });
});
