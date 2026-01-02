import { Duration, Effect, Schema } from "effect";
import {
  HttpError,
  NetworkError,
  ParseError,
  type PipelineError,
  TimeoutError,
} from "../error";
import type { GraphQLClientConfig, GraphQLRequest } from "./graphql.schema";
import { GraphQLResponse } from "./graphql.schema";

const DEFAULT_TIMEOUT_MS = 30000;

export class GraphQLError extends Schema.TaggedError<GraphQLError>(
  "GraphQLError",
)("GraphQLError", {
  message: Schema.String,
  errors: Schema.Array(
    Schema.Struct({
      message: Schema.String,
      path: Schema.optional(
        Schema.Array(Schema.Union(Schema.String, Schema.Number)),
      ),
    }),
  ),
}) {}

export const makeGraphQLClient = (config: GraphQLClientConfig) => {
  const defaultTimeout = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...config.defaultHeaders,
    };

    if (config.authHeader) {
      headers.authorization = config.authHeader;
    }

    return headers;
  };

  const execute = <A, I>(
    request: GraphQLRequest,
    dataSchema: Schema.Schema<A, I>,
    timeoutMs?: number,
  ): Effect.Effect<A, PipelineError | GraphQLError> =>
    Effect.gen(function* () {
      const timeout = timeoutMs ?? defaultTimeout;
      const url = config.endpoint;

      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetch(url, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({
              query: request.query,
              variables: request.variables,
              operationName: request.operationName,
            }),
            signal,
          }),
        catch: (error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return new TimeoutError({
              message: `Request timed out after ${timeout}ms`,
              url,
              timeoutMs: timeout,
            });
          }
          return new NetworkError({
            message: `Network error: ${String(error)}`,
            url,
            cause: error,
          });
        },
      }).pipe(
        Effect.timeout(Duration.millis(timeout)),
        Effect.catchTag("TimeoutException", () =>
          Effect.fail(
            new TimeoutError({
              message: `Request timed out after ${timeout}ms`,
              url,
              timeoutMs: timeout,
            }),
          ),
        ),
      );

      if (!response.ok) {
        return yield* Effect.fail(
          new HttpError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            url,
            method: "POST",
            statusCode: response.status,
          }),
        );
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new HttpError({
            message: `Failed to parse JSON: ${String(error)}`,
            url,
            method: "POST",
            cause: error,
          }),
      });

      const responseSchema = GraphQLResponse(dataSchema);
      const decoded = yield* Schema.decodeUnknown(responseSchema)(json).pipe(
        Effect.mapError(
          (error) =>
            new ParseError({
              message: `Schema validation failed: ${String(error)}`,
              url,
              cause: error,
            }),
        ),
      );

      if (decoded.errors && decoded.errors.length > 0) {
        return yield* Effect.fail(
          new GraphQLError({
            message: decoded.errors.map((e) => e.message).join("; "),
            errors: decoded.errors.map((e) => ({
              message: e.message,
              path: e.path,
            })),
          }),
        );
      }

      if (decoded.data === null) {
        return yield* Effect.fail(
          new GraphQLError({
            message: "GraphQL response returned null data",
            errors: [],
          }),
        );
      }

      return decoded.data;
    });

  return {
    query: <A, I>(
      query: string,
      dataSchema: Schema.Schema<A, I>,
      variables?: Record<string, unknown>,
      operationName?: string,
    ) => execute({ query, variables, operationName }, dataSchema),

    mutation: <A, I>(
      mutation: string,
      dataSchema: Schema.Schema<A, I>,
      variables?: Record<string, unknown>,
      operationName?: string,
    ) => execute({ query: mutation, variables, operationName }, dataSchema),

    execute,
  } as const;
};

export type GraphQLClient = ReturnType<typeof makeGraphQLClient>;
