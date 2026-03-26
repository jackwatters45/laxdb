/**
 * Drill CLI integration tests
 *
 * Tests the full RPC round-trip: client → HTTP → handler → service → DB
 */

import { RpcApiClient } from "@laxdb/api-v2/client";
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

describe("Drill RPC", () => {
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
        const client = yield* RpcApiClient;
        return yield* client.DrillList();
      }),
    );
    expect(drills).toEqual([]);
  });

  it("creates a drill", async () => {
    const drill = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillCreate(minimalDrill);
      }),
    );
    expect(drill.name).toBe("Box Passing");
    expect(drill.publicId).toHaveLength(12);
  });

  it("creates a drill with all fields", async () => {
    const drill = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        return yield* client.DrillCreate({
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
        const client = yield* RpcApiClient;
        const created = yield* client.DrillCreate(minimalDrill);
        return yield* client.DrillGet({ publicId: created.publicId });
      }),
    );
    expect(found.name).toBe("Box Passing");
  });

  it("lists all drills", async () => {
    const drills = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        yield* client.DrillCreate(minimalDrill);
        yield* client.DrillCreate({ ...minimalDrill, name: "Ground Balls" });
        return yield* client.DrillList();
      }),
    );
    expect(drills).toHaveLength(2);
  });

  it("updates a drill", async () => {
    const updated = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.DrillCreate(minimalDrill);
        return yield* client.DrillUpdate({
          publicId: created.publicId,
          name: "Updated Drill",
        });
      }),
    );
    expect(updated.name).toBe("Updated Drill");
  });

  it("deletes a drill", async () => {
    const remaining = await run(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const created = yield* client.DrillCreate(minimalDrill);
        yield* client.DrillDelete({ publicId: created.publicId });
        return yield* client.DrillList();
      }),
    );
    expect(remaining).toHaveLength(0);
  });

  it("get nonexistent drill fails", async () => {
    await expect(
      run(
        Effect.gen(function* () {
          const client = yield* RpcApiClient;
          return yield* client.DrillGet({ publicId: "AbCdEfGhIjKl" });
        }),
      ),
    ).rejects.toThrow();
  });
});
