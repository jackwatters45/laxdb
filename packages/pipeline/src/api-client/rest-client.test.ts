import { Effect, Schema } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError, NetworkError, ParseError, RateLimitError } from "../error";
import { makeRestClient } from "./rest-client.service";

const TestResponse = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});

const mockFetch = vi.fn<typeof fetch>();

describe("makeRestClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createClient = (overrides?: { authHeader?: string }) =>
    makeRestClient({
      baseUrl: "https://api.example.com",
      authHeader: overrides?.authHeader,
    });

  describe("successful requests", () => {
    it("GET request with schema validation", async () => {
      const responseData = { id: 1, name: "Test" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromise(
        client.get("/users/1", TestResponse),
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users/1",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
        }),
      );
    });

    it("POST request with body", async () => {
      const responseData = { id: 2, name: "Created" };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), { status: 201 }),
      );

      const client = createClient();
      const result = await Effect.runPromise(
        client.post("/users", { name: "Created" }, TestResponse),
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Created" }),
        }),
      );
    });

    it("includes auth header when configured", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, name: "Test" }), { status: 200 }),
      );

      const client = createClient({ authHeader: "Bearer token123" });
      await Effect.runPromise(client.get("/users/1", TestResponse));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: "Bearer token123",
          }),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("returns NetworkError on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network failed"));

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.requestOnce("GET", "/users/1", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(NetworkError);
          expect(error.error.message).toContain("Network error");
        }
      }
    });

    it("returns HttpError on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Not Found", { status: 404, statusText: "Not Found" }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.requestOnce("GET", "/users/999", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof HttpError) {
          expect(error.error.message).toContain("HTTP 404");
          expect(error.error.statusCode).toBe(404);
        }
      }
    });

    it("returns RateLimitError on 429 response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Too Many Requests", {
          status: 429,
          headers: { "retry-after": "60" },
        }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.requestOnce("GET", "/users", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof RateLimitError) {
          expect(error.error.retryAfterMs).toBe(60000);
        }
      }
    });

    it("returns ParseError on invalid response shape", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ wrong: "shape" }), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.requestOnce("GET", "/users/1", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(ParseError);
          expect(error.error.message).toContain("Schema validation failed");
        }
      }
    });

    it("returns HttpError on invalid JSON response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("not json", { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.requestOnce("GET", "/users/1", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(HttpError);
          expect(error.error.message).toContain("Failed to parse JSON");
        }
      }
    });
  });

  describe("retry behavior", () => {
    it("retries on network error", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network failed"))
        .mockRejectedValueOnce(new Error("Network failed again"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1, name: "Success" }), {
            status: 200,
          }),
        );

      const client = createClient();
      const result = await Effect.runPromise(
        client.get("/users/1", TestResponse),
      );

      expect(result).toEqual({ id: 1, name: "Success" });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("does not retry on 4xx errors", async () => {
      mockFetch.mockResolvedValue(
        new Response("Bad Request", { status: 400, statusText: "Bad Request" }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.get("/users/1", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry on schema validation errors", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ wrong: "shape" }), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.get("/users/1", TestResponse),
      );

      expect(result._tag).toBe("Failure");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: "Test" }), { status: 200 }),
      );
    });

    it("PUT request", async () => {
      const client = createClient();
      await Effect.runPromise(
        client.put("/users/1", { name: "Updated" }, TestResponse),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("PATCH request", async () => {
      const client = createClient();
      await Effect.runPromise(
        client.patch("/users/1", { name: "Patched" }, TestResponse),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    it("DELETE request", async () => {
      const client = createClient();
      await Effect.runPromise(client.delete("/users/1", TestResponse));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });
});
