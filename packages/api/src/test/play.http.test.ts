import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@effect/vitest";

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

const minimalPlay = {
  name: "Invert 2-3-1",
  category: "offense",
  formation: null,
  description: null,
  personnelNotes: null,
  diagramUrl: null,
  videoUrl: null,
};

describe("POST /api/plays", () => {
  it("returns empty list", async () => {
    const { status, data } = await post(s.url, "/api/plays");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns all plays after create", async () => {
    await post(s.url, "/api/plays/create", minimalPlay);
    await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "Clear Pressure",
      category: "clear",
    });

    const { status, data } = await post(s.url, "/api/plays");

    expect(status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

describe("POST /api/plays/create", () => {
  it("creates a play with minimal fields", async () => {
    const { status, data } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Invert 2-3-1");
    expect(play.publicId).toHaveLength(12);
    expect(play.tags).toEqual([]);
  });

  it("creates a play with all fields", async () => {
    const { status, data } = await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "Ride Red",
      category: "ride",
      formation: "10-man",
      description: "Jump the first pass.",
      personnelNotes: "Long-stick middie triggers.",
      tags: ["pressure", "sideline"],
      diagramUrl: "https://example.com/ride.png",
      videoUrl: "https://example.com/ride.mp4",
    });

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Ride Red");
    expect(play.category).toBe("ride");
    expect(play.formation).toBe("10-man");
    expect(play.tags).toEqual(["pressure", "sideline"]);
  });

  it("returns error for empty name", async () => {
    const { status } = await post(s.url, "/api/plays/create", {
      ...minimalPlay,
      name: "",
    });

    expect(status).toBe(400);
  });
});

describe("POST /api/plays/get", () => {
  it("gets a play by publicId", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/get", { publicId });

    expect(status).toBe(200);
    expect(expectRecord(data).name).toBe("Invert 2-3-1");
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/get", {
      publicId: "AbCdEfGhIjKl",
    });

    expect(status).toBe(404);
  });
});

describe("POST /api/plays/update", () => {
  it("updates a play", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/update", {
      publicId,
      name: "Updated Play",
      category: "transition",
      tags: ["fast-break"],
    });

    expect(status).toBe(200);
    const play = expectRecord(data);
    expect(play.name).toBe("Updated Play");
    expect(play.category).toBe("transition");
    expect(play.tags).toEqual(["fast-break"]);
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/update", {
      publicId: "AbCdEfGhIjKl",
      name: "Missing",
    });

    expect(status).toBe(404);
  });
});

describe("POST /api/plays/delete", () => {
  it("deletes a play", async () => {
    const { data: created } = await post(
      s.url,
      "/api/plays/create",
      minimalPlay,
    );
    const publicId = expectStringProp(created, "publicId");

    const { status, data } = await post(s.url, "/api/plays/delete", {
      publicId,
    });
    const afterDelete = await post(s.url, "/api/plays/get", { publicId });

    expect(status).toBe(200);
    expect(expectRecord(data).publicId).toBe(publicId);
    expect(afterDelete.status).toBe(404);
  });

  it("returns error for nonexistent play", async () => {
    const { status } = await post(s.url, "/api/plays/delete", {
      publicId: "AbCdEfGhIjKl",
    });

    expect(status).toBe(404);
  });
});
