import { Duration, Effect, Schedule, Schema } from "effect";
import {
  HttpError,
  NetworkError,
  ParseError,
  type PipelineError,
  RateLimitError,
  TimeoutError,
} from "../error";
import { DEFAULT_PIPELINE_CONFIG } from "../config";
import type {
  RestClientConfig,
  RestRequestOptions,
  HttpMethod,
} from "./rest-client.schema";

// RateLimitError handled separately - server provides retry-after delay
const isTransientError = (error: PipelineError): boolean =>
  error._tag === "NetworkError" || error._tag === "TimeoutError";

export const makeRestClient = (config: RestClientConfig) => {
  const defaultTimeout =
    config.timeoutMs ?? DEFAULT_PIPELINE_CONFIG.defaultTimeoutMs;
  const maxRetries = config.maxRetries ?? DEFAULT_PIPELINE_CONFIG.maxRetries;
  const retryDelayMs =
    config.retryDelayMs ?? DEFAULT_PIPELINE_CONFIG.retryDelayMs;

  const buildHeaders = (
    options?: RestRequestOptions,
  ): Record<string, string> => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...config.defaultHeaders,
      ...options?.headers,
    };

    if (config.authHeader) {
      headers.authorization = config.authHeader;
    }

    return headers;
  };

  const request = <T>(
    method: HttpMethod,
    endpoint: string,
    schema: Schema.Schema<T>,
    body?: unknown,
    options?: RestRequestOptions,
  ): Effect.Effect<T, PipelineError> =>
    Effect.gen(function* () {
      const url = `${config.baseUrl}${endpoint}`;
      const timeoutMs = options?.timeoutMs ?? defaultTimeout;

      const response = yield* Effect.tryPromise({
        try: (signal) =>
          fetch(url, {
            method,
            headers: buildHeaders(options),
            body: body ? JSON.stringify(body) : undefined,
            signal,
          }),
        catch: (error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return new TimeoutError({
              message: `Request timed out after ${timeoutMs}ms`,
              url,
              timeoutMs,
            });
          }
          return new NetworkError({
            message: `Network error: ${String(error)}`,
            url,
            cause: error,
          });
        },
      }).pipe(
        Effect.timeout(Duration.millis(timeoutMs)),
        Effect.catchTag("TimeoutException", () =>
          Effect.fail(
            new TimeoutError({
              message: `Request timed out after ${timeoutMs}ms`,
              url,
              timeoutMs,
            }),
          ),
        ),
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
            method,
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
            method,
            cause: error,
          }),
      });

      const decoded = yield* Schema.decodeUnknown(schema)(json).pipe(
        Effect.mapError(
          (error) =>
            new ParseError({
              message: `Schema validation failed: ${String(error)}`,
              url,
              cause: error,
            }),
        ),
      );

      return decoded;
    });

  const transientRetrySchedule = Schedule.exponential(
    Duration.millis(retryDelayMs),
  ).pipe(
    Schedule.compose(Schedule.recurs(maxRetries)),
    Schedule.whileInput(isTransientError),
  );

  const rateLimitRetrySchedule = Schedule.exponential(
    Duration.millis(retryDelayMs),
  ).pipe(Schedule.compose(Schedule.recurs(maxRetries)));

  const requestWithRetry = <T>(
    method: HttpMethod,
    endpoint: string,
    schema: Schema.Schema<T>,
    body?: unknown,
    options?: RestRequestOptions,
  ): Effect.Effect<T, PipelineError> =>
    request(method, endpoint, schema, body, options).pipe(
      Effect.retry(transientRetrySchedule),
      Effect.catchTag("RateLimitError", (error) =>
        Effect.sleep(Duration.millis(error.retryAfterMs ?? retryDelayMs)).pipe(
          Effect.andThen(
            request(method, endpoint, schema, body, options).pipe(
              Effect.retry(rateLimitRetrySchedule),
            ),
          ),
        ),
      ),
    );

  return {
    get: <T>(
      endpoint: string,
      schema: Schema.Schema<T>,
      options?: RestRequestOptions,
    ) => requestWithRetry("GET", endpoint, schema, undefined, options),

    post: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: RestRequestOptions,
    ) => requestWithRetry("POST", endpoint, schema, body, options),

    put: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: RestRequestOptions,
    ) => requestWithRetry("PUT", endpoint, schema, body, options),

    patch: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: RestRequestOptions,
    ) => requestWithRetry("PATCH", endpoint, schema, body, options),

    delete: <T>(
      endpoint: string,
      schema: Schema.Schema<T>,
      options?: RestRequestOptions,
    ) => requestWithRetry("DELETE", endpoint, schema, undefined, options),

    requestOnce: <T>(
      method: HttpMethod,
      endpoint: string,
      schema: Schema.Schema<T>,
      body?: unknown,
      options?: RestRequestOptions,
    ) => request(method, endpoint, schema, body, options),
  } as const;
};

export type RestClient = ReturnType<typeof makeRestClient>;
