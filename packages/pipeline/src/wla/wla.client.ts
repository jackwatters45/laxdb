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

    /**
     * Fetches all teams for a given WLA season.
     * Scrapes the schedule page which contains team logos with embedded team IDs.
     *
     * @param input - Request containing the seasonId (year like 2024)
     * @returns Array of WLATeam objects
     */
    const getTeams = (
      input: typeof WLATeamsRequest.Encoded,
    ): Effect.Effect<
      readonly WLATeam[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(WLATeamsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch the schedule page which contains team info
        const url = `${wlaConfig.baseUrl}/schedule`;
        const html = yield* fetchPageWithRetry(url);

        const doc = $.load(html);
        const teams: WLATeam[] = [];
        const seenIds = new Set<string>();

        // Extract teams from logo URLs
        // Pattern: team-logo_url/{teamId}
        doc('img[src*="team-logo_url"]').each((_index, element) => {
          const src = doc(element).attr("src") ?? "";
          const altText = doc(element).attr("alt") ?? "";

          // Extract team ID from logo URL - pattern: /team-logo_url/{id}
          const teamIdMatch = src.match(/team-logo_url\/(\d+)/);
          const teamId = teamIdMatch?.[1];

          if (teamId && !seenIds.has(teamId)) {
            seenIds.add(teamId);

            // Team name from alt text or nearby text
            const teamName = altText.trim() || null;

            // Derive code from team name if available
            let code = teamId;
            if (teamName) {
              // Map known team names to codes
              const nameToCode: Record<string, string> = {
                adanacs: "ADN",
                burrards: "BUR",
                lakers: "LAK",
                salmonbellies: "SB",
                shamrocks: "SHM",
                thunder: "THU",
                timbermen: "TIM",
              };
              const normalizedName = teamName.toLowerCase();
              for (const [key, val] of Object.entries(nameToCode)) {
                if (normalizedName.includes(key)) {
                  code = val;
                  break;
                }
              }
            }

            teams.push(
              new WLATeam({
                id: teamId,
                code,
                name: teamName ?? `Team ${teamId}`,
                city: null, // Can be derived from team name if needed
                logo_url: src.startsWith("http") ? src : null,
                website_url: null,
              }),
            );
          }
        });

        // If no teams found from logo URLs, try alternative patterns
        if (teams.length === 0) {
          // Try finding team names from standings/schedule tables
          doc('a[href*="team/"], .team-name, [data-team-id]').each(
            (_index, element) => {
              const href = doc(element).attr("href") ?? "";
              const dataTeamId = doc(element).attr("data-team-id");
              const teamName = doc(element).text().trim();

              // Extract team ID from href or data attribute
              const teamId =
                dataTeamId ??
                href.match(/team\/(\d+)/)?.[1] ??
                href.match(/team-id=(\d+)/)?.[1];

              if (teamId && teamName && !seenIds.has(teamId)) {
                seenIds.add(teamId);
                teams.push(
                  new WLATeam({
                    id: teamId,
                    code: teamId,
                    name: teamName,
                    city: null,
                    logo_url: null,
                    website_url: null,
                  }),
                );
              }
            },
          );
        }

        // If still no teams, use known WLA teams as fallback
        // These are the 7 teams in the WLA for recent seasons
        if (teams.length === 0 && request.seasonId >= 2020) {
          const knownTeams: Array<{
            id: string;
            code: string;
            name: string;
            city: string;
          }> = [
            { id: "167275", code: "ADN", name: "Adanacs", city: "Coquitlam" },
            {
              id: "167270",
              code: "BUR",
              name: "Burrards",
              city: "Maple Ridge",
            },
            { id: "370397", code: "LAK", name: "Lakers", city: "Burnaby" },
            {
              id: "167272",
              code: "SB",
              name: "Salmonbellies",
              city: "New Westminster",
            },
            { id: "167273", code: "SHM", name: "Shamrocks", city: "Victoria" },
            { id: "167284", code: "THU", name: "Thunder", city: "Langley" },
            { id: "167274", code: "TIM", name: "Timbermen", city: "Nanaimo" },
          ];

          for (const team of knownTeams) {
            teams.push(
              new WLATeam({
                id: team.id,
                code: team.code,
                name: team.name,
                city: team.city,
                logo_url: `https://cdn1.sportngin.com/attachments/team_logo/${team.id.slice(0, 3)}/${team.id}_thumb.png`,
                website_url: null,
              }),
            );
          }
        }

        return teams;
      }).pipe(
        Effect.tap((teams) =>
          Effect.log(
            `Fetched ${teams.length} teams for WLA season ${input.seasonId}`,
          ),
        ),
      );

    // TODO: Implement remaining WLA client methods in subsequent stories
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
      // Data methods
      getTeams,
    };
  }),
  dependencies: [WLAConfig.Default, PipelineConfig.Default],
}) {}
