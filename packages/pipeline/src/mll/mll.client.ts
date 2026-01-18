import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { MLLConfig, PipelineConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  type MLLGame,
  type MLLGoalie,
  MLLGoaliesRequest,
  type MLLPlayer,
  MLLPlayersRequest,
  MLLScheduleRequest,
  type MLLStanding,
  MLLStandingsRequest,
  type MLLStatLeader,
  MLLStatLeadersRequest,
  type MLLTeam,
  MLLTeamsRequest,
  WaybackCDXEntry,
} from "./mll.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class MLLClient extends Effect.Service<MLLClient>()("MLLClient", {
  effect: Effect.gen(function* () {
    const mllConfig = yield* MLLConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for HTML parsing in methods
    const $ = cheerio;

    /**
     * Fetches a page from StatsCrew with browser-like headers.
     * Returns the HTML content as a string.
     */
    const fetchStatscrewPage = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      Effect.gen(function* () {
        const url = `${mllConfig.statscrewBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
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
                ...mllConfig.headers,
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
          Effect.tap(() =>
            Effect.sync(() => {
              clearTimeout(timeoutId);
            }),
          ),
        );

        if (response.status >= 400) {
          return yield* Effect.fail(
            new HttpError({
              message: `HTTP ${response.status} error`,
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
              message: `Failed to read response body: ${String(error)}`,
              url,
              cause: error,
            }),
        });

        return html;
      });

    /**
     * Fetches a StatsCrew page with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const fetchStatscrewPageWithRetry = (
      path: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      fetchStatscrewPage(path).pipe(
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
     * Queries the Wayback Machine CDX API for archived URLs.
     * Returns entries filtered by statuscode=200.
     *
     * @param url - The URL pattern to search for (e.g., "majorleaguelacrosse.com/schedule*")
     * @param params - Optional query parameters (from, to, collapse, filter, etc.)
     */
    const queryWaybackCDX = (
      url: string,
      params: Record<string, string> = {},
    ): Effect.Effect<
      readonly WaybackCDXEntry[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const queryParams = new URLSearchParams({
          url,
          output: "json",
          ...params,
        });
        const cdxUrl = `${mllConfig.waybackCdxUrl}?${queryParams.toString()}`;
        const timeoutMs = pipelineConfig.defaultTimeoutMs;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(cdxUrl, {
              method: "GET",
              headers: {
                ...mllConfig.headers,
                Accept: "application/json",
              },
              signal: controller.signal,
            }),
          catch: (error) => {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
              return new TimeoutError({
                message: `CDX request timed out after ${timeoutMs}ms`,
                url: cdxUrl,
                timeoutMs,
              });
            }
            return new NetworkError({
              message: `CDX network error: ${String(error)}`,
              url: cdxUrl,
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
              message: `CDX API HTTP ${response.status} error`,
              url: cdxUrl,
              method: "GET",
              statusCode: response.status,
            }),
          );
        }

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new ParseError({
              message: `Failed to parse CDX JSON response: ${String(error)}`,
              cause: error,
            }),
        });

        // CDX returns array where first row is headers, rest are data rows
        // Format: [["urlkey", "timestamp", "original", "mimetype", "statuscode", "digest", "length"], [...data...], ...]
        if (!Array.isArray(json)) {
          return yield* Effect.fail(
            new ParseError({
              message: "CDX response is not an array",
              cause: json,
            }),
          );
        }

        // Empty response or headers only
        if (json.length <= 1) {
          return [] as readonly WaybackCDXEntry[];
        }

        // Skip header row, parse data rows into WaybackCDXEntry objects
        const dataRows = json.slice(1) as string[][];
        const entries = dataRows.map(
          ([
            urlkey,
            timestamp,
            original,
            mimetype,
            statuscode,
            digest,
            length,
          ]) =>
            new WaybackCDXEntry({
              urlkey: urlkey ?? "",
              timestamp: timestamp ?? "",
              original: original ?? "",
              mimetype: mimetype ?? "",
              statuscode: statuscode ?? "",
              digest: digest ?? "",
              length: length ?? "",
            }),
        );

        // Filter by statuscode=200 (successful captures only)
        const successfulEntries = entries.filter(
          (entry) => entry.statuscode === "200",
        );

        return successfulEntries;
      });

    /**
     * Queries Wayback CDX with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const queryWaybackCDXWithRetry = (
      url: string,
      params: Record<string, string> = {},
    ): Effect.Effect<
      readonly WaybackCDXEntry[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      queryWaybackCDX(url, params).pipe(
        Effect.retry(
          Schedule.exponential(pipelineConfig.retryDelay).pipe(
            Schedule.compose(Schedule.recurs(pipelineConfig.maxRetries)),
            Schedule.whileInput(
              (error: HttpError | NetworkError | TimeoutError | ParseError) =>
                error._tag === "NetworkError" || error._tag === "TimeoutError",
            ),
          ),
        ),
      );

    /**
     * Fetches an archived page from the Wayback Machine.
     * Returns the HTML content as a string.
     *
     * @param timestamp - Wayback timestamp (e.g., "20060501120000")
     * @param url - Original URL to fetch (e.g., "http://majorleaguelacrosse.com/schedule/")
     */
    const fetchWaybackPage = (
      timestamp: string,
      url: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      Effect.gen(function* () {
        const waybackUrl = `${mllConfig.waybackWebUrl}/${timestamp}/${url}`;
        const timeoutMs = pipelineConfig.defaultTimeoutMs;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeoutMs);

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(waybackUrl, {
              method: "GET",
              headers: {
                ...mllConfig.headers,
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
              },
              signal: controller.signal,
              redirect: "follow",
            }),
          catch: (error) => {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === "AbortError") {
              return new TimeoutError({
                message: `Wayback request timed out after ${timeoutMs}ms`,
                url: waybackUrl,
                timeoutMs,
              });
            }
            return new NetworkError({
              message: `Wayback network error: ${String(error)}`,
              url: waybackUrl,
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
              message: `Wayback HTTP ${response.status} error`,
              url: waybackUrl,
              method: "GET",
              statusCode: response.status,
            }),
          );
        }

        const html = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) =>
            new NetworkError({
              message: `Failed to read Wayback response body: ${String(error)}`,
              url: waybackUrl,
              cause: error,
            }),
        });

        return html;
      });

    /**
     * Fetches a Wayback page with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const fetchWaybackPageWithRetry = (
      timestamp: string,
      url: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      fetchWaybackPage(timestamp, url).pipe(
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
      // Placeholder methods - implementations will be added in subsequent stories
      config: mllConfig,
      pipelineConfig,
      cheerio: $,

      // Internal helpers for fetching pages
      fetchStatscrewPage: fetchStatscrewPageWithRetry,

      // Internal helpers for Wayback Machine CDX queries
      queryWaybackCDX: queryWaybackCDXWithRetry,

      // Internal helpers for fetching Wayback archived pages
      fetchWaybackPage: fetchWaybackPageWithRetry,

      // Type exports for method signatures (to be implemented)
      _types: {
        mapParseError,
      } as const,
    };
  }),
  dependencies: [MLLConfig.Default, PipelineConfig.Default],
}) {}
