import { Duration, Effect, Schedule, Schema } from "effect";

import { DEFAULT_PIPELINE_CONFIG } from "../config";

const MAX_RETRY_WAIT_MS = 300_000; // 5 minutes max to prevent DoS via large retry-after
import {
  HttpError,
  NetworkError,
  ParseError,
  type PipelineError,
  RateLimitError,
  TimeoutError,
} from "../error";

import type {
  RestClientConfig,
  RestRequestOptions,
  HttpMethod,
} from "./rest-client.schema";

// Retry transient transport failures only.
const isTransientError = (error: PipelineError): boolean =>
  error instanceof NetworkError || error instanceof TimeoutError;

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

  const request = <S extends Schema.Top>(
    method: HttpMethod,
    endpoint: string,
    schema: S,
    body?: unknown,
    options?: RestRequestOptions,
  ): Effect.Effect<S["Type"], PipelineError, S["DecodingServices"]> =>
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
        Effect.timeoutOrElse({
          duration: Duration.millis(timeoutMs),
          orElse: () =>
            Effect.fail(
              new TimeoutError({
                message: `Request timed out after ${timeoutMs}ms`,
                url,
                timeoutMs,
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

      const decoded = yield* Schema.decodeUnknownEffect(schema)(json).pipe(
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

  const requestWithRetry = <S extends Schema.Top>(
    method: HttpMethod,
    endpoint: string,
    schema: S,
    body?: unknown,
    options?: RestRequestOptions,
  ): Effect.Effect<S["Type"], PipelineError, S["DecodingServices"]> =>
    request(method, endpoint, schema, body, options).pipe(
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
            request(method, endpoint, schema, body, options).pipe(
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
    get: <S extends Schema.Top>(
      endpoint: string,
      schema: S,
      options?: RestRequestOptions,
    ) => requestWithRetry("GET", endpoint, schema, undefined, options),

    post: <S extends Schema.Top>(
      endpoint: string,
      body: unknown,
      schema: S,
      options?: RestRequestOptions,
    ) => requestWithRetry("POST", endpoint, schema, body, options),

    put: <S extends Schema.Top>(
      endpoint: string,
      body: unknown,
      schema: S,
      options?: RestRequestOptions,
    ) => requestWithRetry("PUT", endpoint, schema, body, options),

    patch: <S extends Schema.Top>(
      endpoint: string,
      body: unknown,
      schema: S,
      options?: RestRequestOptions,
    ) => requestWithRetry("PATCH", endpoint, schema, body, options),

    delete: <S extends Schema.Top>(
      endpoint: string,
      schema: S,
      options?: RestRequestOptions,
    ) => requestWithRetry("DELETE", endpoint, schema, undefined, options),

    requestOnce: <S extends Schema.Top>(
      method: HttpMethod,
      endpoint: string,
      schema: S,
      body?: unknown,
      options?: RestRequestOptions,
    ) => request(method, endpoint, schema, body, options),
  } as const;
};

export type RestClient = ReturnType<typeof makeRestClient>;
