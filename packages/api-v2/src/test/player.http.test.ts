/**
 * Player HTTP API integration tests
 *
 * Tests the REST endpoints: POST /api/players/*
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

describe("POST /api/players", () => {
  it("returns empty list", async () => {
    const { status, data } = await post(s.url, "/api/players");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns all players after create", async () => {
    await post(s.url, "/api/players/create", {
      name: "Alice",
      email: "alice@test.com",
    });
    await post(s.url, "/api/players/create", {
      name: "Bob",
      email: "bob@test.com",
    });
    const { data } = await post(s.url, "/api/players");
    expect(data).toHaveLength(2);
  });
});

describe("POST /api/players/create", () => {
  it("creates a player", async () => {
    const { status, data } = await post(s.url, "/api/players/create", {
      name: "Alice",
      email: "alice@test.com",
    });
    expect(status).toBe(200);
    const player = data as Record<string, unknown>;
    expect(player.name).toBe("Alice");
    expect(player.email).toBe("alice@test.com");
    expect(player.publicId).toHaveLength(12);
    expect(player.createdAt).toBeDefined();
  });

  it("returns error for empty name", async () => {
    const { status } = await post(s.url, "/api/players/create", {
      name: "",
      email: "a@b.com",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("returns error for name > 100 chars", async () => {
    const { status } = await post(s.url, "/api/players/create", {
      name: "A".repeat(101),
      email: "a@b.com",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/players/get", () => {
  it("gets a player by publicId", async () => {
    const { data: created } = await post(s.url, "/api/players/create", {
      name: "Alice",
      email: "alice@test.com",
    });
    const publicId = (created as Record<string, unknown>).publicId as string;

    const { status, data } = await post(s.url, "/api/players/get", {
      publicId,
    });
    expect(status).toBe(200);
    expect((data as Record<string, unknown>).name).toBe("Alice");
  });

  it("returns error for nonexistent player", async () => {
    const { status } = await post(s.url, "/api/players/get", {
      publicId: "AbCdEfGhIjKl",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("returns error for invalid nanoid", async () => {
    const { status } = await post(s.url, "/api/players/get", {
      publicId: "bad",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/players/update", () => {
  it("updates player name", async () => {
    const { data: created } = await post(s.url, "/api/players/create", {
      name: "Original",
      email: "orig@test.com",
    });
    const publicId = (created as Record<string, unknown>).publicId as string;

    const { status, data } = await post(s.url, "/api/players/update", {
      publicId,
      name: "Updated",
    });
    expect(status).toBe(200);
    const player = data as Record<string, unknown>;
    expect(player.name).toBe("Updated");
    expect(player.email).toBe("orig@test.com");
  });

  it("returns error for nonexistent player", async () => {
    const { status } = await post(s.url, "/api/players/update", {
      publicId: "AbCdEfGhIjKl",
      name: "X",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/players/delete", () => {
  it("deletes a player", async () => {
    const { data: created } = await post(s.url, "/api/players/create", {
      name: "ToDelete",
      email: "del@test.com",
    });
    const publicId = (created as Record<string, unknown>).publicId as string;

    const { status } = await post(s.url, "/api/players/delete", { publicId });
    expect(status).toBe(200);

    const { data: list } = await post(s.url, "/api/players");
    expect(list).toHaveLength(0);
  });

  it("returns error for nonexistent player", async () => {
    const { status } = await post(s.url, "/api/players/delete", {
      publicId: "AbCdEfGhIjKl",
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
