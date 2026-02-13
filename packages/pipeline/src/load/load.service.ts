/**
 * Load Service
 *
 * Orchestrates loading extracted data into the pro_* tables.
 * Handles the full workflow: read extracted files → transform → upsert.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { ProLeagueService, LeagueCode } from "@laxdb/core/pro-league";
import { Effect, Context } from "effect";

import type {
  NLLTeam,
  NLLPlayer,
  NLLStanding,
  NLLMatch,
} from "../nll/nll.schema";
import type {
  PLLTeam,
  PLLPlayer,
  PLLTeamStanding,
  PLLEvent,
} from "../pll/pll.schema";

import {
  transformNLLSeason,
  transformNLLTeams,
  transformNLLPlayers,
  transformNLLPlayerSeason,
  transformNLLGames,
  transformNLLStandings,
} from "./nll.transform";
import {
  transformPLLSeason,
  transformPLLTeams,
  transformPLLPlayers,
  transformPLLPlayerSeason,
  transformPLLGames,
  transformPLLStandings,
} from "./pll.transform";
import {
  createTransformContext,
  type TransformContext,
} from "./transform.types";

// =============================================================================
// SERVICE TAG
// =============================================================================

export class LoadService extends Context.Tag("LoadService")<
  LoadService,
  {
    readonly loadNLLSeason: (
      seasonId: string,
      outputDir: string,
    ) => Effect.Effect<LoadResult, LoadError>;
    readonly loadPLLSeason: (
      year: number,
      outputDir: string,
    ) => Effect.Effect<LoadResult, LoadError>;
  }
>() {}

// =============================================================================
// TYPES
// =============================================================================

export interface LoadResult {
  leagueCode: LeagueCode;
  seasonYear: number;
  teamsLoaded: number;
  playersLoaded: number;
  playerSeasonsLoaded: number;
  gamesLoaded: number;
  standingsLoaded: number;
}

export class LoadError extends Error {
  readonly _tag = "LoadError";
  readonly errorCause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LoadError";
    this.errorCause = cause;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const readJsonFile = <T>(filePath: string): Effect.Effect<T, LoadError> =>
  Effect.tryPromise({
    try: async () => {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as T;
    },
    catch: (error) => new LoadError(`Failed to read ${filePath}`, error),
  });

const fileExists = (filePath: string): Effect.Effect<boolean> =>
  Effect.promise(async () => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

// Service interface type
interface ProLeagueServiceInterface {
  upsertLeague: (input: {
    code: LeagueCode;
    name: string;
    shortName?: string;
    country?: string;
    isActive?: boolean;
    foundedYear?: number;
  }) => Effect.Effect<{ id: number; code: LeagueCode }, unknown>;
  upsertSeason: (
    input: ReturnType<typeof transformNLLSeason>,
  ) => Effect.Effect<{ id: number }, unknown>;
  bulkUpsertTeams: (
    inputs: ReturnType<typeof transformNLLTeams>,
  ) => Effect.Effect<Array<{ id: number; externalId: string }>, unknown>;
  bulkUpsertPlayers: (
    inputs: ReturnType<typeof transformNLLPlayers>,
  ) => Effect.Effect<Array<{ id: number; externalId: string }>, unknown>;
  bulkUpsertPlayerSeasons: (
    inputs: Array<NonNullable<ReturnType<typeof transformNLLPlayerSeason>>>,
  ) => Effect.Effect<unknown[], unknown>;
  bulkUpsertGames: (
    inputs: ReturnType<typeof transformNLLGames>,
  ) => Effect.Effect<unknown[], unknown>;
  bulkUpsertStandings: (
    inputs: ReturnType<typeof transformNLLStandings>,
  ) => Effect.Effect<unknown[], unknown>;
}

/**
 * Create LoadService with ProLeagueService dependency
 */
