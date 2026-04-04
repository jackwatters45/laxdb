/**
 * Practice CLI integration tests
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

const runDrill = <A, E>(effect: Effect.Effect<A, E, RpcApiClient>) =>
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

describe("Practice RPC", () => {
  const minimalPractice = {
    name: null,
    date: null,
    description: null,
    notes: null,
    durationMinutes: null,
    location: null,
  };

  it("lists practices (empty)", async () => {
    const practices = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PracticeList();
      }),
    );
    expect(practices).toEqual([]);
  });

  it("creates a practice", async () => {
    const practice = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.PracticeCreate({
          ...minimalPractice,
          name: "Morning Practice",
          durationMinutes: 90,
          location: "Main Field",
        });
      }),
    );
    expect(practice.name).toBe("Morning Practice");
    expect(practice.durationMinutes).toBe(90);
    expect(practice.location).toBe("Main Field");
    expect(practice.publicId).toHaveLength(12);
  });

  it("gets a practice by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        return yield* client.PracticeGet({ publicId: created.publicId });
      }),
    );
    expect(found.publicId).toBeTruthy();
  });

  it("lists all practices", async () => {
    const practices = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.PracticeCreate(minimalPractice);
        yield* client.PracticeCreate({
          ...minimalPractice,
          name: "Afternoon",
        });
        return yield* client.PracticeList();
      }),
    );
    expect(practices).toHaveLength(2);
  });

  it("updates a practice", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        return yield* client.PracticeUpdate({
          publicId: created.publicId,
          name: "Updated Practice",
          location: "Indoor Facility",
        });
      }),
    );
    expect(updated.name).toBe("Updated Practice");
    expect(updated.location).toBe("Indoor Facility");
  });

  it("deletes a practice", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        yield* client.PracticeDelete({ publicId: created.publicId });
        return yield* client.PracticeList();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent practice fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* RpcApiClient;
          return yield* client.PracticeGet({ publicId: "AbCdEfGhIjKl" });
        }),
      ),
    ).rejects.toThrow();
  });
});

describe("Practice Items RPC", () => {
  const minimalPractice = {
    name: null,
    date: null,
    description: null,
    notes: null,
    durationMinutes: null,
    location: null,
  };

  const minimalDrill = {
    name: "Test Drill",
    subtitle: null,
    description: null,
    intensity: null,
    contact: null,
    competitive: null,
    playerCount: null,
    durationMinutes: null,
    fieldSpace: null,
    equipment: null,
    diagramUrl: null,
    videoUrl: null,
    coachNotes: null,
  };

  it("adds an item to a practice", async () => {
    const item = await run(
      Effect.gen(function* () {
        const practice = yield* RpcApiClient;
        const created = yield* practice.PracticeCreate(minimalPractice);
        return yield* practice.PracticeAddItem({
          practicePublicId: created.publicId,
          type: "warmup",
        });
      }),
    );
    expect(item.type).toBe("warmup");
    expect(item.publicId).toHaveLength(12);
  });

  it("adds a drill item to a practice", async () => {
    // Create drill separately to avoid multiplexing two RPC groups on one connection
    const createdDrill = await runDrill(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillCreate(minimalDrill);
      }),
    );
    const item = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const createdPractice = yield* client.PracticeCreate(minimalPractice);
        return yield* client.PracticeAddItem({
          practicePublicId: createdPractice.publicId,
          type: "drill",
          drillPublicId: createdDrill.publicId,
        });
      }),
    );
    expect(item.type).toBe("drill");
  });

  it("lists items for a practice", async () => {
    const items = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        yield* client.PracticeAddItem({
          practicePublicId: created.publicId,
          type: "warmup",
        });
        yield* client.PracticeAddItem({
          practicePublicId: created.publicId,
          type: "cooldown",
        });
        return yield* client.PracticeListItems({
          practicePublicId: created.publicId,
        });
      }),
    );
    expect(items).toHaveLength(2);
  });

  it("removes an item from a practice", async () => {
    const items = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        const item = yield* client.PracticeAddItem({
          practicePublicId: created.publicId,
          type: "warmup",
        });
        yield* client.PracticeRemoveItem({ publicId: item.publicId });
        return yield* client.PracticeListItems({
          practicePublicId: created.publicId,
        });
      }),
    );
    expect(items).toHaveLength(0);
  });
});

describe("Practice Review RPC", () => {
  const minimalPractice = {
    name: null,
    date: null,
    description: null,
    notes: null,
    durationMinutes: null,
    location: null,
  };

  it("creates a review", async () => {
    const review = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        return yield* client.PracticeCreateReview({
          practicePublicId: created.publicId,
          wentWell: "Good energy",
          needsImprovement: "Transitions",
          notes: null,
        });
      }),
    );
    expect(review.wentWell).toBe("Good energy");
    expect(review.needsImprovement).toBe("Transitions");
  });

  it("gets a review", async () => {
    const review = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        yield* client.PracticeCreateReview({
          practicePublicId: created.publicId,
          wentWell: "Passing",
          needsImprovement: null,
          notes: null,
        });
        return yield* client.PracticeGetReview({
          practicePublicId: created.publicId,
        });
      }),
    );
    expect(review.wentWell).toBe("Passing");
  });

  it("updates a review", async () => {
    const review = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.PracticeCreate(minimalPractice);
        yield* client.PracticeCreateReview({
          practicePublicId: created.publicId,
          wentWell: "Original",
          needsImprovement: null,
          notes: null,
        });
        return yield* client.PracticeUpdateReview({
          practicePublicId: created.publicId,
          wentWell: "Updated",
        });
      }),
    );
    expect(review.wentWell).toBe("Updated");
  });

  it("get review for practice without review fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* RpcApiClient;
          const created = yield* client.PracticeCreate(minimalPractice);
          return yield* client.PracticeGetReview({
            practicePublicId: created.publicId,
          });
        }),
      ),
    ).rejects.toThrow();
  });
});
