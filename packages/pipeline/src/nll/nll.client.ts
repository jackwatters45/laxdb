import * as cheerio from "cheerio";
import { Duration, Effect, Schedule, Schema } from "effect";

import { makeRestClient } from "../api-client/rest-client.service";
import { NLLConfig, PipelineConfig } from "../config";
import { ParseError, type PipelineError } from "../error";
import { mapParseError } from "../util";

import {
  type NLLMatch,
  type NLLPlayer,
  NLLPlayersRequest,
  NLLPlayersResponse,
  type NLLPlayerStatsRow,
  NLLScheduleRequest,
  NLLScheduleResponse,
  type NLLStanding,
  NLLStandingsRequest,
  NLLStandingsResponse,
  type NLLTeam,
  NLLTeamsRequest,
  NLLTeamsResponse,
} from "./nll.schema";

export class NLLClient extends Effect.Service<NLLClient>()("NLLClient", {
  effect: Effect.gen(function* () {
    const config = yield* NLLConfig;
    const pipelineConfig = yield* PipelineConfig;

    const restClient = makeRestClient({
      baseUrl: config.baseUrl,
      defaultHeaders: config.headers,
    });

    return {
      getTeams: (
        input: typeof NLLTeamsRequest.Encoded,
      ): Effect.Effect<readonly NLLTeam[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLTeamsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=teams&season_id=${request.seasonId}`;
          return yield* restClient.get(endpoint, NLLTeamsResponse);
        }).pipe(
          Effect.tap((teams) =>
            Effect.log(
              `Fetched ${teams.length} teams for season ${input.seasonId}`,
            ),
          ),
        ),

      getPlayers: (
        input: typeof NLLPlayersRequest.Encoded,
      ): Effect.Effect<readonly NLLPlayer[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLPlayersRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=players&season_id=${request.seasonId}`;
          return yield* restClient.get(endpoint, NLLPlayersResponse);
        }).pipe(
          Effect.tap((players) =>
            Effect.log(
              `Fetched ${players.length} players for season ${input.seasonId}`,
            ),
          ),
        ),

      getStandings: (
        input: typeof NLLStandingsRequest.Encoded,
      ): Effect.Effect<readonly NLLStanding[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLStandingsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=standings&season_id=${request.seasonId}`;
          return yield* restClient.get(endpoint, NLLStandingsResponse);
        }).pipe(
          Effect.tap((standings) =>
            Effect.log(
              `Fetched ${standings.length} standings for season ${input.seasonId}`,
            ),
          ),
        ),

      getSchedule: (
        input: typeof NLLScheduleRequest.Encoded,
      ): Effect.Effect<readonly NLLMatch[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLScheduleRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=schedule&season_id=${request.seasonId}`;
          return yield* restClient.get(endpoint, NLLScheduleResponse);
        }).pipe(
          Effect.tap((matches) =>
            Effect.log(
              `Fetched ${matches.length} matches for season ${input.seasonId}`,
            ),
          ),
        ),

      /**
       * Scrapes player statistics from nll.com website.
       * The API requires auth, so we scrape the rendered HTML tables.
       */
      getPlayerStats: (input: {
        seasonId: number;
        phase?: "REG" | "POST";
      }): Effect.Effect<readonly NLLPlayerStatsRow[], PipelineError> =>
        Effect.gen(function* () {
          const phase = input.phase ?? "REG";

          // Map season ID to season name for URL
          const seasonName = getSeasonName(input.seasonId);
          const baseUrl = `https://www.nll.com/stats/all-player-stats/?season_name=${seasonName}&stage=${phase}`;

          const allStats: NLLPlayerStatsRow[] = [];
          let page = 1;
          let hasMorePages = true;

          while (hasMorePages) {
            const url =
              page === 1 ? baseUrl : `${baseUrl}&all_player_stats_page=${page}`;

            yield* Effect.log(`  Scraping page ${page}: ${url}`);

            const response = yield* Effect.tryPromise({
              try: () =>
                fetch(url, {
                  headers: {
                    "User-Agent": pipelineConfig.userAgent,
                    Accept: "text/html",
                    Origin: "https://www.nll.com",
                    Referer: "https://www.nll.com/stats/",
                  },
                }),
              catch: (error) =>
                new ParseError({
                  message: `Failed to fetch stats page: ${String(error)}`,
                  cause: error,
                }),
            });

            if (!response.ok) {
              return yield* Effect.fail(
                new ParseError({
                  message: `HTTP ${response.status} fetching stats page`,
                }),
              );
            }

            const html = yield* Effect.tryPromise({
              try: () => response.text(),
              catch: (error) =>
                new ParseError({
                  message: `Failed to read response: ${String(error)}`,
                  cause: error,
                }),
            });

            const pageStats = parseStatsTable(html);

            if (pageStats.length === 0) {
              hasMorePages = false;
            } else {
              allStats.push(...pageStats);
              yield* Effect.log(`    Found ${pageStats.length} players`);

              // Check if there's a next page by looking for pagination
              const $ = cheerio.load(html);
              const nextButton = $(".paginate_button.next:not(.disabled)");
              hasMorePages = nextButton.length > 0 && pageStats.length >= 20;

              if (hasMorePages) {
                page++;
                // Rate limit between pages
                yield* Effect.sleep(Duration.millis(500));
              }
            }
          }

          return allStats;
        }).pipe(
          Effect.retry(
            Schedule.exponential(Duration.millis(1000)).pipe(
              Schedule.compose(Schedule.recurs(2)),
            ),
          ),
          Effect.tap((stats) =>
            Effect.log(
              `Scraped ${stats.length} player stats for season ${input.seasonId}`,
            ),
          ),
        ),
    };
  }),
  dependencies: [NLLConfig.Default, PipelineConfig.Default],
}) {}

