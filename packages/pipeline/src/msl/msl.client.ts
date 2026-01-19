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

    // Re-export cheerio for potential future HTML parsing needs
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

        // Fetch standings from Gamesheet internal API which contains team data
        const path = `/api/useStandings/getDivisionStandings/${request.seasonId}`;
        const response = yield* fetchGamesheetPageWithRetry(path);

        // Parse JSON response - returns array of divisions with nested tableData
        interface TeamTitle {
          title: string;
          id: number;
        }

        interface StandingsTableData {
          teamTitles?: TeamTitle[];
          teamLogos?: (string | null)[];
          teamIds?: number[];
        }

        interface StandingsApiResponse {
          tableData?: StandingsTableData;
        }

        let data: StandingsApiResponse | StandingsApiResponse[];
        try {
          data = JSON.parse(response) as
            | StandingsApiResponse
            | StandingsApiResponse[];
        } catch {
          return yield* Effect.fail(
            new ParseError({
              message: `Failed to parse standings API response as JSON`,
              cause: response.slice(0, 200),
            }),
          );
        }

        // Normalize to array (single division returns object, multiple returns array)
        const divisions = Array.isArray(data) ? data : [data];

        const teams: MSLTeam[] = [];
        const seenIds = new Set<string>();

        for (const division of divisions) {
          const tableData = division.tableData ?? {};
          const teamTitles = tableData.teamTitles ?? [];
          const teamLogos = tableData.teamLogos ?? [];
          const teamIds = tableData.teamIds ?? [];

          for (let i = 0; i < teamTitles.length; i++) {
            const teamInfo = teamTitles[i];
            const teamId = teamIds[i] ?? teamInfo?.id;
            const teamName = teamInfo?.title ?? null;
            const logoUrl = teamLogos[i] ?? null;

            if (teamId === undefined || !teamName) {
              continue;
            }

            const teamIdStr = String(teamId);

            // Skip if we've already seen this team (in case of multiple divisions)
            if (seenIds.has(teamIdStr)) {
              continue;
            }
            seenIds.add(teamIdStr);

            teams.push(
              new MSLTeam({
                id: teamIdStr,
                name: teamName,
                city: null, // Gamesheet doesn't expose city separately
                abbreviation: null, // Not available in API
                logo_url: logoUrl,
                website_url: null,
              }),
            );
          }
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

          // Parse JSON response - data is wrapped in tableData object
          interface DataWrapper<T> {
            data: T;
            subData?: unknown[][];
          }
          interface TeamNameEntry {
            title: string;
            id: number;
          }
          interface PlayerApiResponse {
            tableData?: {
              names?: { firstName: string; lastName: string; id: number }[];
              ids?: number[];
              teamNames?: { data: TeamNameEntry[][] };
              jersey?: DataWrapper<(string | number | null)[]>;
              positions?: DataWrapper<string[][]>;
              gp?: DataWrapper<number[]>;
              g?: DataWrapper<number[]>;
              a?: DataWrapper<number[]>;
              pts?: DataWrapper<number[]>;
              pim?: DataWrapper<number[]>;
              ppg?: DataWrapper<number[]>;
              ppa?: DataWrapper<number[]>;
              shg?: DataWrapper<number[]>;
              sha?: DataWrapper<number[]>;
              gwg?: DataWrapper<number[]>;
              fg?: DataWrapper<number[]>;
              otg?: DataWrapper<number[]>;
            };
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

          // Check if we have data - names is directly under tableData
          const tableData = data.tableData ?? {};
          const names = tableData.names ?? [];
          if (names.length === 0) {
            hasMore = false;
            break;
          }

          // Parse each player from the parallel arrays
          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const playerId = tableData.ids?.[i] ?? name?.id ?? i;
            const firstName = name?.firstName ?? null;
            const lastName = name?.lastName ?? null;
            const fullName =
              firstName && lastName
                ? `${firstName} ${lastName}`
                : (firstName ?? lastName ?? `Player ${playerId}`);

            // teamNames.data is array of arrays, each containing team objects
            const teamData = tableData.teamNames?.data?.[i];
            const teamInfo = teamData?.[0];
            // jersey and positions are wrapped in { data: [...] }
            const jersey = tableData.jersey?.data?.[i];
            const positionArr = tableData.positions?.data?.[i];
            const position = positionArr?.[0] ?? null;

            // Build stats - all wrapped in { data: [...] }
            const gamesPlayed = tableData.gp?.data?.[i] ?? 0;
            const goals = tableData.g?.data?.[i] ?? 0;
            const assists = tableData.a?.data?.[i] ?? 0;
            const points = tableData.pts?.data?.[i] ?? 0;
            const penaltyMinutes = tableData.pim?.data?.[i] ?? 0;
            const pointsPerGame =
              gamesPlayed > 0
                ? Math.round((points / gamesPlayed) * 100) / 100
                : 0;
            const ppg = tableData.ppg?.data?.[i] ?? null;
            const ppa = tableData.ppa?.data?.[i] ?? null;
            const shg = tableData.shg?.data?.[i] ?? null;
            const sha = tableData.sha?.data?.[i] ?? null;
            const gwg = tableData.gwg?.data?.[i] ?? null;
            const fg = tableData.fg?.data?.[i] ?? null;
            const otg = tableData.otg?.data?.[i] ?? null;

            const player = new MSLPlayer({
              id: String(playerId),
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              jersey_number:
                jersey !== null && jersey !== undefined ? String(jersey) : null,
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
          const path = `/api/useGoalies/getGoalieStandings/${request.seasonId}?filter[gametype]=overall&filter[sort]=-svpct&filter[limit]=${pageSize}&filter[offset]=${offset}`;

          const response = yield* fetchGamesheetPageWithRetry(path);

          // Parse JSON response - data is wrapped in tableData object
          interface DataWrapper<T> {
            data: T;
            subData?: unknown[][];
          }
          interface TeamNameEntry {
            title: string;
            id: number;
          }
          interface GoalieApiResponse {
            tableData?: {
              names?: { firstName: string; lastName: string; id: number }[];
              ids?: number[];
              teamNames?: { data: TeamNameEntry[][] };
              jersey?: DataWrapper<(string | number | null)[]>;
              gp?: DataWrapper<number[]>;
              wins?: DataWrapper<number[]>;
              losses?: DataWrapper<number[]>;
              ties?: DataWrapper<number[]>;
              ga?: DataWrapper<number[]>;
              sa?: DataWrapper<number[]>;
              gaa?: DataWrapper<(number | string)[]>;
              svpct?: DataWrapper<(number | string)[]>;
              so?: DataWrapper<number[]>;
              ice_time?: DataWrapper<number[]>;
            };
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

          // Check if we have data - names is directly under tableData
          const tableData = data.tableData ?? {};
          const names = tableData.names ?? [];
          if (names.length === 0) {
            hasMore = false;
            break;
          }

          // Parse each goalie from the parallel arrays
          for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const goalieId = tableData.ids?.[i] ?? name?.id ?? i;
            const firstName = name?.firstName?.trim() ?? null;
            const lastName = name?.lastName?.trim() ?? null;
            const fullName =
              firstName && lastName
                ? `${firstName} ${lastName}`
                : (firstName ?? lastName ?? `Goalie ${goalieId}`);

            // teamNames.data is array of arrays, each containing team objects
            const teamData = tableData.teamNames?.data?.[i];
            const teamInfo = teamData?.[0];
            // jersey is wrapped in { data: [...] }
            const jersey = tableData.jersey?.data?.[i];

            // Build stats - all wrapped in { data: [...] }
            const gamesPlayed = tableData.gp?.data?.[i] ?? 0;
            const wins = tableData.wins?.data?.[i] ?? 0;
            const losses = tableData.losses?.data?.[i] ?? 0;
            const ties = tableData.ties?.data?.[i] ?? 0;
            const goalsAgainst = tableData.ga?.data?.[i] ?? 0;
            const shotsAgainst = tableData.sa?.data?.[i] ?? 0;
            const saves = shotsAgainst - goalsAgainst; // Calculate saves from shots against minus goals against
            const gaaVal = tableData.gaa?.data?.[i] ?? 0;
            const gaa =
              typeof gaaVal === "string" ? parseFloat(gaaVal) : gaaVal;
            const svpctVal = tableData.svpct?.data?.[i] ?? 0;
            const savePct =
              typeof svpctVal === "string" ? parseFloat(svpctVal) : svpctVal;
            const shutouts = tableData.so?.data?.[i] ?? 0;
            const minutes = tableData.ice_time?.data?.[i] ?? 0;

            const goalie = new MSLGoalie({
              id: String(goalieId),
              name: fullName,
              first_name: firstName,
              last_name: lastName,
              jersey_number:
                jersey !== null && jersey !== undefined ? String(jersey) : null,
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

    /**
     * Fetches standings for a given MSL season.
     * Uses the Gamesheet internal REST API for structured data.
     *
     * @param input - Request containing the seasonId (MSL Gamesheet season ID)
     * @returns Array of MSLStanding objects
     */
    const getStandings = (
      input: typeof MSLStandingsRequest.Encoded,
    ): Effect.Effect<
      readonly MSLStanding[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MSLStandingsRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch standings from Gamesheet internal API
        // Note: The API requires no filter[gametype] parameter to return data
        const path = `/api/useStandings/getDivisionStandings/${request.seasonId}`;

        const response = yield* fetchGamesheetPageWithRetry(path);

        // Parse JSON response - returns array of divisions with nested tableData
        interface TeamTitle {
          title: string;
          id: number;
        }

        interface StandingsTableData {
          ranks?: number[];
          teamTitles?: TeamTitle[];
          teamLogos?: (string | null)[];
          teamIds?: number[];
          gp?: number[];
          w?: number[];
          l?: number[];
          t?: number[];
          pts?: number[];
          gf?: number[];
          ga?: number[];
          diff?: number[];
          stk?: string[];
        }

        interface StandingsApiResponse {
          title?: string;
          id?: number;
          tableData?: StandingsTableData;
        }

        let data: StandingsApiResponse | StandingsApiResponse[];
        try {
          data = JSON.parse(response) as
            | StandingsApiResponse
            | StandingsApiResponse[];
        } catch {
          return yield* Effect.fail(
            new ParseError({
              message: `Failed to parse standings API response as JSON`,
              cause: response.slice(0, 200),
            }),
          );
        }

        // Normalize to array (single division returns object, multiple returns array)
        const divisions = Array.isArray(data) ? data : [data];

        const allStandings: MSLStanding[] = [];

        for (const division of divisions) {
          // Data is nested under tableData
          const tableData = division.tableData ?? {};
          const teamTitles = tableData.teamTitles ?? [];
          const teamIds = tableData.teamIds ?? [];
          const ranks = tableData.ranks ?? [];
          const gp = tableData.gp ?? [];
          const wins = tableData.w ?? [];
          const losses = tableData.l ?? [];
          const ties = tableData.t ?? [];
          const points = tableData.pts ?? [];
          const goalsFor = tableData.gf ?? [];
          const goalsAgainst = tableData.ga ?? [];
          const goalDiff = tableData.diff ?? [];
          const streaks = tableData.stk ?? [];

          for (let i = 0; i < teamTitles.length; i++) {
            const teamInfo = teamTitles[i];
            const teamId = teamIds[i] ?? teamInfo?.id;
            const teamName = teamInfo?.title ?? null;
            const position = ranks[i] ?? i + 1;
            const gamesPlayed = gp[i] ?? 0;
            const w = wins[i] ?? 0;
            const l = losses[i] ?? 0;
            const t = ties[i] ?? 0;
            const pts = points[i] ?? 0;
            const gf = goalsFor[i] ?? 0;
            const ga = goalsAgainst[i] ?? 0;
            const diff = goalDiff[i] ?? gf - ga;
            const streak = streaks[i] ?? null;

            const standing = new MSLStanding({
              team_id: teamId !== undefined ? String(teamId) : String(i),
              team_name: teamName,
              position,
              wins: w,
              losses: l,
              ties: t,
              games_played: gamesPlayed,
              points: pts,
              goals_for: gf,
              goals_against: ga,
              goal_diff: diff,
              streak,
            });

            allStandings.push(standing);
          }
        }

        // Sort by position
        allStandings.sort((a, b) => a.position - b.position);

        return allStandings;
      }).pipe(
        Effect.tap((standings) =>
          Effect.log(
            `Fetched ${standings.length} standings for MSL season ${input.seasonId}`,
          ),
        ),
      );

    /**
     * Fetches all games (schedule/scores) for a given MSL season.
     * Uses the Gamesheet internal REST API for structured data.
     *
     * @param input - Request containing the seasonId (MSL Gamesheet season ID)
     * @returns Array of MSLGame objects
     */
    const getSchedule = (
      input: typeof MSLScheduleRequest.Encoded,
    ): Effect.Effect<
      readonly MSLGame[],
      HttpError | NetworkError | TimeoutError | ParseError
    > =>
      Effect.gen(function* () {
        const request = yield* Schema.decode(MSLScheduleRequest)(input).pipe(
          Effect.mapError(mapParseError),
        );

        // Fetch scores from Gamesheet internal API
        // Note: API returns all games at once, no pagination needed
        const path = `/api/useScoredGames/getSeasonScores/${request.seasonId}`;

        const response = yield* fetchGamesheetPageWithRetry(path);

        // Parse JSON response - API returns array of game entries
        interface PeriodScore {
          title: string;
          homeGoals: string | number;
          visitorGoals: string | number;
        }
        interface TeamInfo {
          id: string;
          name: string;
          logo?: string;
        }
        interface GameInfo {
          gameId: string;
          date?: string;
          time?: string;
          type?: string;
          homeTeam: TeamInfo;
          visitorTeam: TeamInfo;
          finalScore?: {
            homeGoals: number;
            visitorGoals: number;
          };
          scoresByPeriod?: PeriodScore[];
          location?: string;
        }
        interface GameEntry {
          date: string;
          game: GameInfo;
        }

        let data: GameEntry[];
        try {
          const parsed = JSON.parse(response);
          // API returns array of game entries
          data = Array.isArray(parsed) ? parsed : [];
        } catch {
          return yield* Effect.fail(
            new ParseError({
              message: `Failed to parse schedule API response as JSON`,
              cause: response.slice(0, 200),
            }),
          );
        }

        const allGames: MSLGame[] = [];

        for (const entry of data) {
          const gameInfo = entry.game;
          if (!gameInfo) continue;

          const gameId = gameInfo.gameId;
          const date = gameInfo.date ?? null;
          const time = gameInfo.time ?? null;
          const status = gameInfo.type ?? null;

          const homeTeam = gameInfo.homeTeam;
          const visitorTeam = gameInfo.visitorTeam;

          const homeScore = gameInfo.finalScore?.homeGoals ?? 0;
          const awayScore = gameInfo.finalScore?.visitorGoals ?? 0;
          const venue = gameInfo.location ?? null;

          // Build period scores if available
          let periodScores: MSLGamePeriodScore[] | undefined;

          if (gameInfo.scoresByPeriod && gameInfo.scoresByPeriod.length > 0) {
            periodScores = [];
            for (let p = 0; p < gameInfo.scoresByPeriod.length; p++) {
              const period = gameInfo.scoresByPeriod[p];
              if (!period) continue;
              const homeGoals =
                typeof period.homeGoals === "string"
                  ? parseInt(period.homeGoals, 10)
                  : period.homeGoals;
              const awayGoals =
                typeof period.visitorGoals === "string"
                  ? parseInt(period.visitorGoals, 10)
                  : period.visitorGoals;
              periodScores.push(
                new MSLGamePeriodScore({
                  period: p + 1,
                  home_score: homeGoals ?? 0,
                  away_score: awayGoals ?? 0,
                }),
              );
            }
          }

          const game = new MSLGame({
            id: String(gameId),
            date,
            time,
            status,
            home_team_id: homeTeam?.id ?? null,
            away_team_id: visitorTeam?.id ?? null,
            home_team_name: homeTeam?.name ?? null,
            away_team_name: visitorTeam?.name ?? null,
            home_score: homeScore,
            away_score: awayScore,
            venue,
            period_scores: periodScores,
          });

          allGames.push(game);
        }

        return allGames;
      }).pipe(
        Effect.tap((games) =>
          Effect.log(
            `Fetched ${games.length} games for MSL season ${input.seasonId}`,
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
      getStandings,
      getSchedule,
    };
  }),
  dependencies: [MSLConfig.Default, PipelineConfig.Default],
}) {}
