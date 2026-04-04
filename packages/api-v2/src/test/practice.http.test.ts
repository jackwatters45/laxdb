/**
 * Practice HTTP API integration tests
 *
 * Tests the REST endpoints: POST /api/practices/*
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  post,
  startTestServer,
  truncateAllTables,
  type TestServer,
} from "./server";

let s: TestServer;

beforeAll(async () => {
  s = await startTestServer();
});
afterAll(async () => {
  await s?.cleanup();
});
beforeEach(async () => {
  await truncateAllTables();
});

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

// Helper to create a practice and return its publicId
async function createPractice(
  overrides?: Record<string, unknown>,
): Promise<string> {
  const { data } = await post(s.url, "/api/practices/create", {
    ...minimalPractice,
    ...overrides,
  });
  return (data as Record<string, unknown>).publicId as string;
}

describe("POST /api/practices (CRUD)", () => {
  it("returns empty list", async () => {
    const { status, data } = await post(s.url, "/api/practices");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("creates a practice", async () => {
    const { status, data } = await post(s.url, "/api/practices/create", {
      ...minimalPractice,
      name: "Morning Practice",
      durationMinutes: 90,
      location: "Main Field",
    });
    expect(status).toBe(200);
    const practice = data as Record<string, unknown>;
    expect(practice.name).toBe("Morning Practice");
    expect(practice.durationMinutes).toBe(90);
    expect(practice.location).toBe("Main Field");
    expect(practice.status).toBe("draft");
    expect(practice.publicId).toHaveLength(12);
  });

  it("gets a practice by publicId", async () => {
    const publicId = await createPractice({ name: "Test" });
    const { status, data } = await post(s.url, "/api/practices/get", {
      publicId,
    });
    expect(status).toBe(200);
    expect((data as Record<string, unknown>).name).toBe("Test");
  });

  it("lists all practices", async () => {
    await createPractice({ name: "A" });
    await createPractice({ name: "B" });
    const { data } = await post(s.url, "/api/practices");
    expect(data).toHaveLength(2);
  });

  it("updates a practice", async () => {
    const publicId = await createPractice();
    const { status, data } = await post(s.url, "/api/practices/update", {
      publicId,
      name: "Updated",
      location: "Indoor",
    });
    expect(status).toBe(200);
    const practice = data as Record<string, unknown>;
    expect(practice.name).toBe("Updated");
    expect(practice.location).toBe("Indoor");
  });

  it("deletes a practice", async () => {
    const publicId = await createPractice();
    const { status } = await post(s.url, "/api/practices/delete", {
      publicId,
    });
    expect(status).toBe(200);
    const { data } = await post(s.url, "/api/practices");
    expect(data).toHaveLength(0);
  });

  it("returns error for nonexistent practice", async () => {
    const { status } = await post(s.url, "/api/practices/get", {
      publicId: "AbCdEfGhIjKl",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/practices/items", () => {
  it("adds an item to a practice", async () => {
    const publicId = await createPractice();
    const { status, data } = await post(s.url, "/api/practices/items/add", {
      practicePublicId: publicId,
      type: "warmup",
    });
    expect(status).toBe(200);
    const item = data as Record<string, unknown>;
    expect(item.type).toBe("warmup");
    expect(item.publicId).toHaveLength(12);
  });

  it("adds a drill item", async () => {
    const practiceId = await createPractice();
    const { data: drillData } = await post(
      s.url,
      "/api/drills/create",
      minimalDrill,
    );
    const drillId = (drillData as Record<string, unknown>).publicId as string;

    const { status, data } = await post(s.url, "/api/practices/items/add", {
      practicePublicId: practiceId,
      type: "drill",
      drillPublicId: drillId,
    });
    expect(status).toBe(200);
    expect((data as Record<string, unknown>).type).toBe("drill");
  });

  it("lists items for a practice", async () => {
    const publicId = await createPractice();
    await post(s.url, "/api/practices/items/add", {
      practicePublicId: publicId,
      type: "warmup",
    });
    await post(s.url, "/api/practices/items/add", {
      practicePublicId: publicId,
      type: "cooldown",
    });
    const { status, data } = await post(s.url, "/api/practices/items", {
      practicePublicId: publicId,
    });
    expect(status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it("removes an item", async () => {
    const practiceId = await createPractice();
    const { data: itemData } = await post(s.url, "/api/practices/items/add", {
      practicePublicId: practiceId,
      type: "warmup",
    });
    const itemId = (itemData as Record<string, unknown>).publicId as string;

    const { status } = await post(s.url, "/api/practices/items/remove", {
      publicId: itemId,
    });
    expect(status).toBe(200);

    const { data: items } = await post(s.url, "/api/practices/items", {
      practicePublicId: practiceId,
    });
    expect(items).toHaveLength(0);
  });
});

describe("POST /api/practices/edges", () => {
  it("replaces and lists graph edges", async () => {
    const practiceId = await createPractice();
    const { data: warmupData } = await post(s.url, "/api/practices/items/add", {
      practicePublicId: practiceId,
      type: "warmup",
      orderIndex: 0,
    });
    const { data: splitData } = await post(s.url, "/api/practices/items/add", {
      practicePublicId: practiceId,
      type: "activity",
      variant: "split",
      orderIndex: 1,
    });

    const warmupId = (warmupData as Record<string, unknown>).publicId as string;
    const splitId = (splitData as Record<string, unknown>).publicId as string;

    const replace = await post(s.url, "/api/practices/edges/replace", {
      practicePublicId: practiceId,
      edges: [
        {
          sourcePublicId: warmupId,
          targetPublicId: splitId,
          label: "Offense",
        },
      ],
    });
    expect(replace.status).toBe(200);

    const { status, data } = await post(s.url, "/api/practices/edges", {
      practicePublicId: practiceId,
    });
    expect(status).toBe(200);
    expect(data).toHaveLength(1);
    expect((data as Array<Record<string, unknown>>)[0]?.label).toBe("Offense");
  });
});

describe("POST /api/practices/review", () => {
  it("creates a review", async () => {
    const publicId = await createPractice();
    const { status, data } = await post(s.url, "/api/practices/review/create", {
      practicePublicId: publicId,
      wentWell: "Good energy",
      needsImprovement: "Transitions",
      notes: null,
    });
    expect(status).toBe(200);
    const review = data as Record<string, unknown>;
    expect(review.wentWell).toBe("Good energy");
    expect(review.needsImprovement).toBe("Transitions");
  });

  it("gets a review", async () => {
    const publicId = await createPractice();
    await post(s.url, "/api/practices/review/create", {
      practicePublicId: publicId,
      wentWell: "Passing",
      needsImprovement: null,
      notes: null,
    });
    const { status, data } = await post(s.url, "/api/practices/review/get", {
      practicePublicId: publicId,
    });
    expect(status).toBe(200);
    expect((data as Record<string, unknown>).wentWell).toBe("Passing");
  });

  it("updates a review", async () => {
    const publicId = await createPractice();
    await post(s.url, "/api/practices/review/create", {
      practicePublicId: publicId,
      wentWell: "Original",
      needsImprovement: null,
      notes: null,
    });
    const { status, data } = await post(s.url, "/api/practices/review/update", {
      practicePublicId: publicId,
      wentWell: "Updated",
    });
    expect(status).toBe(200);
    expect((data as Record<string, unknown>).wentWell).toBe("Updated");
  });

  it("returns error for nonexistent review", async () => {
    const publicId = await createPractice();
    const { status } = await post(s.url, "/api/practices/review/get", {
      practicePublicId: publicId,
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
