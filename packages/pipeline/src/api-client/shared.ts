import { Effect, Schema } from "effect";

import { DEFAULT_PIPELINE_CONFIG } from "../config";
import { ParseError } from "../error";

export interface SharedClientConfig {
  readonly defaultHeaders?: Readonly<Record<string, string>> | undefined;
  readonly authHeader?: string | undefined;
  readonly timeoutMs?: number | undefined;
  readonly maxRetries?: number | undefined;
  readonly retryDelayMs?: number | undefined;
}

export interface ClientRuntimeConfig {
  readonly defaultTimeoutMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

export const resolveClientRuntimeConfig = (
  config: SharedClientConfig,
): ClientRuntimeConfig => ({
  defaultTimeoutMs:
    config.timeoutMs ?? DEFAULT_PIPELINE_CONFIG.defaultTimeoutMs,
  maxRetries: config.maxRetries ?? DEFAULT_PIPELINE_CONFIG.maxRetries,
  retryDelayMs: config.retryDelayMs ?? DEFAULT_PIPELINE_CONFIG.retryDelayMs,
});

export const buildJsonHeaders = (
  config: Pick<SharedClientConfig, "defaultHeaders" | "authHeader">,
  headers?: Readonly<Record<string, string>>,
): Record<string, string> => {
  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    ...config.defaultHeaders,
    ...headers,
  };

  if (config.authHeader) {
    requestHeaders.authorization = config.authHeader;
  }

  return requestHeaders;
};

export const decodeClientResponse = <S extends Schema.Top>(
  schema: S,
  input: unknown,
  url: string,
): Effect.Effect<S["Type"], ParseError, S["DecodingServices"]> =>
  Schema.decodeUnknownEffect(schema)(input).pipe(
    Effect.mapError(
      (error) =>
        new ParseError({
          message: `Schema validation failed: ${String(error)}`,
          url,
          cause: error,
        }),
    ),
  );
