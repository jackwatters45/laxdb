import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { MLLConfig, PipelineConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  type MLLGame,
  MLLGoalie,
  MLLGoaliesRequest,
  MLLPlayer,
  MLLPlayersRequest,
  MLLScheduleRequest,
  MLLStanding,
  MLLStandingsRequest,
  type MLLStatLeader,
  MLLStatLeadersRequest,
  MLLTeam,
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

    /**
     * Fetches all teams for a given MLL season year.
     * Parses the season home page to extract team links from standings/roster sections.
     *
     * @param input - Request containing the year (2001-2020)
     * @returns Array of MLLTeam objects
     */
    const getTeams = (
      input: typeof MLLTeamsRequest.Encoded,
    ): Effect.Effect<
      readonly MLLTeam[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MLLTeamsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        const path = `/lacrosse/l-MLL/y-${request.year}`;

        const html = yield* fetchStatscrewPageWithRetry(path);

        const doc = $.load(html);

        // Extract teams from the standings table on the season page
        // The page contains a table with team links in format: /lacrosse/stats/t-{TEAM_CODE}/y-{YEAR}
        const teams: MLLTeam[] = [];
        const seenIds = new Set<string>();

        // Find all links that match the team stats URL pattern
        doc('a[href*="/lacrosse/stats/t-MLL"]').each((_index, element) => {
          const href = doc(element).attr("href") ?? "";
          const teamMatch = href.match(
            /\/lacrosse\/stats\/t-(MLL[A-Z]{2,3})\/y-/,
          );
          const teamCode = teamMatch?.[1];

          if (teamCode) {
            // Skip if we've already seen this team
            if (seenIds.has(teamCode)) {
              return;
            }
            seenIds.add(teamCode);

            const teamName = doc(element).text().trim();

            teams.push(
              new MLLTeam({
                id: teamCode,
                name: teamName,
                city: null,
                abbreviation: teamCode.replace("MLL", ""),
                founded_year: null,
                final_year: null,
              }),
            );
          }
        });

        // If no teams found from stats links, try roster links
        if (teams.length === 0) {
          doc('a[href*="/lacrosse/roster/t-MLL"]').each((_index, element) => {
            const href = doc(element).attr("href") ?? "";
            const teamMatch = href.match(
              /\/lacrosse\/roster\/t-(MLL[A-Z]{2,3})\/y-/,
            );
            const teamCode = teamMatch?.[1];

            if (teamCode) {
              if (seenIds.has(teamCode)) {
                return;
              }
              seenIds.add(teamCode);

              const teamName = doc(element).text().trim();

              teams.push(
                new MLLTeam({
                  id: teamCode,
                  name: teamName,
                  city: null,
                  abbreviation: teamCode.replace("MLL", ""),
                  founded_year: null,
                  final_year: null,
                }),
              );
            }
          });
        }

        return teams;
      }).pipe(
        Effect.tap((teams) =>
          Effect.log(
            `Fetched ${teams.length} teams for MLL year ${input.year}`,
          ),
        ),
      );

    /**
     * Fetches all players for a given MLL season year.
     * Scrapes team stats pages to extract player scoring data.
     *
     * @param input - Request containing the year (2001-2020)
     * @returns Array of MLLPlayer objects with stats
     */
    const getPlayers = (
      input: typeof MLLPlayersRequest.Encoded,
    ): Effect.Effect<
      readonly MLLPlayer[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MLLPlayersRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // First get all teams for this year
        const teams = yield* getTeams({ year: request.year });

        if (teams.length === 0) {
          return [] as readonly MLLPlayer[];
        }

        // Fetch stats for each team and collect players
        const allPlayers: MLLPlayer[] = [];
        const seenPlayerIds = new Set<string>();

        for (const team of teams) {
          const path = `/lacrosse/stats/t-${team.id}/y-${request.year}`;

          const html = yield* fetchStatscrewPageWithRetry(path).pipe(
            Effect.catchTag("HttpError", (error) => {
              // 404 is expected for some teams (relocated/defunct)
              if (error.statusCode === 404) {
                return Effect.succeed("");
              }
              return Effect.fail(error);
            }),
          );

          if (!html) {
            continue;
          }

          const doc = $.load(html);

          // Find the scoring table (Regular Season)
          // Look for table with headers: Player, Pos, GP, G, A, Pts
          const tables = doc("table");

          tables.each((_tableIndex, table) => {
            const headerRow = doc(table).find("tr").first();
            const headers = headerRow
              .find("th, td")
              .map((_i, el) => doc(el).text().trim().toLowerCase())
              .get();

            // Check if this is a scoring table
            const hasGP = headers.includes("gp");
            const hasG = headers.includes("g");
            const hasA = headers.includes("a");
            const hasPts = headers.includes("pts");
            const hasPlayer =
              headers.includes("player") || headers.includes("name");

            if (!(hasGP && hasG && hasA && hasPts && hasPlayer)) {
              return; // Not a scoring table, skip
            }

            // Find column indices
            const playerIdx = headers.findIndex(
              (h) => h === "player" || h === "name",
            );
            const posIdx = headers.findIndex(
              (h) => h === "pos" || h === "pos.",
            );
            const gpIdx = headers.findIndex((h) => h === "gp");
            const gIdx = headers.findIndex((h) => h === "g");
            const aIdx = headers.findIndex((h) => h === "a");
            const ptsIdx = headers.findIndex((h) => h === "pts");
            const shIdx = headers.findIndex((h) => h === "sh");
            const shPctIdx = headers.findIndex(
              (h) => h === "sh%" || h === "s%",
            );
            const gbIdx = headers.findIndex((h) => h === "gb");
            const foIdx = headers.findIndex((h) => h === "fo");
            const fowIdx = headers.findIndex((h) => h === "fow");
            const foPctIdx = headers.findIndex((h) => h === "fo%");

            // Parse data rows (skip header row)
            doc(table)
              .find("tr")
              .slice(1)
              .each((_rowIndex, row) => {
                const cells = doc(row)
                  .find("td")
                  .map((_i, el) => doc(el))
                  .get();

                if (cells.length < Math.max(playerIdx, gpIdx, gIdx, aIdx) + 1) {
                  return; // Skip malformed rows
                }

                // Extract player info
                const playerCell = cells[playerIdx];
                const playerLink = playerCell?.find("a").attr("href") ?? "";
                const playerName = playerCell?.text().trim() ?? "";

                // Extract player ID from link
                // Format: /lacrosse/stats/p-{PLAYER_ID}
                const playerIdMatch = playerLink.match(
                  /\/lacrosse\/stats\/p-([a-z0-9]+)/i,
                );
                const playerId =
                  playerIdMatch?.[1] ??
                  playerName.toLowerCase().replaceAll(/\s+/g, "");

                if (!playerName || seenPlayerIds.has(playerId)) {
                  return; // Skip empty or duplicate players
                }
                seenPlayerIds.add(playerId);

                // Parse numeric values
                const parseNum = (idx: number): number => {
                  const text = cells[idx]?.text().trim() ?? "";
                  const num = Number.parseFloat(text);
                  return Number.isNaN(num) ? 0 : num;
                };

                const parseNullNum = (idx: number): number | null => {
                  if (idx < 0) return null;
                  const text = cells[idx]?.text().trim() ?? "";
                  if (!text) return null;
                  const num = Number.parseFloat(text);
                  return Number.isNaN(num) ? null : num;
                };

                const position =
                  posIdx >= 0 ? (cells[posIdx]?.text().trim() ?? null) : null;
                const gamesPlayed = parseNum(gpIdx);
                const goals = parseNum(gIdx);
                const assists = parseNum(aIdx);
                const points = parseNum(ptsIdx);

                // Optional stats
                const shots = parseNullNum(shIdx);
                const shotPct = parseNullNum(shPctIdx);
                const groundBalls = parseNullNum(gbIdx);
                const faceoffs = parseNullNum(foIdx);
                const faceoffsWon = parseNullNum(fowIdx);
                const faceoffPct = parseNullNum(foPctIdx);

                // Parse name into first/last
                const nameParts = playerName.split(" ");
                const firstName = nameParts[0] ?? null;
                const lastName = nameParts.slice(1).join(" ") || null;

                const player = new MLLPlayer({
                  id: playerId,
                  name: playerName,
                  first_name: firstName,
                  last_name: lastName,
                  position,
                  team_id: team.id,
                  team_name: team.name,
                  college: null,
                  stats: {
                    games_played: gamesPlayed,
                    goals,
                    assists,
                    points,
                    shots,
                    shot_pct: shotPct,
                    ground_balls: groundBalls,
                    caused_turnovers: null,
                    turnovers: null,
                    faceoffs_won: faceoffsWon,
                    faceoffs_lost:
                      faceoffs !== null && faceoffsWon !== null
                        ? faceoffs - faceoffsWon
                        : null,
                    faceoff_pct: faceoffPct,
                  },
                });

                allPlayers.push(player);
              });
          });
        }

        return allPlayers;
      }).pipe(
        Effect.tap((players) =>
          Effect.log(
            `Fetched ${players.length} players for MLL year ${input.year}`,
          ),
        ),
      );

    /**
     * Fetches standings for a given MLL season year.
     * Parses the season home page to extract standings data.
     *
     * @param input - Request containing the year (2001-2020)
     * @returns Array of MLLStanding objects
     */
    const getStandings = (
      input: typeof MLLStandingsRequest.Encoded,
    ): Effect.Effect<
      readonly MLLStanding[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MLLStandingsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        const path = `/lacrosse/l-MLL/y-${request.year}`;

        const html = yield* fetchStatscrewPageWithRetry(path);

        const doc = $.load(html);

        // Extract standings from the standings table on the season page
        // Look for table with headers: Team (or Position), W, L, GF, GA, Win%
        const standings: MLLStanding[] = [];

        const tables = doc("table");

        tables.each((_tableIndex, table) => {
          const headerRow = doc(table).find("tr").first();
          const headers = headerRow
            .find("th, td")
            .map((_i, el) => doc(el).text().trim().toLowerCase())
            .get();

          // Check if this is a standings table
          const hasW = headers.includes("w");
          const hasL = headers.includes("l");
          const hasGF = headers.includes("gf");
          const hasGA = headers.includes("ga");
          const hasTeam = headers.some(
            (h) =>
              h === "team" ||
              h === "club" ||
              h === "name" ||
              h === "" || // Sometimes team column has no header
              h.includes("team"),
          );

          // Must have W, L and (GF + GA)
          if (!(hasW && hasL && hasGF && hasGA && hasTeam)) {
            return; // Not a standings table, skip
          }

          // Find column indices
          const teamIdx = headers.findIndex(
            (h) =>
              h === "team" ||
              h === "club" ||
              h === "name" ||
              h === "" ||
              h.includes("team"),
          );
          const wIdx = headers.findIndex((h) => h === "w");
          const lIdx = headers.findIndex((h) => h === "l");
          const gfIdx = headers.findIndex((h) => h === "gf");
          const gaIdx = headers.findIndex((h) => h === "ga");
          const winPctIdx = headers.findIndex(
            (h) => h === "win%" || h === "pct" || h === "pct." || h === "w%",
          );

          // Parse data rows (skip header row)
          let position = 1;
          doc(table)
            .find("tr")
            .slice(1)
            .each((_rowIndex, row) => {
              const cells = doc(row)
                .find("td")
                .map((_i, el) => doc(el))
                .get();

              if (cells.length < Math.max(teamIdx, wIdx, lIdx) + 1) {
                return; // Skip malformed rows
              }

              // Extract team info
              const teamCell = cells[teamIdx];
              const teamLink = teamCell?.find("a").attr("href") ?? "";
              const teamName = teamCell?.text().trim() ?? "";

              // Extract team ID from link
              // Format: /lacrosse/stats/t-{TEAM_ID}/y-{YEAR}
              const teamIdMatch = teamLink.match(
                /\/lacrosse\/(?:stats|roster)\/t-(MLL[A-Z]{2,3})\/y-/,
              );
              const teamId =
                teamIdMatch?.[1] ?? `MLL${teamName.slice(0, 3).toUpperCase()}`;

              if (!teamName) {
                return; // Skip empty rows
              }

              // Parse numeric values
              const parseNum = (idx: number): number => {
                const text = cells[idx]?.text().trim() ?? "";
                const num = Number.parseFloat(text);
                return Number.isNaN(num) ? 0 : num;
              };

              const wins = parseNum(wIdx);
              const losses = parseNum(lIdx);
              const goalsFor = parseNum(gfIdx);
              const goalsAgainst = parseNum(gaIdx);

              // Calculate or extract win percentage
              let winPct: number;
              if (winPctIdx >= 0) {
                const pctText = cells[winPctIdx]?.text().trim() ?? "";
                const pct = Number.parseFloat(pctText);
                winPct = Number.isNaN(pct) ? 0 : pct;
                // If it looks like a percentage (e.g., "75%"), strip the %
                // If it's already decimal (e.g., ".750" or "0.750"), use as-is
                if (winPct > 1) {
                  winPct = winPct / 100;
                }
              } else {
                // Calculate from W/L
                const totalGames = wins + losses;
                winPct = totalGames > 0 ? wins / totalGames : 0;
              }

              const standing = new MLLStanding({
                team_id: teamId,
                team_name: teamName,
                position,
                wins,
                losses,
                games_played: wins + losses,
                goals_for: goalsFor,
                goals_against: goalsAgainst,
                goal_diff: goalsFor - goalsAgainst,
                win_pct: winPct,
              });

              standings.push(standing);
              position++;
            });
        });

        return standings;
      }).pipe(
        Effect.tap((standings) =>
          Effect.log(
            `Fetched ${standings.length} standings for MLL year ${input.year}`,
          ),
        ),
      );

    /**
     * Fetches all goalies for a given MLL season year.
     * Scrapes team stats pages to extract goalie data.
     *
     * @param input - Request containing the year (2001-2020)
     * @returns Array of MLLGoalie objects with stats
     */
    const getGoalies = (
      input: typeof MLLGoaliesRequest.Encoded,
    ): Effect.Effect<
      readonly MLLGoalie[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MLLGoaliesRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // First get all teams for this year
        const teams = yield* getTeams({ year: request.year });

        if (teams.length === 0) {
          return [] as readonly MLLGoalie[];
        }

        // Fetch stats for each team and collect goalies
        const allGoalies: MLLGoalie[] = [];
        const seenGoalieIds = new Set<string>();

        for (const team of teams) {
          const path = `/lacrosse/stats/t-${team.id}/y-${request.year}`;

          const html = yield* fetchStatscrewPageWithRetry(path).pipe(
            Effect.catchTag("HttpError", (error) => {
              // 404 is expected for some teams (relocated/defunct)
              if (error.statusCode === 404) {
                return Effect.succeed("");
              }
              return Effect.fail(error);
            }),
          );

          if (!html) {
            continue;
          }

          const doc = $.load(html);

          // Find the goalie table
          // Look for table with headers: Player, GP, W, L, GA, Svs, GAA, Sv%
          const tables = doc("table");

          tables.each((_tableIndex, table) => {
            const headerRow = doc(table).find("tr").first();
            const headers = headerRow
              .find("th, td")
              .map((_i, el) => doc(el).text().trim().toLowerCase())
              .get();

            // Check if this is a goalie table
            const hasGP = headers.includes("gp");
            const hasW = headers.includes("w");
            const hasL = headers.includes("l");
            const hasGA = headers.includes("ga");
            const hasSvs = headers.includes("svs") || headers.includes("saves");
            const hasPlayer =
              headers.includes("player") || headers.includes("name");

            // Must have goalie-specific stats (W, L) plus GA or Svs
            if (!(hasGP && hasW && hasL && (hasGA || hasSvs) && hasPlayer)) {
              return; // Not a goalie table, skip
            }

            // Make sure it's NOT a player scoring table (which has G, A, Pts)
            const hasGoals = headers.includes("g") && !headers.includes("ga");
            const hasAssists = headers.includes("a");
            const hasPts = headers.includes("pts");

            if (hasGoals && hasAssists && hasPts) {
              return; // This is a player scoring table, skip
            }

            // Find column indices
            const playerIdx = headers.findIndex(
              (h) => h === "player" || h === "name",
            );
            const gpIdx = headers.findIndex((h) => h === "gp");
            const wIdx = headers.findIndex((h) => h === "w");
            const lIdx = headers.findIndex((h) => h === "l");
            const gaIdx = headers.findIndex((h) => h === "ga");
            const svsIdx = headers.findIndex(
              (h) => h === "svs" || h === "saves",
            );
            const gaaIdx = headers.findIndex((h) => h === "gaa");
            const svPctIdx = headers.findIndex(
              (h) => h === "sv%" || h === "svpct" || h === "sv pct",
            );

            // Parse data rows (skip header row)
            doc(table)
              .find("tr")
              .slice(1)
              .each((_rowIndex, row) => {
                const cells = doc(row)
                  .find("td")
                  .map((_i, el) => doc(el))
                  .get();

                if (cells.length < Math.max(playerIdx, gpIdx, wIdx, lIdx) + 1) {
                  return; // Skip malformed rows
                }

                // Extract goalie info
                const playerCell = cells[playerIdx];
                const playerLink = playerCell?.find("a").attr("href") ?? "";
                const playerName = playerCell?.text().trim() ?? "";

                // Extract player ID from link
                // Format: /lacrosse/stats/p-{PLAYER_ID}
                const playerIdMatch = playerLink.match(
                  /\/lacrosse\/stats\/p-([a-z0-9]+)/i,
                );
                const goalieId =
                  playerIdMatch?.[1] ??
                  playerName.toLowerCase().replaceAll(/\s+/g, "");

                if (!playerName || seenGoalieIds.has(goalieId)) {
                  return; // Skip empty or duplicate goalies
                }
                seenGoalieIds.add(goalieId);

                // Parse numeric values
                const parseNum = (idx: number): number => {
                  const text = cells[idx]?.text().trim() ?? "";
                  const num = Number.parseFloat(text);
                  return Number.isNaN(num) ? 0 : num;
                };

                const parseNullNum = (idx: number): number | null => {
                  if (idx < 0) return null;
                  const text = cells[idx]?.text().trim() ?? "";
                  if (!text) return null;
                  const num = Number.parseFloat(text);
                  return Number.isNaN(num) ? null : num;
                };

                const gamesPlayed = parseNum(gpIdx);
                const wins = parseNum(wIdx);
                const losses = parseNum(lIdx);
                const goalsAgainst = gaIdx >= 0 ? parseNum(gaIdx) : 0;
                const saves = svsIdx >= 0 ? parseNum(svsIdx) : 0;

                // Optional stats
                const gaa = parseNullNum(gaaIdx);
                const savePct = parseNullNum(svPctIdx);

                // Parse name into first/last
                const nameParts = playerName.split(" ");
                const firstName = nameParts[0] ?? null;
                const lastName = nameParts.slice(1).join(" ") || null;

                const goalie = new MLLGoalie({
                  id: goalieId,
                  name: playerName,
                  first_name: firstName,
                  last_name: lastName,
                  team_id: team.id,
                  team_name: team.name,
                  stats: {
                    games_played: gamesPlayed,
                    wins,
                    losses,
                    goals_against: goalsAgainst,
                    saves,
                    gaa,
                    save_pct: savePct,
                  },
                });

                allGoalies.push(goalie);
              });
          });
        }

        return allGoalies;
      }).pipe(
        Effect.tap((goalies) =>
          Effect.log(
            `Fetched ${goalies.length} goalies for MLL year ${input.year}`,
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

      // Public API methods
      getTeams,
      getPlayers,
      getGoalies,
      getStandings,

      // Type exports for method signatures (to be implemented)
      _types: {
        mapParseError,
      } as const,
    };
  }),
  dependencies: [MLLConfig.Default, PipelineConfig.Default],
}) {}
