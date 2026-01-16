import { Effect, Schema } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError, NetworkError, ParseError } from "../error";

import { GraphQLError, makeGraphQLClient } from "./graphql.service";

const TestDataSchema = Schema.Struct({
  user: Schema.Struct({
    id: Schema.Number,
    name: Schema.String,
  }),
});

const mockFetch = vi.fn<typeof fetch>();

describe("makeGraphQLClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createClient = (overrides?: { authHeader?: string }) =>
    makeGraphQLClient({
      endpoint: "https://api.example.com/graphql",
      authHeader: overrides?.authHeader,
    });

  const TEST_QUERY = `query GetUser($id: ID!) { user(id: $id) { id name } }`;

  describe("successful requests", () => {
    it("executes query with schema validation", async () => {
      const responseData = { data: { user: { id: 1, name: "Test User" } } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromise(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
      );

      expect(result).toEqual({ user: { id: 1, name: "Test User" } });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
          body: JSON.stringify({
            query: TEST_QUERY,
            variables: { id: "1" },
            operationName: undefined,
          }),
        }),
      );
    });

    it("executes mutation", async () => {
      const mutation = `mutation CreateUser($name: String!) { createUser(name: $name) { id name } }`;
      const responseData = { data: { user: { id: 2, name: "New User" } } };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromise(
        client.mutation(
          mutation,
          Schema.Struct({
            user: Schema.Struct({ id: Schema.Number, name: Schema.String }),
          }),
          { name: "New User" },
        ),
      );

      expect(result).toEqual({ user: { id: 2, name: "New User" } });
    });

    it("includes auth header when configured", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { user: { id: 1, name: "Test" } } }),
          {
            status: 200,
          },
        ),
      );

      const client = createClient({ authHeader: "Bearer token123" });
      await Effect.runPromise(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: "Bearer token123",
          }),
        }),
      );
    });

    it("includes operation name when provided", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { user: { id: 1, name: "Test" } } }),
          {
            status: 200,
          },
        ),
      );

      const client = createClient();
      await Effect.runPromise(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }, "GetUser"),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"operationName":"GetUser"'),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("returns NetworkError on fetch failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network failed"));

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
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
        new Response("Internal Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof HttpError) {
          expect(error.error.message).toContain("HTTP 500");
          expect(error.error.statusCode).toBe(500);
        }
      }
    });

    it("returns HttpError on invalid JSON response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("not json", { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
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

    it("returns ParseError on invalid response shape", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { wrong: "shape" } }), {
          status: 200,
        }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
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

    it("returns GraphQLError when response contains errors", async () => {
      const responseWithErrors = {
        data: null,
        errors: [
          { message: "User not found", path: ["user"] },
          { message: "Access denied", path: ["user", "email"] },
        ],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseWithErrors), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "999" }),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof GraphQLError) {
          expect(error.error.message).toContain("User not found");
          expect(error.error.message).toContain("Access denied");
          expect(error.error.errors).toHaveLength(2);
          expect(error.error.errors[0]?.path).toEqual(["user"]);
        }
      }
    });

    it("returns GraphQLError when data is null without errors", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: null }), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof GraphQLError) {
          expect(error.error.message).toContain("null data");
          expect(error.error.errors).toHaveLength(0);
        }
      }
    });

    it("returns GraphQLError with partial data and errors", async () => {
      const partialResponse = {
        data: { user: { id: 1, name: "Test" } },
        errors: [{ message: "Deprecated field accessed" }],
      };
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(partialResponse), { status: 200 }),
      );

      const client = createClient();
      const result = await Effect.runPromiseExit(
        client.query(TEST_QUERY, TestDataSchema, { id: "1" }),
      );

      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure") {
        const error = result.cause;
        if (error._tag === "Fail" && error.error instanceof GraphQLError) {
          expect(error.error.message).toContain("Deprecated field accessed");
        }
      }
    });
  });

  describe("execute method", () => {
    it("accepts full GraphQL request object", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { user: { id: 1, name: "Test" } } }),
          {
            status: 200,
          },
        ),
      );

      const client = createClient();
      const result = await Effect.runPromise(
        client.execute(
          {
            query: TEST_QUERY,
            variables: { id: "1" },
            operationName: "GetUser",
          },
          TestDataSchema,
        ),
      );

      expect(result).toEqual({ user: { id: 1, name: "Test" } });
    });
  });
});
