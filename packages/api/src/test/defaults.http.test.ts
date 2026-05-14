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

const practiceScope = {
  scopeType: "global",
  scopeId: "global",
  namespace: "practice",
};

describe("POST /api/defaults/get", () => {
  it("returns an empty object for an unset namespace", async () => {
    const { status, data } = await post(
      s.url,
      "/api/defaults/get",
      practiceScope,
    );
    expect(status).toBe(200);
    expect(data).toEqual({});
  });

  it("returns 400 for an invalid scope type", async () => {
    const { status } = await post(s.url, "/api/defaults/get", {
      ...practiceScope,
      scopeType: "league",
    });
    expect(status).toBe(400);
  });
});

describe("POST /api/defaults/patch", () => {
  it("upserts and merges namespace values", async () => {
    const first = await post(s.url, "/api/defaults/patch", {
      ...practiceScope,
      values: { durationMinutes: 90 },
    });
    expect(first.status).toBe(200);
    expect(first.data).toEqual({ durationMinutes: 90 });

    const second = await post(s.url, "/api/defaults/patch", {
      ...practiceScope,
      values: { location: "Main Field" },
    });
    expect(second.status).toBe(200);
    expect(second.data).toEqual({
      durationMinutes: 90,
      location: "Main Field",
    });
  });
});
