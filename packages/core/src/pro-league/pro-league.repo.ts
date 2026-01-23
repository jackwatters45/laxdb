import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { Array as Arr, Effect } from "effect";

import { DatabaseLive } from "../drizzle/drizzle.service";

import { ProUpsertError } from "./pro-league.error";
import type {
  CreateIngestionInput,
  CreateLeagueInput,
  LeagueCode,
  UpsertGameInput,
  UpsertPlayerInput,
  UpsertPlayerSeasonInput,
  UpsertSeasonInput,
  UpsertStandingsInput,
  UpsertTeamInput,
  UpdateIngestionInput,
} from "./pro-league.schema";
import {
  proDataIngestionTable,
  proGameTable,
  proLeagueTable,
  proPlayerSeasonTable,
  proPlayerTable,
  proSeasonTable,
  proStandingsTable,
  proTeamTable,
  type ProGame,
  type ProLeague,
  type ProPlayer,
  type ProPlayerSeason,
  type ProSeason,
  type ProStandings,
  type ProTeam,
} from "./pro-league.sql";
import type { GoalieStats, PlayerStats, TeamStats } from "./pro-league.types";

export class ProLeagueRepo extends Effect.Service<ProLeagueRepo>()(
  "ProLeagueRepo",
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      // Column helpers (exclude internal id for selects)
      const { id: _leagueId, ...leagueCols } = getTableColumns(proLeagueTable);
      const { id: _seasonId, ...seasonCols } = getTableColumns(proSeasonTable);

      return {
        // =====================================================================
        // LEAGUE OPERATIONS
        // =====================================================================

        getLeagueByCode: (code: LeagueCode) =>
          db
            .select()
            .from(proLeagueTable)
            .where(
              and(
                eq(proLeagueTable.code, code),
                isNull(proLeagueTable.deletedAt),
              ),
            )
            .pipe(Effect.flatMap(Arr.head)),

        createLeague: (input: CreateLeagueInput) =>
          db
            .insert(proLeagueTable)
            .values({
              code: input.code,
              name: input.name,
              shortName: input.shortName ?? null,
              country: input.country ?? null,
              isActive: input.isActive ?? true,
              foundedYear: input.foundedYear ?? null,
              defunctYear: input.defunctYear ?? null,
              websiteUrl: input.websiteUrl ?? null,
              logoUrl: input.logoUrl ?? null,
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        upsertLeague: (input: CreateLeagueInput) =>
          db
            .insert(proLeagueTable)
            .values({
              code: input.code,
              name: input.name,
              shortName: input.shortName ?? null,
              country: input.country ?? null,
              isActive: input.isActive ?? true,
              foundedYear: input.foundedYear ?? null,
              defunctYear: input.defunctYear ?? null,
              websiteUrl: input.websiteUrl ?? null,
              logoUrl: input.logoUrl ?? null,
            })
            .onConflictDoUpdate({
              target: proLeagueTable.code,
              set: {
                name: input.name,
                shortName: input.shortName ?? null,
                isActive: input.isActive ?? true,
                websiteUrl: input.websiteUrl ?? null,
                logoUrl: input.logoUrl ?? null,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        listLeagues: () =>
          db
            .select(leagueCols)
            .from(proLeagueTable)
            .where(isNull(proLeagueTable.deletedAt))
            .pipe(Effect.map((rows) => rows as Omit<ProLeague, "id">[])),

        // =====================================================================
        // SEASON OPERATIONS
        // =====================================================================

        getSeasonByExternalId: (leagueId: number, externalId: string) =>
          db
            .select()
            .from(proSeasonTable)
            .where(
              and(
                eq(proSeasonTable.leagueId, leagueId),
                eq(proSeasonTable.externalId, externalId),
                isNull(proSeasonTable.deletedAt),
              ),
            )
            .pipe(Effect.flatMap(Arr.head)),

        getSeasonByYear: (leagueId: number, year: number) =>
          db
            .select()
            .from(proSeasonTable)
            .where(
              and(
                eq(proSeasonTable.leagueId, leagueId),
                eq(proSeasonTable.year, year),
                isNull(proSeasonTable.deletedAt),
              ),
            )
            .pipe(Effect.flatMap(Arr.head)),

        upsertSeason: (input: UpsertSeasonInput) =>
          db
            .insert(proSeasonTable)
            .values({
              leagueId: input.leagueId,
              externalId: input.externalId,
              year: input.year,
              displayName: input.displayName,
              startDate: input.startDate,
              endDate: input.endDate,
              isCurrent: input.isCurrent,
            })
            .onConflictDoUpdate({
              target: [proSeasonTable.leagueId, proSeasonTable.externalId],
              set: {
                year: input.year,
                displayName: input.displayName,
                startDate: input.startDate,
                endDate: input.endDate,
                isCurrent: input.isCurrent,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        listSeasons: (leagueId: number) =>
          db
            .select(seasonCols)
            .from(proSeasonTable)
            .where(
              and(
                eq(proSeasonTable.leagueId, leagueId),
                isNull(proSeasonTable.deletedAt),
              ),
            )
            .pipe(Effect.map((rows) => rows as Omit<ProSeason, "id">[])),

        // =====================================================================
        // TEAM OPERATIONS
        // =====================================================================

        getTeamByExternalId: (leagueId: number, externalId: string) =>
          db
            .select()
            .from(proTeamTable)
            .where(
              and(
                eq(proTeamTable.leagueId, leagueId),
                eq(proTeamTable.externalId, externalId),
                isNull(proTeamTable.deletedAt),
              ),
            )
            .pipe(Effect.flatMap(Arr.head)),

        upsertTeam: (input: UpsertTeamInput) =>
          db
            .insert(proTeamTable)
            .values({
              leagueId: input.leagueId,
              externalId: input.externalId,
              code: input.code,
              name: input.name,
              shortName: input.shortName,
              city: input.city,
              logoUrl: input.logoUrl,
              primaryColor: input.primaryColor,
              secondaryColor: input.secondaryColor,
              websiteUrl: input.websiteUrl,
              isActive: input.isActive,
              firstSeasonYear: input.firstSeasonYear,
              lastSeasonYear: input.lastSeasonYear,
            })
            .onConflictDoUpdate({
              target: [proTeamTable.leagueId, proTeamTable.externalId],
              set: {
                code: input.code,
                name: input.name,
                shortName: input.shortName,
                city: input.city,
                logoUrl: input.logoUrl,
                primaryColor: input.primaryColor,
                secondaryColor: input.secondaryColor,
                websiteUrl: input.websiteUrl,
                isActive: input.isActive,
                firstSeasonYear: input.firstSeasonYear,
                lastSeasonYear: input.lastSeasonYear,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        bulkUpsertTeams: (inputs: UpsertTeamInput[]) =>
          Effect.gen(function* () {
            if (inputs.length === 0) return [];

            const results: ProTeam[] = [];
            for (const input of inputs) {
              const result = yield* db
                .insert(proTeamTable)
                .values({
                  leagueId: input.leagueId,
                  externalId: input.externalId,
                  code: input.code,
                  name: input.name,
                  shortName: input.shortName,
                  city: input.city,
                  logoUrl: input.logoUrl,
                  primaryColor: input.primaryColor,
                  secondaryColor: input.secondaryColor,
                  websiteUrl: input.websiteUrl,
                  isActive: input.isActive,
                  firstSeasonYear: input.firstSeasonYear,
                  lastSeasonYear: input.lastSeasonYear,
                })
                .onConflictDoUpdate({
                  target: [proTeamTable.leagueId, proTeamTable.externalId],
                  set: {
                    code: input.code,
                    name: input.name,
                    shortName: input.shortName,
                    city: input.city,
                    logoUrl: input.logoUrl,
                    isActive: input.isActive,
                  },
                })
                .returning()
                .pipe(
                  Effect.flatMap(Arr.head),
                  Effect.mapError(
                    (e) =>
                      new ProUpsertError({
                        message: "Failed to upsert team",
                        entity: "team",
                        externalId: input.externalId,
                        cause: e,
                      }),
                  ),
                );
              results.push(result);
            }
            return results;
          }),

        listTeams: (leagueId: number) =>
          db
            .select()
            .from(proTeamTable)
            .where(
              and(
                eq(proTeamTable.leagueId, leagueId),
                isNull(proTeamTable.deletedAt),
              ),
            ),

        // =====================================================================
        // PLAYER OPERATIONS
        // =====================================================================

        getPlayerByExternalId: (leagueId: number, externalId: string) =>
          db
            .select()
            .from(proPlayerTable)
            .where(
              and(
                eq(proPlayerTable.leagueId, leagueId),
                eq(proPlayerTable.externalId, externalId),
                isNull(proPlayerTable.deletedAt),
              ),
            )
            .pipe(Effect.flatMap(Arr.head)),

        upsertPlayer: (input: UpsertPlayerInput) =>
          db
            .insert(proPlayerTable)
            .values({
              leagueId: input.leagueId,
              externalId: input.externalId,
              firstName: input.firstName,
              lastName: input.lastName,
              fullName: input.fullName,
              position: input.position,
              dateOfBirth: input.dateOfBirth,
              birthplace: input.birthplace,
              country: input.country,
              height: input.height,
              weight: input.weight,
              handedness: input.handedness,
              college: input.college,
              highSchool: input.highSchool,
              profileUrl: input.profileUrl,
              photoUrl: input.photoUrl,
            })
            .onConflictDoUpdate({
              target: [proPlayerTable.leagueId, proPlayerTable.externalId],
              set: {
                firstName: input.firstName,
                lastName: input.lastName,
                fullName: input.fullName,
                position: input.position,
                dateOfBirth: input.dateOfBirth,
                birthplace: input.birthplace,
                country: input.country,
                height: input.height,
                weight: input.weight,
                handedness: input.handedness,
                college: input.college,
                highSchool: input.highSchool,
                profileUrl: input.profileUrl,
                photoUrl: input.photoUrl,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        bulkUpsertPlayers: (inputs: UpsertPlayerInput[]) =>
          Effect.gen(function* () {
            if (inputs.length === 0) return [];

            const results: ProPlayer[] = [];
            for (const input of inputs) {
              const result = yield* db
                .insert(proPlayerTable)
                .values({
                  leagueId: input.leagueId,
                  externalId: input.externalId,
                  firstName: input.firstName,
                  lastName: input.lastName,
                  fullName: input.fullName,
                  position: input.position,
                  dateOfBirth: input.dateOfBirth,
                  birthplace: input.birthplace,
                  country: input.country,
                  height: input.height,
                  weight: input.weight,
                  handedness: input.handedness,
                  college: input.college,
                  highSchool: input.highSchool,
                  profileUrl: input.profileUrl,
                  photoUrl: input.photoUrl,
                })
                .onConflictDoUpdate({
                  target: [proPlayerTable.leagueId, proPlayerTable.externalId],
                  set: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    fullName: input.fullName,
                    position: input.position,
                    height: input.height,
                    weight: input.weight,
                  },
                })
                .returning()
                .pipe(
                  Effect.flatMap(Arr.head),
                  Effect.mapError(
                    (e) =>
                      new ProUpsertError({
                        message: "Failed to upsert player",
                        entity: "player",
                        externalId: input.externalId,
                        cause: e,
                      }),
                  ),
                );
              results.push(result);
            }
            return results;
          }),

        listPlayers: (leagueId: number) =>
          db
            .select()
            .from(proPlayerTable)
            .where(
              and(
                eq(proPlayerTable.leagueId, leagueId),
                isNull(proPlayerTable.deletedAt),
              ),
            ),

        // =====================================================================
        // PLAYER SEASON OPERATIONS
        // =====================================================================

        upsertPlayerSeason: (input: UpsertPlayerSeasonInput) =>
          db
            .insert(proPlayerSeasonTable)
            .values({
              playerId: input.playerId,
              seasonId: input.seasonId,
              teamId: input.teamId,
              jerseyNumber: input.jerseyNumber,
              position: input.position,
              isCaptain: input.isCaptain ?? false,
              stats: input.stats as PlayerStats | null,
              postSeasonStats: input.postSeasonStats as PlayerStats | null,
              goalieStats: input.goalieStats as GoalieStats | null,
              postSeasonGoalieStats:
                input.postSeasonGoalieStats as GoalieStats | null,
              gamesPlayed: input.gamesPlayed ?? 0,
            })
            .onConflictDoUpdate({
              target: [
                proPlayerSeasonTable.playerId,
                proPlayerSeasonTable.seasonId,
              ],
              set: {
                teamId: input.teamId,
                jerseyNumber: input.jerseyNumber,
                position: input.position,
                isCaptain: input.isCaptain ?? false,
                stats: input.stats as PlayerStats | null,
                postSeasonStats: input.postSeasonStats as PlayerStats | null,
                goalieStats: input.goalieStats as GoalieStats | null,
                postSeasonGoalieStats:
                  input.postSeasonGoalieStats as GoalieStats | null,
                gamesPlayed: input.gamesPlayed ?? 0,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        bulkUpsertPlayerSeasons: (inputs: UpsertPlayerSeasonInput[]) =>
          Effect.gen(function* () {
            if (inputs.length === 0) return [];

            const results: ProPlayerSeason[] = [];
            for (const input of inputs) {
              const result = yield* db
                .insert(proPlayerSeasonTable)
                .values({
                  playerId: input.playerId,
                  seasonId: input.seasonId,
                  teamId: input.teamId,
                  jerseyNumber: input.jerseyNumber,
                  position: input.position,
                  isCaptain: input.isCaptain ?? false,
                  stats: input.stats as PlayerStats | null,
                  postSeasonStats: input.postSeasonStats as PlayerStats | null,
                  goalieStats: input.goalieStats as GoalieStats | null,
                  postSeasonGoalieStats:
                    input.postSeasonGoalieStats as GoalieStats | null,
                  gamesPlayed: input.gamesPlayed ?? 0,
                })
                .onConflictDoUpdate({
                  target: [
                    proPlayerSeasonTable.playerId,
                    proPlayerSeasonTable.seasonId,
                  ],
                  set: {
                    teamId: input.teamId,
                    jerseyNumber: input.jerseyNumber,
                    position: input.position,
                    stats: input.stats as PlayerStats | null,
                    postSeasonStats:
                      input.postSeasonStats as PlayerStats | null,
                    goalieStats: input.goalieStats as GoalieStats | null,
                    postSeasonGoalieStats:
                      input.postSeasonGoalieStats as GoalieStats | null,
                    gamesPlayed: input.gamesPlayed ?? 0,
                  },
                })
                .returning()
                .pipe(
                  Effect.flatMap(Arr.head),
                  Effect.mapError(
                    (e) =>
                      new ProUpsertError({
                        message: "Failed to upsert player season",
                        entity: "playerSeason",
                        cause: e,
                      }),
                  ),
                );
              results.push(result);
            }
            return results;
          }),

        getPlayerSeasons: (seasonId: number) =>
          db
            .select()
            .from(proPlayerSeasonTable)
            .where(eq(proPlayerSeasonTable.seasonId, seasonId)),

        // =====================================================================
        // GAME OPERATIONS
        // =====================================================================

        upsertGame: (input: UpsertGameInput) =>
          db
            .insert(proGameTable)
            .values({
              seasonId: input.seasonId,
              externalId: input.externalId,
              homeTeamId: input.homeTeamId,
              awayTeamId: input.awayTeamId,
              gameDate: input.gameDate,
              week: input.week,
              gameNumber: input.gameNumber,
              venue: input.venue,
              venueCity: input.venueCity,
              status: input.status,
              homeScore: input.homeScore,
              awayScore: input.awayScore,
              isOvertime: input.isOvertime ?? false,
              overtimePeriods: input.overtimePeriods ?? 0,
              playByPlayUrl: input.playByPlayUrl,
              homeTeamStats: input.homeTeamStats as TeamStats | null,
              awayTeamStats: input.awayTeamStats as TeamStats | null,
              broadcaster: input.broadcaster,
              streamUrl: input.streamUrl,
            })
            .onConflictDoUpdate({
              target: [proGameTable.seasonId, proGameTable.externalId],
              set: {
                homeTeamId: input.homeTeamId,
                awayTeamId: input.awayTeamId,
                gameDate: input.gameDate,
                week: input.week,
                venue: input.venue,
                status: input.status,
                homeScore: input.homeScore,
                awayScore: input.awayScore,
                isOvertime: input.isOvertime ?? false,
                overtimePeriods: input.overtimePeriods ?? 0,
                playByPlayUrl: input.playByPlayUrl,
                homeTeamStats: input.homeTeamStats as TeamStats | null,
                awayTeamStats: input.awayTeamStats as TeamStats | null,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        bulkUpsertGames: (inputs: UpsertGameInput[]) =>
          Effect.gen(function* () {
            if (inputs.length === 0) return [];

            const results: ProGame[] = [];
            for (const input of inputs) {
              const result = yield* db
                .insert(proGameTable)
                .values({
                  seasonId: input.seasonId,
                  externalId: input.externalId,
                  homeTeamId: input.homeTeamId,
                  awayTeamId: input.awayTeamId,
                  gameDate: input.gameDate,
                  week: input.week,
                  gameNumber: input.gameNumber,
                  venue: input.venue,
                  venueCity: input.venueCity,
                  status: input.status,
                  homeScore: input.homeScore,
                  awayScore: input.awayScore,
                  isOvertime: input.isOvertime ?? false,
                  overtimePeriods: input.overtimePeriods ?? 0,
                  playByPlayUrl: input.playByPlayUrl,
                  homeTeamStats: input.homeTeamStats as TeamStats | null,
                  awayTeamStats: input.awayTeamStats as TeamStats | null,
                  broadcaster: input.broadcaster,
                  streamUrl: input.streamUrl,
                })
                .onConflictDoUpdate({
                  target: [proGameTable.seasonId, proGameTable.externalId],
                  set: {
                    status: input.status,
                    homeScore: input.homeScore,
                    awayScore: input.awayScore,
                  },
                })
                .returning()
                .pipe(
                  Effect.flatMap(Arr.head),
                  Effect.mapError(
                    (e) =>
                      new ProUpsertError({
                        message: "Failed to upsert game",
                        entity: "game",
                        externalId: input.externalId ?? undefined,
                        cause: e,
                      }),
                  ),
                );
              results.push(result);
            }
            return results;
          }),

        listGames: (seasonId: number) =>
          db
            .select()
            .from(proGameTable)
            .where(eq(proGameTable.seasonId, seasonId)),

        // =====================================================================
        // STANDINGS OPERATIONS
        // =====================================================================

        upsertStandings: (input: UpsertStandingsInput) =>
          db
            .insert(proStandingsTable)
            .values({
              seasonId: input.seasonId,
              teamId: input.teamId,
              snapshotDate: input.snapshotDate,
              position: input.position,
              wins: input.wins,
              losses: input.losses,
              ties: input.ties ?? 0,
              overtimeLosses: input.overtimeLosses ?? 0,
              points: input.points,
              winPercentage: input.winPercentage,
              goalsFor: input.goalsFor ?? 0,
              goalsAgainst: input.goalsAgainst ?? 0,
              goalDifferential: input.goalDifferential ?? 0,
              conference: input.conference,
              division: input.division,
              clinchStatus: input.clinchStatus,
              seed: input.seed,
            })
            .onConflictDoUpdate({
              target: [
                proStandingsTable.seasonId,
                proStandingsTable.teamId,
                proStandingsTable.snapshotDate,
              ],
              set: {
                position: input.position,
                wins: input.wins,
                losses: input.losses,
                ties: input.ties ?? 0,
                overtimeLosses: input.overtimeLosses ?? 0,
                points: input.points,
                winPercentage: input.winPercentage,
                goalsFor: input.goalsFor ?? 0,
                goalsAgainst: input.goalsAgainst ?? 0,
                goalDifferential: input.goalDifferential ?? 0,
                clinchStatus: input.clinchStatus,
                seed: input.seed,
              },
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        bulkUpsertStandings: (inputs: UpsertStandingsInput[]) =>
          Effect.gen(function* () {
            if (inputs.length === 0) return [];

            const results: ProStandings[] = [];
            for (const input of inputs) {
              const result = yield* db
                .insert(proStandingsTable)
                .values({
                  seasonId: input.seasonId,
                  teamId: input.teamId,
                  snapshotDate: input.snapshotDate,
                  position: input.position,
                  wins: input.wins,
                  losses: input.losses,
                  ties: input.ties ?? 0,
                  overtimeLosses: input.overtimeLosses ?? 0,
                  points: input.points,
                  winPercentage: input.winPercentage,
                  goalsFor: input.goalsFor ?? 0,
                  goalsAgainst: input.goalsAgainst ?? 0,
                  goalDifferential: input.goalDifferential ?? 0,
                  conference: input.conference,
                  division: input.division,
                  clinchStatus: input.clinchStatus,
                  seed: input.seed,
                })
                .onConflictDoUpdate({
                  target: [
                    proStandingsTable.seasonId,
                    proStandingsTable.teamId,
                    proStandingsTable.snapshotDate,
                  ],
                  set: {
                    position: input.position,
                    wins: input.wins,
                    losses: input.losses,
                    goalsFor: input.goalsFor ?? 0,
                    goalsAgainst: input.goalsAgainst ?? 0,
                    goalDifferential: input.goalDifferential ?? 0,
                  },
                })
                .returning()
                .pipe(
                  Effect.flatMap(Arr.head),
                  Effect.mapError(
                    (e) =>
                      new ProUpsertError({
                        message: "Failed to upsert standings",
                        entity: "standings",
                        cause: e,
                      }),
                  ),
                );
              results.push(result);
            }
            return results;
          }),

        getStandings: (seasonId: number, snapshotDate?: Date) =>
          Effect.gen(function* () {
            // If no snapshot date, get the latest
            if (!snapshotDate) {
              return yield* db
                .select()
                .from(proStandingsTable)
                .where(eq(proStandingsTable.seasonId, seasonId))
                .orderBy(proStandingsTable.snapshotDate);
            }
            return yield* db
              .select()
              .from(proStandingsTable)
              .where(
                and(
                  eq(proStandingsTable.seasonId, seasonId),
                  eq(proStandingsTable.snapshotDate, snapshotDate),
                ),
              )
              .orderBy(proStandingsTable.position);
          }),

        // =====================================================================
        // INGESTION OPERATIONS
        // =====================================================================

        createIngestion: (input: CreateIngestionInput) =>
          db
            .insert(proDataIngestionTable)
            .values({
              leagueId: input.leagueId,
              seasonId: input.seasonId,
              entityType: input.entityType,
              sourceUrl: input.sourceUrl,
              sourceType: input.sourceType,
              status: "pending",
            })
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        updateIngestion: (input: UpdateIngestionInput) =>
          db
            .update(proDataIngestionTable)
            .set({
              status: input.status,
              startedAt: input.startedAt,
              completedAt: input.completedAt,
              recordsProcessed: input.recordsProcessed,
              recordsCreated: input.recordsCreated,
              recordsUpdated: input.recordsUpdated,
              recordsSkipped: input.recordsSkipped,
              durationMs: input.durationMs,
              errorMessage: input.errorMessage,
              errorStack: input.errorStack,
              rawDataUrl: input.rawDataUrl,
              manifestVersion: input.manifestVersion,
            })
            .where(eq(proDataIngestionTable.id, input.id))
            .returning()
            .pipe(Effect.flatMap(Arr.head)),

        getRecentIngestions: (leagueId: number, limit = 10) =>
          db
            .select()
            .from(proDataIngestionTable)
            .where(eq(proDataIngestionTable.leagueId, leagueId))
            .orderBy(proDataIngestionTable.createdAt)
            .limit(limit),
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}
