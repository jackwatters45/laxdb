/**
 * Drill HTTP API integration tests
 *
 * Tests the REST endpoints: POST /api/drills/*
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { expectRecord, expectStringProp } from "./assertions";
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

describe("POST /api/drills", () => {
  it("returns empty list", async () => {
    const { status, data } = await post(s.url, "/api/drills");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns all drills after create", async () => {
    await post(s.url, "/api/drills/create", minimalDrill);
    await post(s.url, "/api/drills/create", {
      ...minimalDrill,
      name: "Ground Balls",
    });
    const { data } = await post(s.url, "/api/drills");
    expect(data).toHaveLength(2);
  });
});

describe("POST /api/drills/create", () => {
  it("creates a drill with minimal fields", async () => {
    const { status, data } = await post(
      s.url,
      "/api/drills/create",
      minimalDrill,
    );
    expect(status).toBe(200);
    const drill = expectRecord(data);
    expect(drill.name).toBe("Box Passing");
    expect(drill.publicId).toHaveLength(12);
  });

  it("creates a drill with all fields", async () => {
    const { status, data } = await post(s.url, "/api/drills/create", {
      ...minimalDrill,
      name: "Full Drill",
      subtitle: "A subtitle",
      description: "Detailed description",
      intensity: "high",
      contact: true,
      competitive: false,
      playerCount: 12,
      durationMinutes: 15,
      fieldSpace: "half-field",
      equipment: ["sticks", "balls"],
      coachNotes: "Focus on form",
    });
    expect(status).toBe(200);
    const drill = expectRecord(data);
    expect(drill.name).toBe("Full Drill");
    expect(drill.intensity).toBe("high");
    expect(drill.contact).toBe(true);
    expect(drill.playerCount).toBe(12);
  });

  it("returns error for empty name", async () => {
    const { status } = await post(s.url, "/api/drills/create", {
      ...minimalDrill,
      name: "",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/drills/get", () => {
  it("gets a drill by publicId", async () => {
    const { data: created } = await post(
      s.url,
      "/api/drills/create",
      minimalDrill,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/drills/get", { publicId });
    expect(status).toBe(200);
    expect(expectRecord(data).name).toBe("Box Passing");
  });

  it("returns error for nonexistent drill", async () => {
    const { status } = await post(s.url, "/api/drills/get", {
      publicId: "AbCdEfGhIjKl",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/drills/update", () => {
  it("updates drill name", async () => {
    const { data: created } = await post(
      s.url,
      "/api/drills/create",
      minimalDrill,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/drills/update", {
      publicId,
      name: "Updated Drill",
    });
    expect(status).toBe(200);
    expect(expectRecord(data).name).toBe("Updated Drill");
  });

  it("returns error for nonexistent drill", async () => {
    const { status } = await post(s.url, "/api/drills/update", {
      publicId: "AbCdEfGhIjKl",
      name: "X",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/drills/delete", () => {
  it("deletes a drill", async () => {
    const { data: created } = await post(
      s.url,
      "/api/drills/create",
      minimalDrill,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status } = await post(s.url, "/api/drills/delete", { publicId });
    expect(status).toBe(200);

    const { data: list } = await post(s.url, "/api/drills");
    expect(list).toHaveLength(0);
  });

  it("returns error for nonexistent drill", async () => {
    const { status } = await post(s.url, "/api/drills/delete", {
      publicId: "AbCdEfGhIjKl",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
