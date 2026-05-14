import { afterAll, beforeAll, describe, expect, it } from "@effect/vitest";

import { post, startTestServer, type TestServer } from "./server";

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server?.cleanup();
});

describe("API smoke integration", () => {
  it("serves the health check", async () => {
    const response = await fetch(`${server.url}/health`);

    await expect(response.text()).resolves.toBe("OK");
    expect(response.status).toBe(200);
  });

  it("boots the HTTP API with the test database wiring", async () => {
    const response = await post(server.url, "/api/drills");

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });
});
