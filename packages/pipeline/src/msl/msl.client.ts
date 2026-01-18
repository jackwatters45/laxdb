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

    /**
     * Fetches all teams for a given MSL season.
     * Uses the Gamesheet standings API which includes team data.
     *
     * @param input - Request containing the seasonId (MSL Gamesheet season ID)
     * @returns Array of MSLTeam objects
     */
    const getTeams = (
      input: typeof MSLTeamsRequest.Encoded,
    ): Effect.Effect<
      readonly MSLTeam[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MSLTeamsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch standings page which contains all teams
        const path = `/seasons/${request.seasonId}/standings`;
        const html = yield* fetchGamesheetPageWithRetry(path);

        const doc = $.load(html);

        // Extract teams from the standings table
        // Gamesheet uses a custom table structure with data attributes
        // Team names are in cells with team links
        const teams: MSLTeam[] = [];
        const seenIds = new Set<string>();

        // Look for team links in the standings table
        // Pattern: /seasons/{seasonId}/teams/{teamId}
        doc('a[href*="/teams/"]').each((_index, element) => {
          const href = doc(element).attr("href") ?? "";
          const teamMatch = href.match(/\/seasons\/\d+\/teams\/(\d+)/);
          const teamId = teamMatch?.[1];

          if (teamId) {
            // Skip if we've already seen this team
            if (seenIds.has(teamId)) {
              return;
            }
            seenIds.add(teamId);

            const teamName = doc(element).text().trim();

            // Skip empty names or navigation elements
            if (!teamName || teamName.length < 2) {
              return;
            }

            // Try to find logo URL from nearby img element
            const parentCell = doc(element).closest("td, div");
            const logoImg = parentCell.find("img").first();
            const logoUrl = logoImg.attr("src") ?? null;

            teams.push(
              new MSLTeam({
                id: teamId,
                name: teamName,
                city: null, // Gamesheet doesn't expose city separately
                abbreviation: null, // Not available in standings page
                logo_url: logoUrl,
                website_url: null,
              }),
            );
          }
        });

        // If no teams found from team links, try alternative selectors
        // Gamesheet sometimes renders teams without links
        if (teams.length === 0) {
          // Look for team titles in data attributes
          doc('[data-testid*="team-title"], .team-title, .team-name').each(
            (_index, element) => {
              const teamName = doc(element).text().trim();

              if (!teamName || teamName.length < 2) {
                return;
              }

              // Generate a simple ID from the name
              const teamId = teamName.toLowerCase().replaceAll(/\s+/g, "-");

              if (seenIds.has(teamId)) {
                return;
              }
              seenIds.add(teamId);

              teams.push(
                new MSLTeam({
                  id: teamId,
                  name: teamName,
                  city: null,
                  abbreviation: null,
                  logo_url: null,
                  website_url: null,
                }),
              );
            },
          );
        }

        return teams;
      }).pipe(
        Effect.tap((teams) =>
          Effect.log(
            `Fetched ${teams.length} teams for MSL season ${input.seasonId}`,
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

      // Public API methods
      getTeams,
    };
  }),
  dependencies: [MSLConfig.Default, PipelineConfig.Default],
}) {}
