import { Effect, Schedule } from "effect";

import type { PipelineConfigValues } from "./config";
import { HttpError, NetworkError, TimeoutError } from "./error";
import { formatUnknownError } from "./util";

export interface FetchTextRequest {
  readonly url: string;
  readonly timeoutMs: number;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly redirect?: "follow" | "error" | "manual";
  readonly timeoutMessage: string;
  readonly networkMessage: (error: unknown) => string;
  readonly httpMessage: (statusCode: number) => string;
  readonly bodyReadMessage: (error: unknown) => string;
}

export const fetchText = Effect.fn("pipeline.fetchText")(function* (
  request: FetchTextRequest,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, request.timeoutMs);

  const requestInit = {
    method: request.method ?? "GET",
    headers: request.headers,
    signal: controller.signal,
    ...(request.redirect ? { redirect: request.redirect } : {}),
  };

  const response = yield* Effect.tryPromise({
    try: () => fetch(request.url, requestInit),
    catch: (error) => {
      if (error instanceof Error && error.name === "AbortError") {
        return new TimeoutError({
          message: request.timeoutMessage,
          url: request.url,
          timeoutMs: request.timeoutMs,
        });
      }

      return new NetworkError({
        message: request.networkMessage(error),
        url: request.url,
        cause: error,
      });
    },
  }).pipe(
    Effect.ensuring(
      Effect.sync(() => {
        clearTimeout(timeoutId);
      }),
    ),
  );

  if (response.status >= 400) {
    return yield* Effect.fail(
      new HttpError({
        message: request.httpMessage(response.status),
        url: request.url,
        method: request.method ?? "GET",
        statusCode: response.status,
      }),
    );
  }

  return yield* Effect.tryPromise({
    try: () => response.text(),
    catch: (error) =>
      new NetworkError({
        message: request.bodyReadMessage(error),
        url: request.url,
        cause: error,
      }),
  });
});

export const fetchTextWithRetry = (
  request: FetchTextRequest,
  pipelineConfig: Pick<PipelineConfigValues, "retryDelay" | "maxRetries">,
) =>
  fetchText(request).pipe(
    Effect.retry({
      schedule: Schedule.exponential(pipelineConfig.retryDelay),
      times: pipelineConfig.maxRetries,
      while: (error: HttpError | NetworkError | TimeoutError) =>
        error instanceof NetworkError || error instanceof TimeoutError,
    }),
  );

export const defaultNetworkMessage = (label: string, error: unknown) =>
  `${label} network error: ${formatUnknownError(error)}`;

export const defaultBodyReadMessage = (label: string, error: unknown) =>
  `Failed to read ${label} response body: ${formatUnknownError(error)}`;
