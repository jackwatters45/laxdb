/**
 * Drill CLI integration tests
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

describe("Drill HTTP API", () => {
  const minimalDrill = {
    name: "Box Passing",
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

  it("lists drills (empty)", async () => {
    const drills = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Drills.listDrills();
      }),
    );
    expect(drills).toEqual([]);
  });

  it("creates a drill", async () => {
    const drill = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Drills.createDrill({ payload: minimalDrill });
      }),
    );
    expect(drill.name).toBe("Box Passing");
    expect(drill.publicId).toHaveLength(12);
  });

  it("creates a drill with all fields", async () => {
    const drill = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* client.Drills.createDrill({
          payload: {
            ...minimalDrill,
            name: "Full Drill",
            subtitle: "A subtitle",
            description: "A description",
            intensity: "high",
            contact: true,
            competitive: false,
            playerCount: 12,
            durationMinutes: 15,
            fieldSpace: "half-field",
            equipment: ["sticks", "balls"],
            coachNotes: "Focus on footwork",
          },
        });
      }),
    );
    expect(drill.name).toBe("Full Drill");
    expect(drill.subtitle).toBe("A subtitle");
    expect(drill.intensity).toBe("high");
    expect(drill.contact).toBe(true);
    expect(drill.playerCount).toBe(12);
  });

  it("gets a drill by publicId", async () => {
    const found = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Drills.createDrill({
          payload: minimalDrill,
        });
        return yield* client.Drills.getDrill({
          payload: { publicId: created.publicId },
        });
      }),
    );
    expect(found.name).toBe("Box Passing");
  });

  it("lists all drills", async () => {
    const drills = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        yield* client.Drills.createDrill({ payload: minimalDrill });
        yield* client.Drills.createDrill({
          payload: { ...minimalDrill, name: "Ground Balls" },
        });
        return yield* client.Drills.listDrills();
      }),
    );
    expect(drills).toHaveLength(2);
  });

  it("updates a drill", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Drills.createDrill({
          payload: minimalDrill,
        });
        return yield* client.Drills.updateDrill({
          payload: {
            publicId: created.publicId,
            name: "Updated Drill",
          },
        });
      }),
    );
    expect(updated.name).toBe("Updated Drill");
  });

  it("deletes a drill", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        const created = yield* client.Drills.createDrill({
          payload: minimalDrill,
        });
        yield* client.Drills.deleteDrill({
          payload: { publicId: created.publicId },
        });
        return yield* client.Drills.listDrills();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent drill fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* ApiClient;
          return yield* client.Drills.getDrill({
            payload: { publicId: "AbCdEfGhIjKl" },
          });
        }),
      ),
    ).rejects.toThrow();
  });
});
