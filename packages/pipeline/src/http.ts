import { Duration, Effect, Schedule } from "effect";

import type { PipelineConfigValues } from "./config";
import {
  HttpError,
  NetworkError,
  type PipelineError,
  RateLimitError,
  TimeoutError,
} from "./error";
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

export interface ReadResponseJsonRequest {
  readonly url: string;
  readonly method: string;
  readonly jsonParseMessage: (error: unknown) => string;
}

export interface FetchJsonRequest {
  readonly url: string;
  readonly timeoutMs: number;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly redirect?: "follow" | "error" | "manual";
  readonly body?: string;
  readonly timeoutMessage: string;
  readonly networkMessage: (error: unknown) => string;
  readonly httpMessage: (statusCode: number, statusText: string) => string;
  readonly rateLimitMessage: string;
  readonly jsonParseMessage: (error: unknown) => string;
}

export const fetchResponse = <ETimeout, ENetwork>(
  request: FetchResponseRequest<ETimeout, ENetwork> & {
    readonly body?: string;
  },
): Effect.Effect<Response, ETimeout | ENetwork> =>
  Effect.gen(function* () {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, request.timeoutMs);

    const requestInit = {
      method: request.method ?? "GET",
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.body ? { body: request.body } : {}),
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

export const readResponseJson = (
  response: Response,
  request: ReadResponseJsonRequest,
): Effect.Effect<unknown, HttpError> =>
  Effect.tryPromise({
    try: () => response.json(),
    catch: (error) =>
      new HttpError({
        message: request.jsonParseMessage(error),
        url: request.url,
        method: request.method,
        cause: error,
      }),
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

export const fetchJson = (
  request: FetchJsonRequest,
): Effect.Effect<
  unknown,
  HttpError | NetworkError | TimeoutError | RateLimitError
> =>
  Effect.gen(function* () {
    const method = request.method ?? "GET";

    const response = yield* fetchResponse({
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
      ...(request.headers ? { headers: request.headers } : {}),
      ...(request.redirect ? { redirect: request.redirect } : {}),
      ...(request.body ? { body: request.body } : {}),
      ...(request.method ? { method: request.method } : {}),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs = retryAfter
        ? Number.parseInt(retryAfter, 10) * 1000
        : undefined;

      return yield* Effect.fail(
        new RateLimitError({
          message: request.rateLimitMessage,
          url: request.url,
          retryAfterMs,
        }),
      );
    }

    if (!response.ok) {
      return yield* Effect.fail(
        new HttpError({
          message: request.httpMessage(response.status, response.statusText),
          url: request.url,
          method,
          statusCode: response.status,
        }),
      );
    }

    return yield* readResponseJson(response, {
      url: request.url,
      method,
      jsonParseMessage: request.jsonParseMessage,
    });
  });

export const retryPipelineRequest = <A, R>(
  effect: () => Effect.Effect<A, PipelineError, R>,
  options: Pick<PipelineConfigValues, "maxRetries"> & {
    readonly retryDelayMs: number;
  },
): Effect.Effect<A, PipelineError, R> =>
  effect().pipe(
    Effect.retry({
      schedule: Schedule.exponential(Duration.millis(options.retryDelayMs)),
      times: options.maxRetries,
      while: (error: PipelineError) =>
        error instanceof NetworkError || error instanceof TimeoutError,
    }),
    Effect.catchTag("RateLimitError", (error) =>
      Effect.sleep(
        Duration.millis(error.retryAfterMs ?? options.retryDelayMs),
      ).pipe(
        Effect.andThen(
          effect().pipe(
            Effect.retry({
              schedule: Schedule.exponential(
                Duration.millis(options.retryDelayMs),
              ),
              times: options.maxRetries,
            }),
          ),
        ),
      ),
    ),
  );

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
