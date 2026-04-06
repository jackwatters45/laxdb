import { Effect, Schema } from "effect";

import { DEFAULT_PIPELINE_CONFIG } from "../config";
import { ParseError, type PipelineError } from "../error";
import { fetchJson, retryPipelineRequest } from "../http";

import type {
  RestClientConfig,
  RestRequestOptions,
  HttpMethod,
} from "./rest-client.schema";

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

      const json = yield* fetchJson({
        url,
        timeoutMs,
        method,
        headers: buildHeaders(options),
        ...(body ? { body: JSON.stringify(body) } : {}),
        timeoutMessage: `Request timed out after ${timeoutMs}ms`,
        networkMessage: (error) => `Network error: ${String(error)}`,
        httpMessage: (statusCode, statusText) =>
          `HTTP ${statusCode}: ${statusText}`,
        rateLimitMessage: "Rate limited by server",
        jsonParseMessage: (error) => `Failed to parse JSON: ${String(error)}`,
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
    retryPipelineRequest(
      () => request(method, endpoint, schema, body, options),
      {
        maxRetries,
        retryDelayMs,
      },
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