export const makeLoadService = (
  proLeagueService: ProLeagueServiceInterface,
) => {
  /**
   * Load NLL season data from extracted files
   */
  const loadNLLSeason = (
    seasonId: string,
    outputDir: string,
  ): Effect.Effect<LoadResult, LoadError> =>
    Effect.gen(function* () {
      const leagueCode: LeagueCode = "nll";

      // 1. Get or create league
      const league = yield* proLeagueService
        .upsertLeague({
          code: leagueCode,
          name: "National Lacrosse League",
          shortName: "NLL",
          country: "US",
          isActive: true,
          foundedYear: 1986,
        })
        .pipe(
          Effect.mapError(
            (e) => new LoadError("Failed to upsert NLL league", e),
          ),
        );

      // 2. Derive year from NLL season ID (225 = 2024-25, 224 = 2023-24, etc.)
      const baseYear = 2000 + Math.floor(Number(seasonId) / 10);
      const year = baseYear - 1; // Primary year is start year

      // 3. Create/update season
      const seasonInput = transformNLLSeason(league.id, seasonId, year);
      const season = yield* proLeagueService
        .upsertSeason(seasonInput)
        .pipe(
          Effect.mapError((e) => new LoadError("Failed to upsert season", e)),
        );

      // 4. Initialize transform context
      const ctx = createTransformContext(
        league.id,
        leagueCode,
        season.id,
        year,
        seasonId,
      );

      // 5. Load teams
      const teamsPath = path.join(outputDir, "teams.json");
      const teamsExist = yield* fileExists(teamsPath);
      let teamsLoaded = 0;

      if (teamsExist) {
        const teams = yield* readJsonFile<NLLTeam[]>(teamsPath);
        const teamInputs = transformNLLTeams(teams, league.id);
        const upsertedTeams = yield* proLeagueService
          .bulkUpsertTeams(teamInputs)
          .pipe(
            Effect.mapError((e) => new LoadError("Failed to upsert teams", e)),
          );

        // Build team ID map
        for (const team of upsertedTeams) {
          ctx.teamIdMap.set(team.externalId, team.id);
        }
        teamsLoaded = upsertedTeams.length;
      }

      // 6. Load players
      const playersPath = path.join(outputDir, "players.json");
      const playersExist = yield* fileExists(playersPath);
      let playersLoaded = 0;

      if (playersExist) {
        const players = yield* readJsonFile<NLLPlayer[]>(playersPath);
        const playerInputs = transformNLLPlayers(players, league.id);
        const upsertedPlayers = yield* proLeagueService
          .bulkUpsertPlayers(playerInputs)
          .pipe(
            Effect.mapError(
              (e) => new LoadError("Failed to upsert players", e),
            ),
          );

        // Build player ID map
        for (const player of upsertedPlayers) {
          ctx.playerIdMap.set(player.externalId, player.id);
        }
        playersLoaded = upsertedPlayers.length;

        // 7. Load player seasons
        const playerSeasonInputs = players
          .map((p) => transformNLLPlayerSeason(p, ctx))
          .filter((ps): ps is NonNullable<typeof ps> => ps !== null);

        if (playerSeasonInputs.length > 0) {
          yield* proLeagueService
            .bulkUpsertPlayerSeasons(playerSeasonInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert player seasons", e),
              ),
            );
        }
      }

      // 8. Load games (schedule)
      const schedulePath = path.join(outputDir, "schedule.json");
      const scheduleExist = yield* fileExists(schedulePath);
      let gamesLoaded = 0;

      if (scheduleExist) {
        const matches = yield* readJsonFile<NLLMatch[]>(schedulePath);
        const gameInputs = transformNLLGames(matches, ctx);

        if (gameInputs.length > 0) {
          const upsertedGames = yield* proLeagueService
            .bulkUpsertGames(gameInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert games", e),
              ),
            );
          gamesLoaded = upsertedGames.length;
        }
      }

      // 9. Load standings
      const standingsPath = path.join(outputDir, "standings.json");
      const standingsExist = yield* fileExists(standingsPath);
      let standingsLoaded = 0;

      if (standingsExist) {
        const standings = yield* readJsonFile<NLLStanding[]>(standingsPath);
        const snapshotDate = new Date(); // Use current date as snapshot
        const standingsInputs = transformNLLStandings(
          standings,
          ctx,
          snapshotDate,
        );

        if (standingsInputs.length > 0) {
          const upsertedStandings = yield* proLeagueService
            .bulkUpsertStandings(standingsInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert standings", e),
              ),
            );
          standingsLoaded = upsertedStandings.length;
        }
      }

      return {
        leagueCode,
        seasonYear: year,
        teamsLoaded,
        playersLoaded,
        playerSeasonsLoaded: playersLoaded, // Same as players for now
        gamesLoaded,
        standingsLoaded,
      };
    });

  /**
   * Load PLL season data from extracted files
   */
  const loadPLLSeason = (
    year: number,
    outputDir: string,
  ): Effect.Effect<LoadResult, LoadError> =>
    Effect.gen(function* () {
      const leagueCode: LeagueCode = "pll";

      // 1. Get or create league
      const league = yield* proLeagueService
        .upsertLeague({
          code: leagueCode,
          name: "Premier Lacrosse League",
          shortName: "PLL",
          country: "US",
          isActive: true,
          foundedYear: 2019,
        })
        .pipe(
          Effect.mapError(
            (e) => new LoadError("Failed to upsert PLL league", e),
          ),
        );

      // 2. Create/update season
      const seasonInput = transformPLLSeason(league.id, year);
      const season = yield* proLeagueService
        .upsertSeason(seasonInput)
        .pipe(
          Effect.mapError((e) => new LoadError("Failed to upsert season", e)),
        );

      // 3. Initialize transform context
      const ctx = createTransformContext(
        league.id,
        leagueCode,
        season.id,
        year,
        String(year),
      );

      // 4. Load teams
      const teamsPath = path.join(outputDir, "teams.json");
      const teamsExist = yield* fileExists(teamsPath);
      let teamsLoaded = 0;

      if (teamsExist) {
        const teamsResponse = yield* readJsonFile<{ allTeams: PLLTeam[] }>(
          teamsPath,
        );
        const teamInputs = transformPLLTeams(teamsResponse.allTeams, league.id);
        const upsertedTeams = yield* proLeagueService
          .bulkUpsertTeams(teamInputs)
          .pipe(
            Effect.mapError((e) => new LoadError("Failed to upsert teams", e)),
          );

        // Build team ID map
        for (const team of upsertedTeams) {
          ctx.teamIdMap.set(team.externalId, team.id);
        }
        teamsLoaded = upsertedTeams.length;
      }

      // 5. Load players
      const playersPath = path.join(outputDir, "players.json");
      const playersExist = yield* fileExists(playersPath);
      let playersLoaded = 0;

      if (playersExist) {
        const playersResponse = yield* readJsonFile<{
          allPlayers: PLLPlayer[];
        }>(playersPath);
        const playerInputs = transformPLLPlayers(
          playersResponse.allPlayers,
          league.id,
        );
        const upsertedPlayers = yield* proLeagueService
          .bulkUpsertPlayers(playerInputs)
          .pipe(
            Effect.mapError(
              (e) => new LoadError("Failed to upsert players", e),
            ),
          );

        // Build player ID map
        for (const player of upsertedPlayers) {
          ctx.playerIdMap.set(player.externalId, player.id);
        }
        playersLoaded = upsertedPlayers.length;

        // 6. Load player seasons
        const playerSeasonInputs = playersResponse.allPlayers
          .map((p) => transformPLLPlayerSeason(p, ctx))
          .filter((ps): ps is NonNullable<typeof ps> => ps !== null);

        if (playerSeasonInputs.length > 0) {
          yield* proLeagueService
            .bulkUpsertPlayerSeasons(playerSeasonInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert player seasons", e),
              ),
            );
        }
      }

      // 7. Load games (events)
      const eventsPath = path.join(outputDir, "events.json");
      const eventsExist = yield* fileExists(eventsPath);
      let gamesLoaded = 0;

      if (eventsExist) {
        const eventsResponse = yield* readJsonFile<{
          data: { items: PLLEvent[] };
        }>(eventsPath);
        const gameInputs = transformPLLGames(eventsResponse.data.items, ctx);

        if (gameInputs.length > 0) {
          const upsertedGames = yield* proLeagueService
            .bulkUpsertGames(gameInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert games", e),
              ),
            );
          gamesLoaded = upsertedGames.length;
        }
      }

      // 8. Load standings
      const standingsPath = path.join(outputDir, "standings.json");
      const standingsExist = yield* fileExists(standingsPath);
      let standingsLoaded = 0;

      if (standingsExist) {
        const standingsResponse = yield* readJsonFile<{
          data: { items: PLLTeamStanding[] };
        }>(standingsPath);
        const snapshotDate = new Date();
        const standingsInputs = transformPLLStandings(
          standingsResponse.data.items,
          ctx,
          snapshotDate,
        );

        if (standingsInputs.length > 0) {
          const upsertedStandings = yield* proLeagueService
            .bulkUpsertStandings(standingsInputs)
            .pipe(
              Effect.mapError(
                (e) => new LoadError("Failed to upsert standings", e),
              ),
            );
          standingsLoaded = upsertedStandings.length;
        }
      }

      return {
        leagueCode,
        seasonYear: year,
        teamsLoaded,
        playersLoaded,
        playerSeasonsLoaded: playersLoaded,
        gamesLoaded,
        standingsLoaded,
      };
    });

  return {
    loadNLLSeason,
    loadPLLSeason,
  };
};
