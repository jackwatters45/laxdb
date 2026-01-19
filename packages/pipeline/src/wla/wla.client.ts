import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { PipelineConfig, WLAConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";
import { safeString, safeStringOrNull } from "../util";

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

    /**
     * Fetches all players for a given WLA season.
     * Scrapes the stats SPA page for player data.
     * Note: WLA uses DigitalShift API which requires authentication,
     * so this attempts to parse any embedded data from the HTML.
     *
     * @param input - Request containing the seasonId (year like 2024)
     * @returns Array of WLAPlayer objects with stats
     */
    const getPlayers = (
      input: typeof WLAPlayersRequest.Encoded,
    ): Effect.Effect<
      readonly WLAPlayer[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(WLAPlayersRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Get the Pointstreak season ID for the given year
        const pointstreakSeasonId = yield* getSeasonIdFromYear(
          request.seasonId,
        );

        // Fetch the stats leaders page which may contain embedded data
        const url = `${wlaConfig.statsUrl}#/${WLA_LEAGUE_ID}/leaders?season_id=${pointstreakSeasonId}`;
        const html = yield* fetchPageWithRetry(url);

        const doc = $.load(html);
        const players: WLAPlayer[] = [];
        const seenIds = new Set<string>();

        // Try to extract embedded JSON data from script tags
        // SPAs often include initial state as __INITIAL_STATE__ or similar
        doc("script").each((_index, element) => {
          const scriptContent = doc(element).html() ?? "";

          // Look for embedded player data in various formats
          const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
            /window\.initialData\s*=\s*(\{[\s\S]*?\});/,
            /"players"\s*:\s*(\[[\s\S]*?\])/,
            /"leaders"\s*:\s*(\[[\s\S]*?\])/,
          ];

          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match?.[1]) {
              try {
                const data = JSON.parse(match[1]) as unknown;
                // Try to extract player data from the parsed JSON
                const extractedPlayers = extractPlayersFromData(data);
                for (const player of extractedPlayers) {
                  if (!seenIds.has(player.id)) {
                    seenIds.add(player.id);
                    players.push(player);
                  }
                }
              } catch {
                // JSON parse failed, continue to next pattern
              }
            }
          }
        });

        // Try to parse any visible HTML tables (in case server-side rendering is enabled)
        doc("table").each((_tableIndex, table) => {
          const headerRow = doc(table).find("tr").first();
          const headers = headerRow
            .find("th, td")
            .map((_i, el) => doc(el).text().trim().toLowerCase())
            .get();

          // Check if this is a player stats table
          const hasGP = headers.some((h) => h === "gp" || h === "games");
          const hasG = headers.some((h) => h === "g" || h === "goals");
          const hasA = headers.some((h) => h === "a" || h === "assists");
          const hasPts = headers.some((h) => h === "pts" || h === "points");
          const hasPlayer = headers.some(
            (h) => h === "player" || h === "name" || h.includes("player name"),
          );

          if (!(hasGP && hasG && hasA && hasPts && hasPlayer)) {
            return; // Not a player stats table, skip
          }

          // Find column indices
          const playerIdx = headers.findIndex(
            (h) => h === "player" || h === "name" || h.includes("player name"),
          );
          const teamIdx = headers.findIndex((h) => h === "team" || h === "tm");
          const gpIdx = headers.findIndex((h) => h === "gp" || h === "games");
          const gIdx = headers.findIndex((h) => h === "g" || h === "goals");
          const aIdx = headers.findIndex((h) => h === "a" || h === "assists");
          const ptsIdx = headers.findIndex(
            (h) => h === "pts" || h === "points",
          );
          const pimIdx = headers.findIndex(
            (h) => h === "pim" || h === "pen" || h === "penalty",
          );
          const ppgIdx = headers.findIndex((h) => h === "ppg");
          const shgIdx = headers.findIndex((h) => h === "shg");
          const gwgIdx = headers.findIndex((h) => h === "gwg");

          // Parse data rows
          doc(table)
            .find("tr")
            .slice(1)
            .each((_rowIndex, row) => {
              const cells = doc(row)
                .find("td")
                .map((_i, el) => doc(el))
                .get();

              if (cells.length < Math.max(playerIdx, gpIdx, gIdx) + 1) {
                return; // Skip malformed rows
              }

              const playerCell = cells[playerIdx];
              const playerName = playerCell?.text().trim() ?? "";

              if (!playerName) {
                return; // Skip empty rows
              }

              // Generate player ID from name
              const playerId = playerName.toLowerCase().replaceAll(/\s+/g, "-");

              if (seenIds.has(playerId)) {
                return; // Skip duplicates
              }
              seenIds.add(playerId);

              // Parse name parts
              const nameParts = playerName.split(/\s+/);
              const firstName = nameParts[0] ?? null;
              const lastName =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

              // Extract team info
              const teamCell = teamIdx >= 0 ? cells[teamIdx] : null;
              const teamName = teamCell?.text().trim() ?? null;

              // Parse stats
              const gamesPlayed =
                Number.parseInt(cells[gpIdx]?.text().trim() ?? "0", 10) || 0;
              const goals =
                Number.parseInt(cells[gIdx]?.text().trim() ?? "0", 10) || 0;
              const assists =
                Number.parseInt(cells[aIdx]?.text().trim() ?? "0", 10) || 0;
              const points =
                Number.parseInt(cells[ptsIdx]?.text().trim() ?? "0", 10) || 0;
              const penaltyMinutes =
                pimIdx >= 0
                  ? Number.parseInt(cells[pimIdx]?.text().trim() ?? "0", 10) ||
                    0
                  : 0;
              const ppg =
                ppgIdx >= 0
                  ? Number.parseInt(cells[ppgIdx]?.text().trim() ?? "0", 10) ||
                    null
                  : null;
              const shg =
                shgIdx >= 0
                  ? Number.parseInt(cells[shgIdx]?.text().trim() ?? "0", 10) ||
                    null
                  : null;
              const gwg =
                gwgIdx >= 0
                  ? Number.parseInt(cells[gwgIdx]?.text().trim() ?? "0", 10) ||
                    null
                  : null;

              players.push(
                new WLAPlayer({
                  id: playerId,
                  first_name: firstName,
                  last_name: lastName,
                  full_name: playerName,
                  jersey_number: null,
                  position: null,
                  team_id: null,
                  team_code: null,
                  team_name: teamName,
                  stats: new WLAPlayerStats({
                    games_played: gamesPlayed,
                    goals,
                    assists,
                    points,
                    penalty_minutes: penaltyMinutes,
                    ppg,
                    shg,
                    gwg,
                    scoring_pct: null,
                  }),
                }),
              );
            });
        });

        // Note: If no players found, the WLA stats page is likely a SPA
        // that loads data via authenticated API calls. The extractor
        // will handle this gracefully by reporting 0 players for now.
        // Future enhancement: Use browser automation or API tokens.

        return players;
      }).pipe(
        Effect.tap((players) =>
          Effect.log(
            `Fetched ${players.length} players for WLA season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Fetches all goalies for a given WLA season.
     * Scrapes the stats SPA page for goalie data.
     * Note: WLA uses DigitalShift API which requires authentication,
     * so this attempts to parse any embedded data from the HTML.
     *
     * @param input - Request containing the seasonId (year like 2024)
     * @returns Array of WLAGoalie objects with stats
     */
    const getGoalies = (
      input: typeof WLAGoaliesRequest.Encoded,
    ): Effect.Effect<
      readonly WLAGoalie[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(WLAGoaliesRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Get the Pointstreak season ID for the given year
        const pointstreakSeasonId = yield* getSeasonIdFromYear(
          request.seasonId,
        );

        // Fetch the goalie stats page which may contain embedded data
        const url = `${wlaConfig.statsUrl}#/${WLA_LEAGUE_ID}/goaltending?season_id=${pointstreakSeasonId}`;
        const html = yield* fetchPageWithRetry(url);

        const doc = $.load(html);
        const goalies: WLAGoalie[] = [];
        const seenIds = new Set<string>();

        // Try to extract embedded JSON data from script tags
        // SPAs often include initial state as __INITIAL_STATE__ or similar
        doc("script").each((_index, element) => {
          const scriptContent = doc(element).html() ?? "";

          // Look for embedded goalie data in various formats
          const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
            /window\.initialData\s*=\s*(\{[\s\S]*?\});/,
            /"goalies"\s*:\s*(\[[\s\S]*?\])/,
            /"goaltending"\s*:\s*(\[[\s\S]*?\])/,
          ];

          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match?.[1]) {
              try {
                const data = JSON.parse(match[1]) as unknown;
                // Try to extract goalie data from the parsed JSON
                const extractedGoalies = extractGoaliesFromData(data);
                for (const goalie of extractedGoalies) {
                  if (!seenIds.has(goalie.id)) {
                    seenIds.add(goalie.id);
                    goalies.push(goalie);
                  }
                }
              } catch {
                // JSON parse failed, continue to next pattern
              }
            }
          }
        });

        // Try to parse any visible HTML tables (in case server-side rendering is enabled)
        doc("table").each((_tableIndex, table) => {
          const headerRow = doc(table).find("tr").first();
          const headers = headerRow
            .find("th, td")
            .map((_i, el) => doc(el).text().trim().toLowerCase())
            .get();

          // Check if this is a goalie stats table
          const hasGP = headers.some((h) => h === "gp" || h === "games");
          const hasGAA = headers.some(
            (h) => h === "gaa" || h.includes("goals against"),
          );
          const hasSV = headers.some(
            (h) =>
              h === "sv%" || h === "svpct" || h === "sv" || h.includes("save"),
          );
          const hasGoalie = headers.some(
            (h) =>
              h === "goalie" ||
              h === "player" ||
              h === "name" ||
              h.includes("goalie name"),
          );

          if (!(hasGP && (hasGAA || hasSV) && hasGoalie)) {
            return; // Not a goalie stats table, skip
          }

          // Find column indices
          const goalieIdx = headers.findIndex(
            (h) =>
              h === "goalie" ||
              h === "player" ||
              h === "name" ||
              h.includes("goalie name"),
          );
          const teamIdx = headers.findIndex((h) => h === "team" || h === "tm");
          const gpIdx = headers.findIndex((h) => h === "gp" || h === "games");
          const wIdx = headers.findIndex((h) => h === "w" || h === "wins");
          const lIdx = headers.findIndex((h) => h === "l" || h === "losses");
          const tIdx = headers.findIndex(
            (h) => h === "t" || h === "ties" || h === "otl",
          );
          const gaIdx = headers.findIndex(
            (h) => h === "ga" || h === "goals against",
          );
          const svIdx = headers.findIndex((h) => h === "sv" || h === "saves");
          const saIdx = headers.findIndex(
            (h) => h === "sa" || h === "shots" || h === "shots against",
          );
          const gaaIdx = headers.findIndex(
            (h) => h === "gaa" || h.includes("goals against avg"),
          );
          const svPctIdx = headers.findIndex(
            (h) => h === "sv%" || h === "svpct" || h === "save pct",
          );
          const soIdx = headers.findIndex(
            (h) => h === "so" || h === "shutouts",
          );

          // Parse data rows
          doc(table)
            .find("tr")
            .slice(1)
            .each((_rowIndex, row) => {
              const cells = doc(row)
                .find("td")
                .map((_i, el) => doc(el))
                .get();

              if (cells.length < Math.max(goalieIdx, gpIdx) + 1) {
                return; // Skip malformed rows
              }

              const goalieCell = cells[goalieIdx];
              const goalieName = goalieCell?.text().trim() ?? "";

              if (!goalieName) {
                return; // Skip empty rows
              }

              // Generate goalie ID from name
              const goalieId = goalieName.toLowerCase().replaceAll(/\s+/g, "-");

              if (seenIds.has(goalieId)) {
                return; // Skip duplicates
              }
              seenIds.add(goalieId);

              // Parse name parts
              const nameParts = goalieName.split(/\s+/);
              const firstName = nameParts[0] ?? null;
              const lastName =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

              // Extract team info
              const teamCell = teamIdx >= 0 ? cells[teamIdx] : null;
              const teamName = teamCell?.text().trim() ?? null;

              // Parse stats
              const gamesPlayed =
                Number.parseInt(cells[gpIdx]?.text().trim() ?? "0", 10) || 0;
              const wins =
                wIdx >= 0
                  ? Number.parseInt(cells[wIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const losses =
                lIdx >= 0
                  ? Number.parseInt(cells[lIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const ties =
                tIdx >= 0
                  ? Number.parseInt(cells[tIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const goalsAgainst =
                gaIdx >= 0
                  ? Number.parseInt(cells[gaIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const saves =
                svIdx >= 0
                  ? Number.parseInt(cells[svIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const shotsAgainst =
                saIdx >= 0
                  ? Number.parseInt(cells[saIdx]?.text().trim() ?? "0", 10) || 0
                  : goalsAgainst + saves; // Calculate if not provided
              const gaa =
                gaaIdx >= 0
                  ? Number.parseFloat(cells[gaaIdx]?.text().trim() ?? "0") || 0
                  : gamesPlayed > 0
                    ? goalsAgainst / gamesPlayed
                    : 0;
              const savePct =
                svPctIdx >= 0
                  ? Number.parseFloat(
                      cells[svPctIdx]?.text().trim().replace("%", "") ?? "0",
                    ) || 0
                  : shotsAgainst > 0
                    ? (saves / shotsAgainst) * 100
                    : 0;
              const shutouts =
                soIdx >= 0
                  ? Number.parseInt(cells[soIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;

              goalies.push(
                new WLAGoalie({
                  id: goalieId,
                  first_name: firstName,
                  last_name: lastName,
                  full_name: goalieName,
                  jersey_number: null,
                  team_id: null,
                  team_code: null,
                  team_name: teamName,
                  stats: new WLAGoalieStats({
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
                  }),
                }),
              );
            });
        });

        // Note: If no goalies found, the WLA stats page is likely a SPA
        // that loads data via authenticated API calls. The extractor
        // will handle this gracefully by reporting 0 goalies for now.
        // Future enhancement: Use browser automation or API tokens.

        return goalies;
      }).pipe(
        Effect.tap((goalies) =>
          Effect.log(
            `Fetched ${goalies.length} goalies for WLA season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Helper to extract goalies from embedded JSON data structures.
     * Handles various formats that SPAs might use.
     */
    const extractGoaliesFromData = (data: unknown): WLAGoalie[] => {
      const goalies: WLAGoalie[] = [];

      if (!data || typeof data !== "object") {
        return goalies;
      }

      // Handle array of goalies directly
      if (Array.isArray(data)) {
        for (const item of data) {
          const goalie = parseGoalieObject(item);
          if (goalie) {
            goalies.push(goalie);
          }
        }
        return goalies;
      }

      // Handle nested structures
      const obj = data as Record<string, unknown>;

      // Look for common goalie array keys
      const goalieKeys = [
        "goalies",
        "goaltending",
        "goalieStats",
        "goalkeepers",
      ];
      for (const key of goalieKeys) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            const goalie = parseGoalieObject(item);
            if (goalie) {
              goalies.push(goalie);
            }
          }
        }
      }

      return goalies;
    };

    /**
     * Parses a single goalie object from JSON data.
     */
    const parseGoalieObject = (item: unknown): WLAGoalie | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const obj = item as Record<string, unknown>;

      // Need at least a name or ID
      const id =
        safeString(obj.id) ||
        safeString(obj.goalie_id) ||
        safeString(obj.goalieId);
      const name =
        safeString(obj.name) ||
        safeString(obj.full_name) ||
        safeString(obj.fullName) ||
        safeString(obj.goalie_name);

      if (!id && !name) {
        return null;
      }

      const firstName =
        safeStringOrNull(obj.first_name) ?? safeStringOrNull(obj.firstName);
      const lastName =
        safeStringOrNull(obj.last_name) ?? safeStringOrNull(obj.lastName);

      // Parse stats
      const stats = (obj.stats ?? obj) as Record<string, unknown>;
      const gamesPlayed = Number(stats.games_played ?? stats.gp ?? 0) || 0;
      const wins = Number(stats.wins ?? stats.w ?? 0) || 0;
      const losses = Number(stats.losses ?? stats.l ?? 0) || 0;
      const ties = Number(stats.ties ?? stats.t ?? stats.otl ?? 0) || 0;
      const goalsAgainst = Number(stats.goals_against ?? stats.ga ?? 0) || 0;
      const saves = Number(stats.saves ?? stats.sv ?? 0) || 0;
      const shotsAgainst =
        Number(stats.shots_against ?? stats.sa ?? 0) || goalsAgainst + saves;
      const gaa = Number(stats.gaa ?? 0) || 0;
      const savePct =
        Number(stats.save_pct ?? stats.svpct ?? stats.sv_pct ?? 0) || 0;
      const shutouts = Number(stats.shutouts ?? stats.so ?? 0) || 0;

      return new WLAGoalie({
        id: id || name.toLowerCase().replaceAll(/\s+/g, "-"),
        first_name: firstName,
        last_name: lastName,
        full_name: name || null,
        jersey_number:
          safeStringOrNull(obj.jersey_number) ??
          safeStringOrNull(obj.jerseyNumber),
        team_id: safeStringOrNull(obj.team_id),
        team_code: safeStringOrNull(obj.team_code),
        team_name: safeStringOrNull(obj.team_name),
        stats: new WLAGoalieStats({
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
        }),
      });
    };

    /**
     * Helper to extract players from embedded JSON data structures.
     * Handles various formats that SPAs might use.
     */
    const extractPlayersFromData = (data: unknown): WLAPlayer[] => {
      const players: WLAPlayer[] = [];

      if (!data || typeof data !== "object") {
        return players;
      }

      // Handle array of players directly
      if (Array.isArray(data)) {
        for (const item of data) {
          const player = parsePlayerObject(item);
          if (player) {
            players.push(player);
          }
        }
        return players;
      }

      // Handle nested structures
      const obj = data as Record<string, unknown>;

      // Look for common player array keys
      const playerKeys = [
        "players",
        "leaders",
        "stats",
        "playerStats",
        "scoring",
      ];
      for (const key of playerKeys) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            const player = parsePlayerObject(item);
            if (player) {
              players.push(player);
            }
          }
        }
      }

      return players;
    };

    /**
     * Parses a single player object from JSON data.
     */
    const parsePlayerObject = (item: unknown): WLAPlayer | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const obj = item as Record<string, unknown>;

      // Need at least a name or ID
      const id =
        safeString(obj.id) ||
        safeString(obj.player_id) ||
        safeString(obj.playerId);
      const name =
        safeString(obj.name) ||
        safeString(obj.full_name) ||
        safeString(obj.fullName) ||
        safeString(obj.player_name);

      if (!id && !name) {
        return null;
      }

      const firstName =
        safeStringOrNull(obj.first_name) ?? safeStringOrNull(obj.firstName);
      const lastName =
        safeStringOrNull(obj.last_name) ?? safeStringOrNull(obj.lastName);

      // Parse stats
      const stats = (obj.stats ?? obj) as Record<string, unknown>;
      const gamesPlayed = Number(stats.games_played ?? stats.gp ?? 0) || 0;
      const goals = Number(stats.goals ?? stats.g ?? 0) || 0;
      const assists = Number(stats.assists ?? stats.a ?? 0) || 0;
      const points = Number(stats.points ?? stats.pts ?? 0) || 0;
      const penaltyMinutes =
        Number(stats.penalty_minutes ?? stats.pim ?? 0) || 0;
      const ppg = stats.ppg != null ? Number(stats.ppg) || null : null;
      const shg = stats.shg != null ? Number(stats.shg) || null : null;
      const gwg = stats.gwg != null ? Number(stats.gwg) || null : null;
      const scoringPct =
        stats.scoring_pct != null ? Number(stats.scoring_pct) || null : null;

      return new WLAPlayer({
        id: id || name.toLowerCase().replaceAll(/\s+/g, "-"),
        first_name: firstName,
        last_name: lastName,
        full_name: name || null,
        jersey_number:
          safeStringOrNull(obj.jersey_number) ??
          safeStringOrNull(obj.jerseyNumber),
        position: safeStringOrNull(obj.position),
        team_id: safeStringOrNull(obj.team_id),
        team_code: safeStringOrNull(obj.team_code),
        team_name: safeStringOrNull(obj.team_name),
        stats: new WLAPlayerStats({
          games_played: gamesPlayed,
          goals,
          assists,
          points,
          penalty_minutes: penaltyMinutes,
          ppg,
          shg,
          gwg,
          scoring_pct: scoringPct,
        }),
      });
    };

    /**
     * Fetches standings for a given WLA season.
     * Scrapes the standings page for team standings data.
     * Note: WLA uses Pointstreak SPA which requires parsing embedded data.
     *
     * @param input - Request containing the seasonId (year like 2024)
     * @returns Array of WLAStanding objects
     */
    const getStandings = (
      input: typeof WLAStandingsRequest.Encoded,
    ): Effect.Effect<
      readonly WLAStanding[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(WLAStandingsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Get the Pointstreak season ID for the given year
        const pointstreakSeasonId = yield* getSeasonIdFromYear(
          request.seasonId,
        );

        // Fetch the standings page which may contain embedded data
        const url = `${wlaConfig.statsUrl}#/${WLA_LEAGUE_ID}/standings?season_id=${pointstreakSeasonId}`;
        const html = yield* fetchPageWithRetry(url);

        const doc = $.load(html);
        const standings: WLAStanding[] = [];
        const seenTeams = new Set<string>();

        // Try to extract embedded JSON data from script tags
        // SPAs often include initial state as __INITIAL_STATE__ or similar
        doc("script").each((_index, element) => {
          const scriptContent = doc(element).html() ?? "";

          // Look for embedded standings data in various formats
          const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
            /window\.initialData\s*=\s*(\{[\s\S]*?\});/,
            /"standings"\s*:\s*(\[[\s\S]*?\])/,
            /"teams"\s*:\s*(\[[\s\S]*?\])/,
          ];

          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match?.[1]) {
              try {
                const data = JSON.parse(match[1]) as unknown;
                // Try to extract standings data from the parsed JSON
                const extractedStandings = extractStandingsFromData(data);
                for (const standing of extractedStandings) {
                  if (!seenTeams.has(standing.team_id)) {
                    seenTeams.add(standing.team_id);
                    standings.push(standing);
                  }
                }
              } catch {
                // JSON parse failed, continue to next pattern
              }
            }
          }
        });

        // Try to parse any visible HTML tables (in case server-side rendering is enabled)
        doc("table").each((_tableIndex, table) => {
          const headerRow = doc(table).find("tr").first();
          const headers = headerRow
            .find("th, td")
            .map((_i, el) => doc(el).text().trim().toLowerCase())
            .get();

          // Check if this is a standings table
          const hasTeam = headers.some(
            (h) => h === "team" || h === "tm" || h.includes("team name"),
          );
          const hasGP = headers.some((h) => h === "gp" || h === "games");
          const hasW = headers.some((h) => h === "w" || h === "wins");
          const hasL = headers.some((h) => h === "l" || h === "losses");

          if (!(hasTeam && hasGP && hasW && hasL)) {
            return; // Not a standings table, skip
          }

          // Find column indices
          const teamIdx = headers.findIndex(
            (h) => h === "team" || h === "tm" || h.includes("team name"),
          );
          const gpIdx = headers.findIndex((h) => h === "gp" || h === "games");
          const wIdx = headers.findIndex((h) => h === "w" || h === "wins");
          const lIdx = headers.findIndex((h) => h === "l" || h === "losses");
          const tIdx = headers.findIndex(
            (h) => h === "t" || h === "ties" || h === "otl",
          );
          const gfIdx = headers.findIndex(
            (h) => h === "gf" || h === "goals for",
          );
          const gaIdx = headers.findIndex(
            (h) => h === "ga" || h === "goals against",
          );
          const diffIdx = headers.findIndex(
            (h) => h === "diff" || h === "gd" || h === "goal diff",
          );
          const pctIdx = headers.findIndex(
            (h) => h === "pct" || h === "win%" || h.includes("win pct"),
          );

          // Parse data rows
          let position = 1;
          doc(table)
            .find("tr")
            .slice(1)
            .each((_rowIndex, row) => {
              const cells = doc(row)
                .find("td")
                .map((_i, el) => doc(el))
                .get();

              if (cells.length < Math.max(teamIdx, gpIdx, wIdx, lIdx) + 1) {
                return; // Skip malformed rows
              }

              const teamCell = cells[teamIdx];
              const teamName = teamCell?.text().trim() ?? "";

              if (!teamName) {
                return; // Skip empty rows
              }

              // Generate team ID from name
              const teamId = teamName.toLowerCase().replaceAll(/\s+/g, "-");

              if (seenTeams.has(teamId)) {
                return; // Skip duplicates
              }
              seenTeams.add(teamId);

              // Parse stats
              const gamesPlayed =
                Number.parseInt(cells[gpIdx]?.text().trim() ?? "0", 10) || 0;
              const wins =
                Number.parseInt(cells[wIdx]?.text().trim() ?? "0", 10) || 0;
              const losses =
                Number.parseInt(cells[lIdx]?.text().trim() ?? "0", 10) || 0;
              const ties =
                tIdx >= 0
                  ? Number.parseInt(cells[tIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const goalsFor =
                gfIdx >= 0
                  ? Number.parseInt(cells[gfIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const goalsAgainst =
                gaIdx >= 0
                  ? Number.parseInt(cells[gaIdx]?.text().trim() ?? "0", 10) || 0
                  : 0;
              const goalDiff =
                diffIdx >= 0
                  ? Number.parseInt(cells[diffIdx]?.text().trim() ?? "0", 10) ||
                    0
                  : goalsFor - goalsAgainst;
              const winPct =
                pctIdx >= 0
                  ? Number.parseFloat(
                      cells[pctIdx]?.text().trim().replace("%", "") ?? "0",
                    ) || 0
                  : gamesPlayed > 0
                    ? (wins / gamesPlayed) * 100
                    : 0;

              standings.push(
                new WLAStanding({
                  team_id: teamId,
                  team_name: teamName,
                  position,
                  wins,
                  losses,
                  ties,
                  games_played: gamesPlayed,
                  goals_for: goalsFor,
                  goals_against: goalsAgainst,
                  goal_diff: goalDiff,
                  win_pct: winPct,
                }),
              );

              position++;
            });
        });

        // Sort by position
        standings.sort((a, b) => a.position - b.position);

        // Note: If no standings found, the WLA stats page is likely a SPA
        // that loads data via authenticated API calls. The extractor
        // will handle this gracefully by reporting 0 standings for now.
        // Future enhancement: Use browser automation or API tokens.

        return standings;
      }).pipe(
        Effect.tap((standings) =>
          Effect.log(
            `Fetched ${standings.length} standings for WLA season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Helper to extract standings from embedded JSON data structures.
     * Handles various formats that SPAs might use.
     */
    const extractStandingsFromData = (data: unknown): WLAStanding[] => {
      const standings: WLAStanding[] = [];

      if (!data || typeof data !== "object") {
        return standings;
      }

      // Handle array of standings directly
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const standing = parseStandingObject(data[i], i + 1);
          if (standing) {
            standings.push(standing);
          }
        }
        return standings;
      }

      // Handle nested structures
      const obj = data as Record<string, unknown>;

      // Look for common standings array keys
      const standingsKeys = [
        "standings",
        "teams",
        "teamStandings",
        "division",
        "records",
      ];
      for (const key of standingsKeys) {
        if (Array.isArray(obj[key])) {
          for (let i = 0; i < obj[key].length; i++) {
            const standing = parseStandingObject(obj[key][i], i + 1);
            if (standing) {
              standings.push(standing);
            }
          }
        }
      }

      return standings;
    };

    /**
     * Parses a single standing object from JSON data.
     */
    const parseStandingObject = (
      item: unknown,
      defaultPosition: number,
    ): WLAStanding | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const obj = item as Record<string, unknown>;

      // Need at least a team name or ID
      const id =
        safeString(obj.id) || safeString(obj.team_id) || safeString(obj.teamId);
      const name =
        safeString(obj.name) ||
        safeString(obj.team_name) ||
        safeString(obj.teamName) ||
        safeString(obj.team);

      if (!id && !name) {
        return null;
      }

      // Parse standings data
      const position =
        Number(obj.position ?? obj.rank ?? defaultPosition) || defaultPosition;
      const gamesPlayed =
        Number(obj.games_played ?? obj.gp ?? obj.games ?? 0) || 0;
      const wins = Number(obj.wins ?? obj.w ?? 0) || 0;
      const losses = Number(obj.losses ?? obj.l ?? 0) || 0;
      const ties = Number(obj.ties ?? obj.t ?? obj.otl ?? 0) || 0;
      const goalsFor = Number(obj.goals_for ?? obj.gf ?? 0) || 0;
      const goalsAgainst = Number(obj.goals_against ?? obj.ga ?? 0) || 0;
      const goalDiff =
        Number(obj.goal_diff ?? obj.diff ?? obj.gd ?? 0) ||
        goalsFor - goalsAgainst;
      const winPct =
        Number(obj.win_pct ?? obj.pct ?? obj.winPct ?? 0) ||
        (gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0);

      return new WLAStanding({
        team_id: id || name.toLowerCase().replaceAll(/\s+/g, "-"),
        team_name: name || null,
        position,
        wins,
        losses,
        ties,
        games_played: gamesPlayed,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        goal_diff: goalDiff,
        win_pct: winPct,
      });
    };

    /**
     * Fetches the schedule/game results for a given WLA season.
     * Scrapes the schedule page for game data.
     * Note: WLA uses Pointstreak SPA which requires parsing embedded data.
     *
     * @param input - Request containing the seasonId (year like 2024)
     * @returns Array of WLAGame objects
     */
    const getSchedule = (
      input: typeof WLAScheduleRequest.Encoded,
    ): Effect.Effect<
      readonly WLAGame[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(WLAScheduleRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Get the Pointstreak season ID for the given year
        const pointstreakSeasonId = yield* getSeasonIdFromYear(
          request.seasonId,
        );

        // Fetch the schedule page which may contain embedded data
        const url = `${wlaConfig.statsUrl}#/${WLA_LEAGUE_ID}/schedule?season_id=${pointstreakSeasonId}`;
        const html = yield* fetchPageWithRetry(url);

        const doc = $.load(html);
        const games: WLAGame[] = [];
        const seenIds = new Set<string>();

        // Try to extract embedded JSON data from script tags
        // SPAs often include initial state as __INITIAL_STATE__ or similar
        doc("script").each((_index, element) => {
          const scriptContent = doc(element).html() ?? "";

          // Look for embedded schedule data in various formats
          const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/,
            /window\.initialData\s*=\s*(\{[\s\S]*?\});/,
            /"schedule"\s*:\s*(\[[\s\S]*?\])/,
            /"games"\s*:\s*(\[[\s\S]*?\])/,
          ];

          for (const pattern of patterns) {
            const match = scriptContent.match(pattern);
            if (match?.[1]) {
              try {
                const data = JSON.parse(match[1]) as unknown;
                // Try to extract game data from the parsed JSON
                const extractedGames = extractGamesFromData(data);
                for (const game of extractedGames) {
                  if (!seenIds.has(game.id)) {
                    seenIds.add(game.id);
                    games.push(game);
                  }
                }
              } catch {
                // JSON parse failed, continue to next pattern
              }
            }
          }
        });

        // Try to parse any visible HTML tables (in case server-side rendering is enabled)
        doc("table").each((_tableIndex, table) => {
          const headerRow = doc(table).find("tr").first();
          const headers = headerRow
            .find("th, td")
            .map((_i, el) => doc(el).text().trim().toLowerCase())
            .get();

          // Check if this is a schedule/game table
          const hasDate = headers.some(
            (h) => h === "date" || h === "game date" || h.includes("date"),
          );
          const hasHome = headers.some(
            (h) => h === "home" || h === "home team" || h.includes("home"),
          );
          const hasAway = headers.some(
            (h) =>
              h === "away" ||
              h === "visitor" ||
              h === "away team" ||
              h.includes("away") ||
              h.includes("visitor"),
          );
          const hasScore = headers.some(
            (h) => h === "score" || h === "final" || h.includes("score"),
          );

          if (!(hasDate || (hasHome && hasAway))) {
            return; // Not a schedule table, skip
          }

          // Find column indices
          const dateIdx = headers.findIndex(
            (h) => h === "date" || h === "game date" || h.includes("date"),
          );
          const homeIdx = headers.findIndex(
            (h) => h === "home" || h === "home team" || h.includes("home"),
          );
          const awayIdx = headers.findIndex(
            (h) =>
              h === "away" ||
              h === "visitor" ||
              h === "away team" ||
              h.includes("away") ||
              h.includes("visitor"),
          );
          const scoreIdx = headers.findIndex(
            (h) => h === "score" || h === "final" || h.includes("score"),
          );
          const venueIdx = headers.findIndex(
            (h) =>
              h === "venue" ||
              h === "location" ||
              h === "arena" ||
              h === "rink",
          );
          const statusIdx = headers.findIndex(
            (h) => h === "status" || h === "type" || h === "game type",
          );

          // Parse data rows
          let gameIndex = 0;
          doc(table)
            .find("tr")
            .slice(1)
            .each((_rowIndex, row) => {
              const cells = doc(row)
                .find("td")
                .map((_i, el) => doc(el))
                .get();

              // Skip rows with insufficient cells
              const minCols = Math.max(homeIdx, awayIdx, 0) + 1;
              if (cells.length < minCols) {
                return;
              }

              // Extract date
              const dateCell = dateIdx >= 0 ? cells[dateIdx] : null;
              const date = dateCell?.text().trim() ?? null;

              // Extract teams
              const homeCell = homeIdx >= 0 ? cells[homeIdx] : null;
              const awayCell = awayIdx >= 0 ? cells[awayIdx] : null;
              const homeTeamName = homeCell?.text().trim() ?? null;
              const awayTeamName = awayCell?.text().trim() ?? null;

              if (!homeTeamName && !awayTeamName) {
                return; // Skip rows without team data
              }

              // Extract scores
              let homeScore = 0;
              let awayScore = 0;

              if (scoreIdx >= 0) {
                const scoreCell = cells[scoreIdx];
                const scoreText = scoreCell?.text().trim() ?? "";
                // Score format: "5-3" or "5 - 3" or separate columns
                const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
                if (scoreMatch) {
                  homeScore = Number.parseInt(scoreMatch[1] ?? "0", 10);
                  awayScore = Number.parseInt(scoreMatch[2] ?? "0", 10);
                }
              }

              // Extract venue
              const venueCell = venueIdx >= 0 ? cells[venueIdx] : null;
              const venue = venueCell?.text().trim() ?? null;

              // Extract status
              const statusCell = statusIdx >= 0 ? cells[statusIdx] : null;
              const status = statusCell?.text().trim() ?? null;

              // Generate game ID
              const gameId = `${request.seasonId}-${gameIndex}`;
              gameIndex++;

              if (seenIds.has(gameId)) {
                return; // Skip duplicates
              }
              seenIds.add(gameId);

              games.push(
                new WLAGame({
                  id: gameId,
                  date,
                  status,
                  home_team_id: null, // Could derive from team name mapping
                  away_team_id: null,
                  home_team_name: homeTeamName,
                  away_team_name: awayTeamName,
                  home_score: homeScore,
                  away_score: awayScore,
                  venue,
                }),
              );
            });
        });

        // Note: If no games found, the WLA schedule page is likely a SPA
        // that loads data via authenticated API calls. The extractor
        // will handle this gracefully by reporting 0 games for now.
        // Future enhancement: Use browser automation or API tokens.

        return games;
      }).pipe(
        Effect.tap((games) =>
          Effect.log(
            `Fetched ${games.length} games for WLA season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Helper to extract games from embedded JSON data structures.
     * Handles various formats that SPAs might use.
     */
    const extractGamesFromData = (data: unknown): WLAGame[] => {
      const games: WLAGame[] = [];

      if (!data || typeof data !== "object") {
        return games;
      }

      // Handle array of games directly
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const game = parseGameObject(data[i], i);
          if (game) {
            games.push(game);
          }
        }
        return games;
      }

      // Handle nested structures
      const obj = data as Record<string, unknown>;

      // Look for common game array keys
      const gameKeys = ["games", "schedule", "scores", "matches", "results"];
      for (const key of gameKeys) {
        if (Array.isArray(obj[key])) {
          for (let i = 0; i < obj[key].length; i++) {
            const game = parseGameObject(obj[key][i], i);
            if (game) {
              games.push(game);
            }
          }
        }
      }

      return games;
    };

    /**
     * Parses a single game object from JSON data.
     */
    const parseGameObject = (item: unknown, index: number): WLAGame | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const obj = item as Record<string, unknown>;

      // Need at least some identifying info
      const id =
        safeString(obj.id) ||
        safeString(obj.game_id) ||
        safeString(obj.gameId) ||
        `game-${index}`;
      const date = safeStringOrNull(obj.date);
      const status = safeStringOrNull(obj.status);

      // Parse team info
      const homeTeamId =
        safeStringOrNull(obj.home_team_id) ?? safeStringOrNull(obj.homeTeamId);
      const awayTeamId =
        safeStringOrNull(obj.away_team_id) ??
        safeStringOrNull(obj.awayTeamId) ??
        safeStringOrNull(obj.visitor_team_id);
      const homeTeamName =
        safeStringOrNull(obj.home_team_name) ?? safeStringOrNull(obj.homeTeam);
      const awayTeamName =
        safeStringOrNull(obj.away_team_name) ??
        safeStringOrNull(obj.awayTeam) ??
        safeStringOrNull(obj.visitorTeam);

      // Parse scores
      const homeScore = Number(obj.home_score ?? obj.homeScore ?? 0) || 0;
      const awayScore =
        Number(obj.away_score ?? obj.awayScore ?? obj.visitor_score ?? 0) || 0;

      // Parse venue
      const venue =
        safeStringOrNull(obj.venue) ?? safeStringOrNull(obj.location);

      return new WLAGame({
        id,
        date,
        status,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        home_team_name: homeTeamName,
        away_team_name: awayTeamName,
        home_score: homeScore,
        away_score: awayScore,
        venue,
      });
    };

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
      getPlayers,
      getGoalies,
      getStandings,
      getSchedule,
    };
  }),
  dependencies: [WLAConfig.Default, PipelineConfig.Default],
}) {}
