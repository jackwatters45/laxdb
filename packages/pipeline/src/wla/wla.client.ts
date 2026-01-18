import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { PipelineConfig, WLAConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  WLA_LEAGUE_ID,
  WLA_POINTSTREAK_SEASONS,
  WLAGame,
  WLAGoalie,
  WLAGoalieStats,
  WLAGoaliesRequest,
  WLAPlayer,
  WLAPlayerStats,
  WLAPlayersRequest,
  WLAScheduleRequest,
  WLAStanding,
  WLAStandingsRequest,
  WLATeam,
  WLATeamsRequest,
} from "./wla.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class WLAClient extends Effect.Service<WLAClient>()("WLAClient", {
  effect: Effect.gen(function* () {
    const wlaConfig = yield* WLAConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for potential future HTML parsing needs
    const $ = cheerio;

    /**
     * Fetches a page from the WLA website with browser-like headers.
     * Returns the HTML content as a string.
     *
     * @param url - Full URL to fetch
     */
    const fetchPage = (
      url: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      Effect.gen(function* () {
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
                ...wlaConfig.headers,
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
                message: `WLA request timed out after ${timeoutMs}ms`,
                url,
                timeoutMs,
              });
            }
            return new NetworkError({
              message: `WLA network error: ${String(error)}`,
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
              message: `WLA HTTP ${response.status} error`,
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
              message: `Failed to read WLA response body: ${String(error)}`,
              url,
              cause: error,
            }),
        });

        return html;
      });

    /**
     * Fetches a WLA page with exponential backoff retry.
     * Retries on network and timeout errors only.
     */
    const fetchPageWithRetry = (
      url: string,
    ): Effect.Effect<string, HttpError | NetworkError | TimeoutError> =>
      fetchPage(url).pipe(
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
     * Maps a calendar year to WLA's Pointstreak season ID.
     * Returns Effect.fail with ParseError if year not found in mapping.
     *
     * @param year - Calendar year (e.g., 2024)
     */
    const getSeasonIdFromYear = (
      year: number,
    ): Effect.Effect<number, ParseError> =>
      Effect.gen(function* () {
        const seasonId = WLA_POINTSTREAK_SEASONS[year];
        if (seasonId === undefined) {
          return yield* Effect.fail(
            new ParseError({
              message: `No WLA Pointstreak season ID found for year ${year}. Available years: ${Object.keys(WLA_POINTSTREAK_SEASONS).join(", ")}`,
            }),
          );
        }
        return seasonId;
      }).pipe(
        Effect.tap((seasonId) =>
          Effect.log(`WLA: year ${year} -> season ID ${seasonId}`),
        ),
      );

    // TODO: Implement WLA client methods in subsequent stories
    // - getTeams
    // - getPlayers
    // - getGoalies
    // - getStandings
    // - getSchedule

    return {
      // Config and utilities
      config: wlaConfig,
      pipelineConfig,
      cheerio: $,
      leagueId: WLA_LEAGUE_ID,
      // Fetch helpers
      fetchPage,
      fetchPageWithRetry,
      // Season helpers
      getSeasonIdFromYear,
    };
  }),
  dependencies: [WLAConfig.Default, PipelineConfig.Default],
}) {}
