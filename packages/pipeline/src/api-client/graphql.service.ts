import { Effect, type Schema } from "effect";

import { GraphQLError, type PipelineError } from "../error";
import { fetchJson, retryPipelineRequest } from "../http";

import type { GraphQLClientConfig, GraphQLRequest } from "./graphql.schema";
import { GraphQLResponse } from "./graphql.schema";
import {
  buildJsonHeaders,
  decodeClientResponse,
  resolveClientRuntimeConfig,
} from "./shared";

// Re-export for backwards compatibility
export { GraphQLError } from "../error";

export const makeGraphQLClient = (config: GraphQLClientConfig) => {
  const {
    defaultTimeoutMs: defaultTimeout,
    maxRetries,
    retryDelayMs,
  } = resolveClientRuntimeConfig(config);

  const execute = <S extends Schema.Top>(
    request: GraphQLRequest,
    dataSchema: S,
    timeoutMs?: number,
  ): Effect.Effect<S["Type"], PipelineError, S["DecodingServices"]> =>
    Effect.gen(function* () {
      const timeout = timeoutMs ?? defaultTimeout;
      const url = config.endpoint;

      const json = yield* fetchJson({
        url,
        timeoutMs: timeout,
        method: "POST",
        headers: buildJsonHeaders(config),
        body: JSON.stringify({
          query: request.query,
          variables: request.variables,
          operationName: request.operationName,
        }),
        timeoutMessage: `Request timed out after ${timeout}ms`,
        networkMessage: (error) => `Network error: ${String(error)}`,
        httpMessage: (statusCode, statusText) =>
          `HTTP ${statusCode}: ${statusText}`,
        rateLimitMessage: "Rate limited by server",
        jsonParseMessage: (error) => `Failed to parse JSON: ${String(error)}`,
      });

      const responseSchema = GraphQLResponse(dataSchema);
      const decoded = yield* decodeClientResponse(responseSchema, json, url);

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
    retryPipelineRequest(() => execute(request, dataSchema, timeoutMs), {
      maxRetries,
      retryDelayMs,
    });

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
