import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { MSLConfig, PipelineConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  MSLGame,
  MSLGamePeriodScore,
  MSLGoalie,
  MSLGoalieStats,
  MSLGoaliesRequest,
  MSLPlayer,
  MSLPlayerStats,
  MSLPlayersRequest,
  MSLScheduleRequest,
  MSLStanding,
  MSLStandingsRequest,
  MSLTeam,
  MSLTeamsRequest,
} from "./msl.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class MSLClient extends Effect.Service<MSLClient>()("MSLClient", {
  effect: Effect.gen(function* () {
    const mslConfig = yield* MSLConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for HTML parsing in methods
    const $ = cheerio;

    /**
     * Fetches a page from Gamesheet with browser-like headers.
     * Returns the HTML content as a string.
     *
     * @param path - Path relative to gamesheetBaseUrl (e.g., "/seasons/1234/schedule")
     */
    const fetchGamesheetPage = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      Effect.gen(function* () {
        const url = `${mslConfig.gamesheetBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
        const timeoutMs = pipelineConfig.defaultTimeoutMs;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(url, {
              method: "GET",
              headers: {
                ...mslConfig.headers,
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
              },
              signal: controller.signal,
            }),
          catch: (error) => {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
              return new TimeoutError({
                message: `Gamesheet request timed out after ${timeoutMs}ms`,
                url,
                timeoutMs,
              });
            }
            return new NetworkError({
              message: `Gamesheet network error: ${String(error)}`,
              url,
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

        if (response.status >= 400) {
          return yield* Effect.fail(
            new HttpError({
              message: `Gamesheet HTTP ${response.status} error`,
              url,
              method: "GET",
              statusCode: response.status,
            }),
          );
        }

        const html = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) =>
            new NetworkError({
              message: `Failed to read Gamesheet response body: ${String(error)}`,
              url,
              cause: error,
            }),
        });

        return html;
      });

    /**
     * Fetches a Gamesheet page with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const fetchGamesheetPageWithRetry = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      fetchGamesheetPage(path).pipe(
        Effect.retry(
          Schedule.exponential(pipelineConfig.retryDelay).pipe(
            Schedule.compose(Schedule.recurs(pipelineConfig.maxRetries)),
            Schedule.whileInput(
              (error: HttpError | NetworkError | TimeoutError) =>
                error._tag === "NetworkError" || error._tag === "TimeoutError",
            ),
          ),
        ),
      );

    /**
     * Fetches a page from the main MSL website with browser-like headers.
     * Returns the HTML content as a string.
     *
     * @param path - Path relative to mainSiteBaseUrl (e.g., "/schedule")
     */
    const fetchMainSitePage = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      Effect.gen(function* () {
        const url = `${mslConfig.mainSiteBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
        const timeoutMs = pipelineConfig.defaultTimeoutMs;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(url, {
              method: "GET",
              headers: {
                ...mslConfig.headers,
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
              },
              signal: controller.signal,
            }),
          catch: (error) => {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
              return new TimeoutError({
                message: `Main site request timed out after ${timeoutMs}ms`,
                url,
                timeoutMs,
              });
            }
            return new NetworkError({
              message: `Main site network error: ${String(error)}`,
              url,
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

        if (response.status >= 400) {
          return yield* Effect.fail(
            new HttpError({
              message: `Main site HTTP ${response.status} error`,
              url,
              method: "GET",
              statusCode: response.status,
            }),
          );
        }

        const html = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) =>
            new NetworkError({
              message: `Failed to read main site response body: ${String(error)}`,
              url,
              cause: error,
            }),
        });

        return html;
      });

    /**
     * Fetches a main site page with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const fetchMainSitePageWithRetry = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      fetchMainSitePage(path).pipe(
        Effect.retry(
          Schedule.exponential(pipelineConfig.retryDelay).pipe(
            Schedule.compose(Schedule.recurs(pipelineConfig.maxRetries)),
            Schedule.whileInput(
              (error: HttpError | NetworkError | TimeoutError) =>
                error._tag === "NetworkError" || error._tag === "TimeoutError",
            ),
          ),
        ),
      );

    return {
      // Config and utilities
      config: mslConfig,
      pipelineConfig,
      cheerio: $,

      // Internal helpers for fetching pages
      fetchGamesheetPage: fetchGamesheetPageWithRetry,
      fetchMainSitePage: fetchMainSitePageWithRetry,
    };
  }),
  dependencies: [MSLConfig.Default, PipelineConfig.Default],
}) {}
