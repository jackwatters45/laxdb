/**
 * Practice CLI integration tests
 *
 * Tests the full generated HTTP client round-trip: client → HTTP → handler → service → DB
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@effect/vitest";
import { ApiClient } from "@laxdb/api/client";
import { Effect } from "effect";

import { apiLayer } from "../shared";

import { startTestServer, truncateAllTables, type TestServer } from "./server";

let testServer: TestServer;

const run = <A, E>(effect: Effect.Effect<A, E, ApiClient>) =>
  effect.pipe(Effect.provide(apiLayer(testServer.url)), Effect.runPromise);

const runDrill = <A, E>(effect: Effect.Effect<A, E, ApiClient>) =>
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

describe("Practice HTTP API", () => {
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
        const client = yield* ApiClient;
        return yield* client.Practices.listPractices();
      }),
    );
    expect(practices).toEqual([]);
  });

  it("creates a practice", async () => {
    const practice = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Practices.createPractice({
          payload: {
            ...minimalPractice,
            name: "Morning Practice",
            durationMinutes: 90,
            location: "Main Field",
          },
        });
      }),
    );
    expect(practice.name).toBe("Morning Practice");
    expect(practice.durationMinutes).toBe(90);
    expect(practice.location).toBe("Main Field");
    expect(practice.publicId).toHaveLength(12);
  });

  it("round-trips an encoded date string", async () => {
    const practice = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Practices.createPractice({
          payload: {
            ...minimalPractice,
            date: "2026-03-14T15:30:00.000Z",
          },
        });
      }),
    );
    expect(practice.date).toBeInstanceOf(Date);
    expect(practice.date?.toISOString()).toBe("2026-03-14T15:30:00.000Z");
  });

  it("gets a practice by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.getPractice({
          payload: { publicId: created.publicId },
        });
      }),
    );
    expect(found.publicId).toBeTruthy();
  });

  it("lists all practices", async () => {
    const practices = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        yield* client.Practices.createPractice({ payload: minimalPractice });
        yield* client.Practices.createPractice({
          payload: {
            ...minimalPractice,
            name: "Afternoon",
          },
        });
        return yield* client.Practices.listPractices();
      }),
    );
    expect(practices).toHaveLength(2);
  });

  it("updates a practice", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.updatePractice({
          payload: {
            publicId: created.publicId,
            name: "Updated Practice",
            location: "Indoor Facility",
          },
        });
      }),
    );
    expect(updated.name).toBe("Updated Practice");
    expect(updated.location).toBe("Indoor Facility");
  });

  it("deletes a practice", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        yield* client.Practices.deletePractice({
          payload: { publicId: created.publicId },
        });
        return yield* client.Practices.listPractices();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent practice fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Practices.getPractice({
            payload: { publicId: "AbCdEfGhIjKl" },
          });
        }),
      ),
    ).rejects.toThrow();
  });
});

describe("Practice Items HTTP API", () => {
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
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: created.publicId,
            type: "warmup",
          },
        });
      }),
    );
    expect(item.type).toBe("warmup");
    expect(item.publicId).toHaveLength(12);
  });

  it("adds a drill item to a practice", async () => {
    // Create drill separately for clearer fixture setup
    const createdDrill = await runDrill(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Drills.createDrill({ payload: minimalDrill });
      }),
    );
    const item = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const createdPractice = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: createdPractice.publicId,
            type: "drill",
            drillPublicId: createdDrill.publicId,
          },
        });
      }),
    );
    expect(item.type).toBe("drill");
  });

  it("lists items for a practice", async () => {
    const items = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: created.publicId,
            type: "warmup",
          },
        });
        yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: created.publicId,
            type: "cooldown",
          },
        });
        return yield* client.Practices.listPracticeItems({
          payload: {
            practicePublicId: created.publicId,
          },
        });
      }),
    );
    expect(items).toHaveLength(2);
  });

  it("removes an item from a practice", async () => {
    const items = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        const item = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: created.publicId,
            type: "warmup",
          },
        });
        yield* client.Practices.removePracticeItem({
          payload: { publicId: item.publicId },
        });
        return yield* client.Practices.listPracticeItems({
          payload: {
            practicePublicId: created.publicId,
          },
        });
      }),
    );
    expect(items).toHaveLength(0);
  });
});

describe("Practice Edges HTTP API", () => {
  const minimalPractice = {
    name: null,
    date: null,
    description: null,
    notes: null,
    durationMinutes: null,
    location: null,
  };

  it("lists edges (empty)", async () => {
    const edges = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const practice = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.listPracticeEdges({
          payload: {
            practicePublicId: practice.publicId,
          },
        });
      }),
    );
    expect(edges).toEqual([]);
  });

  it("lists edges for a practice", async () => {
    const edges = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const practice = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        const source = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: practice.publicId,
            type: "warmup",
          },
        });
        const target = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: practice.publicId,
            type: "cooldown",
          },
        });
        yield* client.Practices.replacePracticeEdges({
          payload: {
            practicePublicId: practice.publicId,
            edges: [
              {
                sourcePublicId: source.publicId,
                targetPublicId: target.publicId,
                label: "then",
              },
            ],
          },
        });
        return yield* client.Practices.listPracticeEdges({
          payload: {
            practicePublicId: practice.publicId,
          },
        });
      }),
    );
    expect(edges).toHaveLength(1);
    expect(edges[0]?.label).toBe("then");
  });

  it("replaces edges for a practice", async () => {
    const edges = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const practice = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        const first = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: practice.publicId,
            type: "warmup",
          },
        });
        const second = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: practice.publicId,
            type: "drill",
            label: "Stickwork",
          },
        });
        const third = yield* client.Practices.addPracticeItem({
          payload: {
            practicePublicId: practice.publicId,
            type: "cooldown",
          },
        });

        yield* client.Practices.replacePracticeEdges({
          payload: {
            practicePublicId: practice.publicId,
            edges: [
              {
                sourcePublicId: first.publicId,
                targetPublicId: second.publicId,
                label: "start",
              },
            ],
          },
        });

        return yield* client.Practices.replacePracticeEdges({
          payload: {
            practicePublicId: practice.publicId,
            edges: [
              {
                sourcePublicId: second.publicId,
                targetPublicId: third.publicId,
                label: "finish",
              },
            ],
          },
        });
      }),
    );
    expect(edges).toHaveLength(1);
    expect(edges[0]?.label).toBe("finish");
  });
});

describe("Practice Review HTTP API", () => {
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
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        return yield* client.Practices.createPracticeReview({
          payload: {
            practicePublicId: created.publicId,
            wentWell: "Good energy",
            needsImprovement: "Transitions",
            notes: null,
          },
        });
      }),
    );
    expect(review.wentWell).toBe("Good energy");
    expect(review.needsImprovement).toBe("Transitions");
  });

  it("gets a review", async () => {
    const review = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        yield* client.Practices.createPracticeReview({
          payload: {
            practicePublicId: created.publicId,
            wentWell: "Passing",
            needsImprovement: null,
            notes: null,
          },
        });
        return yield* client.Practices.getPracticeReview({
          payload: {
            practicePublicId: created.publicId,
          },
        });
      }),
    );
    expect(review.wentWell).toBe("Passing");
  });

  it("updates a review", async () => {
    const review = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Practices.createPractice({
          payload: minimalPractice,
        });
        yield* client.Practices.createPracticeReview({
          payload: {
            practicePublicId: created.publicId,
            wentWell: "Original",
            needsImprovement: null,
            notes: null,
          },
        });
        return yield* client.Practices.updatePracticeReview({
          payload: {
            practicePublicId: created.publicId,
            wentWell: "Updated",
          },
        });
      }),
    );
    expect(review.wentWell).toBe("Updated");
  });

  it("get review for practice without review fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          const created = yield* client.Practices.createPractice({
            payload: minimalPractice,
          });
          return yield* client.Practices.getPracticeReview({
            payload: {
              practicePublicId: created.publicId,
            },
          });
        }),
      ),
    ).rejects.toThrow();
  });
});
