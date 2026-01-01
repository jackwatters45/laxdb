import { Context, Duration, Effect, Layer, Schedule, Schema } from "effect";
import {
  ApiError,
  type ApiClientError,
  ApiNetworkError,
  ApiRateLimitError,
  ApiSchemaError,
  ApiTimeoutError,
} from "./api-client.error";
import type {
  ApiClientConfig,
  ApiRequestOptions,
  HttpMethod,
} from "./api-client.schema";

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

export const makeApiClient = (config: ApiClientConfig) => {
  const defaultTimeout = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const buildHeaders = (
    options?: ApiRequestOptions,
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
    options?: ApiRequestOptions,
  ): Effect.Effect<T, ApiClientError> =>
    Effect.gen(function* () {
      const url = `${config.baseUrl}${endpoint}`;
      const timeoutMs = options?.timeoutMs ?? defaultTimeout;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(url, {
            method,
            headers: buildHeaders(options),
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          }),
        catch: (error) => {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === "AbortError") {
            return new ApiTimeoutError({
              message: `Request timed out after ${timeoutMs}ms`,
              endpoint,
              timeoutMs,
            });
          }
          return new ApiNetworkError({
            message: `Network error: ${String(error)}`,
            endpoint,
            cause: error,
          });
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterMs = retryAfter
          ? Number.parseInt(retryAfter, 10) * 1000
          : undefined;

        return yield* Effect.fail(
          new ApiRateLimitError({
            message: "Rate limited by server",
            endpoint,
            retryAfterMs,
          }),
        );
      }

      if (!response.ok) {
        return yield* Effect.fail(
          new ApiError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            endpoint,
            method,
            statusCode: response.status,
          }),
        );
      }

      const json = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new ApiError({
            message: `Failed to parse JSON: ${String(error)}`,
            endpoint,
            method,
            cause: error,
          }),
      });

      const decoded = yield* Schema.decodeUnknown(schema)(json).pipe(
        Effect.mapError(
          (error) =>
            new ApiSchemaError({
              message: `Schema validation failed: ${String(error)}`,
              endpoint,
              cause: error,
            }),
        ),
      );

      return decoded;
    });

  const requestWithRetry = <T>(
    method: HttpMethod,
    endpoint: string,
    schema: Schema.Schema<T>,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Effect.Effect<T, ApiClientError> =>
    request(method, endpoint, schema, body, options).pipe(
      Effect.retry(
        Schedule.exponential(Duration.millis(DEFAULT_RETRY_DELAY_MS)).pipe(
          Schedule.compose(Schedule.recurs(DEFAULT_MAX_RETRIES)),
          Schedule.whileInput(
            (error: ApiClientError) =>
              error._tag === "ApiNetworkError" ||
              error._tag === "ApiTimeoutError",
          ),
        ),
      ),
    );

  return {
    get: <T>(
      endpoint: string,
      schema: Schema.Schema<T>,
      options?: ApiRequestOptions,
    ) => requestWithRetry("GET", endpoint, schema, undefined, options),

    post: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: ApiRequestOptions,
    ) => requestWithRetry("POST", endpoint, schema, body, options),

    put: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: ApiRequestOptions,
    ) => requestWithRetry("PUT", endpoint, schema, body, options),

    patch: <T>(
      endpoint: string,
      body: unknown,
      schema: Schema.Schema<T>,
      options?: ApiRequestOptions,
    ) => requestWithRetry("PATCH", endpoint, schema, body, options),

    delete: <T>(
      endpoint: string,
      schema: Schema.Schema<T>,
      options?: ApiRequestOptions,
    ) => requestWithRetry("DELETE", endpoint, schema, undefined, options),

    requestOnce: <T>(
      method: HttpMethod,
      endpoint: string,
      schema: Schema.Schema<T>,
      body?: unknown,
      options?: ApiRequestOptions,
    ) => request(method, endpoint, schema, body, options),
  } as const;
};

export type ApiClient = ReturnType<typeof makeApiClient>;

export class ApiClientFactory extends Context.Tag("ApiClientFactory")<
  ApiClientFactory,
  {
    readonly create: (config: ApiClientConfig) => ApiClient;
  }
>() {
  static readonly Default = Layer.succeed(ApiClientFactory, {
    create: makeApiClient,
  });
}
