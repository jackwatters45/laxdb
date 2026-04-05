import { Duration, Effect, Schedule, Schema } from "effect";

import { DEFAULT_PIPELINE_CONFIG } from "../config";
import {
  GraphQLError,
  HttpError,
  NetworkError,
  ParseError,
  type PipelineError,
  RateLimitError,
  TimeoutError,
} from "../error";

import type { GraphQLClientConfig, GraphQLRequest } from "./graphql.schema";
import { GraphQLResponse } from "./graphql.schema";

// Re-export for backwards compatibility
export { GraphQLError } from "../error";

const MAX_RETRY_WAIT_MS = 300_000; // 5 minutes max to prevent DoS via large retry-after

const isTransientError = (error: PipelineError): boolean =>
  error instanceof NetworkError || error instanceof TimeoutError;

export const makeGraphQLClient = (config: GraphQLClientConfig) => {
  const defaultTimeout =
    config.timeoutMs ?? DEFAULT_PIPELINE_CONFIG.defaultTimeoutMs;
  const maxRetries = config.maxRetries ?? DEFAULT_PIPELINE_CONFIG.maxRetries;
  const retryDelayMs =
    config.retryDelayMs ?? DEFAULT_PIPELINE_CONFIG.retryDelayMs;

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

  const execute = <S extends Schema.Top>(
    request: GraphQLRequest,
    dataSchema: S,
    timeoutMs?: number,
  ): Effect.Effect<S["Type"], PipelineError, S["DecodingServices"]> =>
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
        Effect.timeoutOrElse({
          duration: Duration.millis(timeout),
          orElse: () =>
            Effect.fail(
              new TimeoutError({
                message: `Request timed out after ${timeout}ms`,
                url,
                timeoutMs: timeout,
              }),
            ),
        }),
      );

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterMs = retryAfter
          ? Number.parseInt(retryAfter, 10) * 1000
          : undefined;

        return yield* Effect.fail(
          new RateLimitError({
            message: "Rate limited by server",
            url,
            retryAfterMs,
          }),
        );
      }

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
      const decoded = yield* Schema.decodeUnknownEffect(responseSchema)(json).pipe(
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

      const data = decoded.data;
      if (data === null) {
        return yield* Effect.fail(
          new GraphQLError({
            message: "GraphQL response returned null data",
            errors: [],
          }),
        );
      }

      return data;
    });

  const executeWithRetry = <S extends Schema.Top>(
    request: GraphQLRequest,
    dataSchema: S,
    timeoutMs?: number,
  ): Effect.Effect<S["Type"], PipelineError, S["DecodingServices"]> =>
    execute(request, dataSchema, timeoutMs).pipe(
      Effect.retry({
        schedule: Schedule.exponential(Duration.millis(retryDelayMs)),
        times: maxRetries,
        while: isTransientError,
      }),
      Effect.catchTag("RateLimitError", (error) =>
        Effect.sleep(
          Duration.millis(
            Math.min(error.retryAfterMs ?? retryDelayMs, MAX_RETRY_WAIT_MS),
          ),
        ).pipe(
          Effect.andThen(
            execute(request, dataSchema, timeoutMs).pipe(
              Effect.retry({
                schedule: Schedule.exponential(Duration.millis(retryDelayMs)),
                times: maxRetries,
              }),
            ),
          ),
        ),
      ),
    );

  return {
    query: <S extends Schema.Top>(
      query: string,
      dataSchema: S,
      variables?: Record<string, unknown>,
      operationName?: string,
    ) => executeWithRetry({ query, variables, operationName }, dataSchema),

    mutation: <S extends Schema.Top>(
      mutation: string,
      dataSchema: S,
      variables?: Record<string, unknown>,
      operationName?: string,
    ) =>
      executeWithRetry(
        { query: mutation, variables, operationName },
        dataSchema,
      ),

    execute: executeWithRetry,

    executeOnce: execute,
  } as const;
};

export type GraphQLClient = ReturnType<typeof makeGraphQLClient>;
