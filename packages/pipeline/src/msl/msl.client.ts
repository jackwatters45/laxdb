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

    /**
     * Fetches all players for a given MSL season.
     * Uses the Gamesheet internal REST API for structured data.
     *
     * @param input - Request containing the seasonId (MSL Gamesheet season ID)
     * @returns Array of MSLPlayer objects with stats
     */
    const getPlayers = (
      input: typeof MSLPlayersRequest.Encoded,
    ): Effect.Effect<
      readonly MSLPlayer[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MSLPlayersRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch player standings from Gamesheet internal API
        // API returns paginated results, so we need to fetch all pages
        const allPlayers: MSLPlayer[] = [];
        const pageSize = 100; // Fetch 100 players at a time
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const path = `/api/usePlayers/getPlayerStandings/${request.seasonId}?filter[gametype]=overall&filter[sort]=-pts&filter[limit]=${pageSize}&filter[offset]=${offset}`;

          const response = yield* fetchGamesheetPageWithRetry(path);

          // Parse JSON response
          interface PlayerApiResponse {
            names?: { firstName: string; lastName: string; id: number }[];
            ids?: number[];
            teamNames?: { title: string; id: number }[];
            jersey?: (string | number | null)[];
            positions?: string[];
            gp?: number[];
            g?: number[];
            a?: number[];
            pts?: number[];
            pim?: number[];
            ppg?: number[];
            ppa?: number[];
            shg?: number[];
            sha?: number[];
            gwg?: number[];
            fg?: number[];
            otg?: number[];
            ptspg?: number[];
          }

          let data: PlayerApiResponse;
          try {
            data = JSON.parse(response) as PlayerApiResponse;
          } catch {
            return yield* Effect.fail(
              new ParseError({
                message: `Failed to parse player API response as JSON`,
                cause: response.slice(0, 200),
              }),
            );
          }

          // Check if we have data
          const names = data.names ?? [];
          if (names.length === 0) {
            hasMore = false;
            break;
          }

          // Parse each player from the parallel arrays
          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const playerId = data.ids?.[i] ?? name?.id ?? i;
            const firstName = name?.firstName ?? null;
            const lastName = name?.lastName ?? null;
            const fullName =
              firstName && lastName
                ? `${firstName} ${lastName}`
                : (firstName ?? lastName ?? `Player ${playerId}`);

            const teamInfo = data.teamNames?.[i];
            const jersey = data.jersey?.[i];
            const position = data.positions?.[i] ?? null;

            // Build stats
            const gamesPlayed = data.gp?.[i] ?? 0;
            const goals = data.g?.[i] ?? 0;
            const assists = data.a?.[i] ?? 0;
            const points = data.pts?.[i] ?? 0;
            const penaltyMinutes = data.pim?.[i] ?? 0;
            const pointsPerGame = data.ptspg?.[i] ?? 0;
            const ppg = data.ppg?.[i] ?? null;
            const ppa = data.ppa?.[i] ?? null;
            const shg = data.shg?.[i] ?? null;
            const sha = data.sha?.[i] ?? null;
            const gwg = data.gwg?.[i] ?? null;
            const fg = data.fg?.[i] ?? null;
            const otg = data.otg?.[i] ?? null;

            const player = new MSLPlayer({
              id: String(playerId),
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              jersey_number: jersey !== null ? String(jersey) : null,
              position,
              team_id: teamInfo?.id !== undefined ? String(teamInfo.id) : null,
              team_name: teamInfo?.title ?? null,
              stats: new MSLPlayerStats({
                games_played: gamesPlayed,
                goals,
                assists,
                points,
                penalty_minutes: penaltyMinutes,
                points_per_game: pointsPerGame,
                ppg,
                ppa,
                shg,
                sha,
                gwg,
                fg,
                otg,
              }),
            });

            allPlayers.push(player);
          }

          // Check if there are more pages
          if (names.length < pageSize) {
            hasMore = false;
          } else {
            offset += pageSize;
          }
        }

        return allPlayers;
      }).pipe(
        Effect.tap((players) =>
          Effect.log(
            `Fetched ${players.length} players for MSL season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Fetches all goalies for a given MSL season.
     * Uses the Gamesheet internal REST API for structured data.
     *
     * @param input - Request containing the seasonId (MSL Gamesheet season ID)
     * @returns Array of MSLGoalie objects with stats
     */
    const getGoalies = (
      input: typeof MSLGoaliesRequest.Encoded,
    ): Effect.Effect<
      readonly MSLGoalie[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MSLGoaliesRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch goalie standings from Gamesheet internal API
        // API returns paginated results, so we need to fetch all pages
        const allGoalies: MSLGoalie[] = [];
        const pageSize = 100; // Fetch 100 goalies at a time
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const path = `/api/usePlayers/getGoalieStandings/${request.seasonId}?filter[gametype]=overall&filter[sort]=-svpct&filter[limit]=${pageSize}&filter[offset]=${offset}`;

          const response = yield* fetchGamesheetPageWithRetry(path);

          // Parse JSON response
          interface GoalieApiResponse {
            names?: { firstName: string; lastName: string; id: number }[];
            ids?: number[];
            teamNames?: { title: string; id: number }[];
            jersey?: (string | number | null)[];
            gp?: number[];
            w?: number[];
            l?: number[];
            t?: number[];
            ga?: number[];
            sv?: number[];
            sa?: number[];
            gaa?: number[];
            svpct?: number[];
            so?: number[];
            min?: number[];
          }

          let data: GoalieApiResponse;
          try {
            data = JSON.parse(response) as GoalieApiResponse;
          } catch {
            return yield* Effect.fail(
              new ParseError({
                message: `Failed to parse goalie API response as JSON`,
                cause: response.slice(0, 200),
              }),
            );
          }

          // Check if we have data
          const names = data.names ?? [];
          if (names.length === 0) {
            hasMore = false;
            break;
          }

          // Parse each goalie from the parallel arrays
          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const goalieId = data.ids?.[i] ?? name?.id ?? i;
            const firstName = name?.firstName ?? null;
            const lastName = name?.lastName ?? null;
            const fullName =
              firstName && lastName
                ? `${firstName} ${lastName}`
                : (firstName ?? lastName ?? `Goalie ${goalieId}`);

            const teamInfo = data.teamNames?.[i];
            const jersey = data.jersey?.[i];

            // Build stats
            const gamesPlayed = data.gp?.[i] ?? 0;
            const wins = data.w?.[i] ?? 0;
            const losses = data.l?.[i] ?? 0;
            const ties = data.t?.[i] ?? 0;
            const goalsAgainst = data.ga?.[i] ?? 0;
            const saves = data.sv?.[i] ?? 0;
            const shotsAgainst = data.sa?.[i] ?? 0;
            const gaa = data.gaa?.[i] ?? 0;
            const savePct = data.svpct?.[i] ?? 0;
            const shutouts = data.so?.[i] ?? 0;
            const minutes = data.min?.[i] ?? 0;

            const goalie = new MSLGoalie({
              id: String(goalieId),
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              jersey_number: jersey !== null ? String(jersey) : null,
              team_id: teamInfo?.id !== undefined ? String(teamInfo.id) : null,
              team_name: teamInfo?.title ?? null,
              stats: new MSLGoalieStats({
                games_played: gamesPlayed,
                wins,
                losses,
                ties,
                goals_against: goalsAgainst,
                saves,
                shots_against: shotsAgainst,
                gaa,
                save_pct: savePct,
                shutouts,
                minutes_played: minutes,
              }),
            });

            allGoalies.push(goalie);
          }

          // Check if there are more pages
          if (names.length < pageSize) {
            hasMore = false;
          } else {
            offset += pageSize;
          }
        }

        return allGoalies;
      }).pipe(
        Effect.tap((goalies) =>
          Effect.log(
            `Fetched ${goalies.length} goalies for MSL season ${input.seasonId}`,
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
      getPlayers,
      getGoalies,
    };
  }),
  dependencies: [MSLConfig.Default, PipelineConfig.Default],
}) {}
