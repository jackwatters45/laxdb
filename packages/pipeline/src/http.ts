import { Effect, Schedule } from "effect";

import type { PipelineConfigValues } from "./config";
import { HttpError, NetworkError, TimeoutError } from "./error";
import { formatUnknownError } from "./util";

export interface FetchResponseRequest<ETimeout, ENetwork> {
  readonly url: string;
  readonly timeoutMs: number;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly redirect?: "follow" | "error" | "manual";
  readonly timeoutError: (url: string, timeoutMs: number) => ETimeout;
  readonly networkError: (url: string, error: unknown) => ENetwork;
}

export interface ReadResponseTextRequest<EBodyRead> {
  readonly url: string;
  readonly bodyReadError: (url: string, error: unknown) => EBodyRead;
}

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

export const fetchResponse = <ETimeout, ENetwork>(
  request: FetchResponseRequest<ETimeout, ENetwork>,
): Effect.Effect<Response, ETimeout | ENetwork> =>
  Effect.gen(function* () {
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

    return yield* Effect.tryPromise({
      try: () => fetch(request.url, requestInit),
      catch: (error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return request.timeoutError(request.url, request.timeoutMs);
        }

        return request.networkError(request.url, error);
      },
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          clearTimeout(timeoutId);
        }),
      ),
    );
  });

export const readResponseText = <EBodyRead>(
  response: Response,
  request: ReadResponseTextRequest<EBodyRead>,
): Effect.Effect<string, EBodyRead> =>
  Effect.tryPromise({
    try: () => response.text(),
    catch: (error) => request.bodyReadError(request.url, error),
  });

export const fetchText = (
  request: FetchTextRequest,
): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
  Effect.gen(function* () {
    const responseRequest: FetchResponseRequest<TimeoutError, NetworkError> = {
      url: request.url,
      timeoutMs: request.timeoutMs,
      timeoutError: (url, timeoutMs) =>
        new TimeoutError({
          message: request.timeoutMessage,
          url,
          timeoutMs,
        }),
      networkError: (url, error) =>
        new NetworkError({
          message: request.networkMessage(error),
          url,
          cause: error,
        }),
      ...(request.method ? { method: request.method } : {}),
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.redirect ? { redirect: request.redirect } : {}),
    };

    const response = yield* fetchResponse(responseRequest);

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

    return yield* readResponseText(response, {
      url: request.url,
      bodyReadError: (url, error) =>
        new NetworkError({
          message: request.bodyReadMessage(error),
          url,
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