/**
 * Maps NLL season ID to season name string.
 * Season IDs: 225 = 2025-26, 224 = 2024-25, etc.
 */
function getSeasonName(seasonId: number): string {
  // Season ID 225 = 2025-26 season
  // Base: 200 = 2000-01
  const startYear = 2000 + (seasonId - 200);
  const endYear = (startYear + 1) % 100;
  return `${startYear}-${endYear.toString().padStart(2, "0")}`;
}

/**
 * Parses the stats table HTML from nll.com.
 */
function parseStatsTable(html: string): NLLPlayerStatsRow[] {
  const $ = cheerio.load(html);
  const stats: NLLPlayerStatsRow[] = [];

  // Find the stats table
  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 10) return; // Skip incomplete rows

    // Extract player ID from link
    const playerLink = $(row).find('a[href*="/players/"]').attr("href");
    const personId = playerLink?.match(/\/players\/(\d+)\//)?.[1];
    if (!personId) return;

    // Extract player name
    const fullname = cells.eq(1).text().trim();
    if (!fullname) return;

    // Extract team info
    const teamText = cells.eq(2).text().replaceAll(/\s+/g, " ").trim();
    // Team format: "CityTeamName" e.g. "OttawaBlack Bears"
    const teamName = teamText || null;

    // Try to extract team code from team link or image
    const teamLink = cells.eq(2).find("a").attr("href");
    const teamCode = extractTeamCode(teamLink, teamName);

    const position = cells.eq(3).text().trim() || null;
    const gp = parseNumber(cells.eq(4).text());
    const goals = parseNumber(cells.eq(5).text());
    const assists = parseNumber(cells.eq(6).text());
    const points = parseNumber(cells.eq(7).text());
    const pim = parseNumber(cells.eq(8).text());
    const ppg = parseNumber(cells.eq(9).text());
    const ppa = parseNumber(cells.eq(10).text());
    const shg = parseNumber(cells.eq(11).text());
    const looseballs = parseNumber(cells.eq(12).text());
    const turnovers = parseNumber(cells.eq(13).text());
    const causedTurnovers = parseNumber(cells.eq(14).text());
    const blockedShots = parseNumber(cells.eq(15).text());
    const shotsOnGoal = parseNumber(cells.eq(16).text());

    stats.push({
      personId,
      fullname,
      team_code: teamCode,
      team_name: teamName,
      position,
      games_played: gp,
      goals,
      assists,
      points,
      penalty_minutes: pim,
      ppg,
      ppa,
      shg,
      looseballs,
      turnovers,
      caused_turnovers: causedTurnovers,
      blocked_shots: blockedShots,
      shots_on_goal: shotsOnGoal,
    });
  });

  return stats;
}

function parseNumber(text: string): number {
  const cleaned = text.trim().replaceAll(",", "");
  const num = Number.parseInt(cleaned, 10);
  return Number.isNaN(num) ? 0 : num;
}

function extractTeamCode(
  teamLink: string | undefined,
  teamName: string | null,
): string | null {
  // Try to extract from URL like "https://bandits.com/"
  if (teamLink) {
    const urlMatch = teamLink.match(
      /(?:https?:\/\/)?(?:www\.)?([^.]+)\.(?:com|ca)/,
    );
    if (urlMatch?.[1]) {
      const subdomain = urlMatch[1].toLowerCase();
      const codeMap: Record<string, string> = {
        bandits: "BUF",
        calgaryroughnecks: "CGY",
        coloradomammoth: "COL",
        georgiaswarm: "GA",
        halifaxthunderbirds: "HFX",
        lasvegasdesertdogs: "LV",
        oshawafirewolves: "OSH",
        ottawablackbears: "OTT",
        wingsla: "PHI",
        rochesterknighthawks: "ROC",
        sandiegoseals: "SD",
        saskrush: "SAS",
        torontorock: "TOR",
        vancouverwarriors: "VAN",
      };
      return codeMap[subdomain] ?? null;
    }
  }

  // Fallback: extract from team name
  if (teamName) {
    const nameMap: Record<string, string> = {
      bandits: "BUF",
      roughnecks: "CGY",
      mammoth: "COL",
      swarm: "GA",
      thunderbirds: "HFX",
      "desert dogs": "LV",
      firewolves: "OSH",
      "black bears": "OTT",
      wings: "PHI",
      knighthawks: "ROC",
      seals: "SD",
      rush: "SAS",
      rock: "TOR",
      warriors: "VAN",
    };
    const lowerName = teamName.toLowerCase();
    for (const [key, code] of Object.entries(nameMap)) {
      if (lowerName.includes(key)) return code;
    }
  }

  return null;
}
