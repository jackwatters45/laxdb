import { Effect, Schedule } from "effect";

import { PipelineConfig } from "../config";

import {
  ScraperHttpError,
  ScraperNetworkError,
  ScraperRateLimitError,
  ScraperTimeoutError,
} from "./scraper.error";
import type { ScrapeRequest, ScrapeResponse } from "./scraper.schema";

type ScraperError =
  | ScraperHttpError
  | ScraperTimeoutError
  | ScraperRateLimitError
  | ScraperNetworkError;

export class ScraperClient extends Effect.Service<ScraperClient>()(
  "ScraperClient",
  {
    effect: Effect.gen(function* () {
      const config = yield* PipelineConfig;

      const fetchUrl = (
        request: ScrapeRequest,
      ): Effect.Effect<ScrapeResponse, ScraperError> =>
        Effect.gen(function* () {
          const startTime = Date.now();
          const timeoutMs = request.timeoutMs ?? config.defaultTimeoutMs;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, timeoutMs);

          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(request.url, {
                method: "GET",
                headers: {
                  "User-Agent": config.userAgent,
                  ...request.headers,
                },
                signal: controller.signal,
                redirect: request.followRedirects ? "follow" : "manual",
              }),
            catch: (error) => {
              if (error instanceof Error && error.name === "AbortError") {
                return new ScraperTimeoutError({
                  message: `Request timed out after ${timeoutMs}ms`,
                  url: request.url,
                  timeoutMs,
                });
              }
              return new ScraperNetworkError({
                message: `Network error: ${String(error)}`,
                url: request.url,
                cause: error,
              });
            },
          }).pipe(
            Effect.tap(() =>
              Effect.sync(() => {
                clearTimeout(timeoutId);
              }),
            ),
          );

          const statusCode = response.status;

          if (statusCode === 429) {
            const retryAfter = response.headers.get("retry-after");
            const retryAfterMs = retryAfter
              ? Number.parseInt(retryAfter, 10) * 1000
              : undefined;

            return yield* Effect.fail(
              new ScraperRateLimitError({
                message: "Rate limited by server",
                url: request.url,
                retryAfterMs,
              }),
            );
          }

          if (statusCode >= 400) {
            return yield* Effect.fail(
              new ScraperHttpError({
                message: `HTTP ${statusCode} error`,
                url: request.url,
                statusCode,
              }),
            );
          }

          const body = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: (error) =>
              new ScraperNetworkError({
                message: `Failed to read response body: ${String(error)}`,
                url: request.url,
                cause: error,
              }),
          });

          const durationMs = Date.now() - startTime;

          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });

          return {
            url: request.url,
            finalUrl: response.url,
            statusCode,
            headers,
            body,
            contentType: response.headers.get("content-type"),
            fetchedAt: new Date(),
            durationMs,
          } as ScrapeResponse;
        });

      const fetchWithRetry = (request: ScrapeRequest) =>
        fetchUrl(request).pipe(
          Effect.retry(
            Schedule.exponential(config.retryDelay).pipe(
              Schedule.compose(Schedule.recurs(config.maxRetries)),
              Schedule.whileInput(
                (error: ScraperError) =>
                  error._tag === "ScraperNetworkError" ||
                  error._tag === "ScraperTimeoutError",
              ),
            ),
          ),
        );

      return {
        fetch: fetchUrl,
        fetchWithRetry,
      } as const;
    }),
    dependencies: [PipelineConfig.Default],
  },
) {}
