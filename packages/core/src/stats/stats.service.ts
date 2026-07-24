import { ClubRepo } from "@laxdb/core/club/club.repo";
import { NotFoundError, ValidationError } from "@laxdb/core/error";
import { GamedayClient } from "@laxdb/core/match/gameday";
import { GamedayRepo } from "@laxdb/core/match/gameday.repo";
import { MatchRepo } from "@laxdb/core/match/match.repo";
import {
  decodeArguments,
  parseSqlError,
  type SchemaInput,
} from "@laxdb/core/util";
import { Context, Effect, Layer } from "effect";

import { StatsRepo } from "./stats.repo";
import {
  FixturePlayerStat,
  FixtureStatSheet,
  FixtureStatsInput,
  FixtureTeamStat,
  GamedayPlayerSeasonTotal,
  ManualPlayerSeasonTotal,
  StandingRow,
  TeamPlayerStats,
  TeamSeasonStatsInput,
  TeamSeasonSummary,
  TeamStandings,
  UpsertFixtureStatSheetInput,
} from "./stats.schema";

const notFound = (domain: string, id: string) =>
  new NotFoundError({ domain, id });

const validation = (message: string) =>
  new ValidationError({ domain: "Stats", message });

const effectiveScores = (input: {
  readonly isHome: boolean;
  readonly homeScore: number | null;
  readonly awayScore: number | null;
  readonly goalsForOverride: number | null;
  readonly goalsAgainstOverride: number | null;
}) => {
  if (input.goalsForOverride !== null && input.goalsAgainstOverride !== null) {
    return {
      goalsFor: input.goalsForOverride,
      goalsAgainst: input.goalsAgainstOverride,
    };
  }
  if (input.homeScore === null || input.awayScore === null) return null;
  return input.isHome
    ? { goalsFor: input.homeScore, goalsAgainst: input.awayScore }
    : { goalsFor: input.awayScore, goalsAgainst: input.homeScore };
};

export class StatsService extends Context.Service<StatsService>()(
  "StatsService",
  {
    make: Effect.gen(function* () {
      const repo = yield* StatsRepo;
      const matchRepo = yield* MatchRepo;
      const clubRepo = yield* ClubRepo;
      const gameday = yield* GamedayClient;
      const gamedayRepo = yield* GamedayRepo;

      const resolveLink = (input: typeof TeamSeasonStatsInput.Type) =>
        repo
          .resolveTeamSeasonLink(input)
          .pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                validation("Team is not linked to the current GameDay season"),
              ),
            ),
          );

      const getFixtureStatSheet = (
        input: SchemaInput<typeof FixtureStatsInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(FixtureStatsInput, input);
          const fixture = yield* matchRepo
            .getFixture({
              organizationId: decoded.organizationId,
              id: decoded.fixtureId,
            })
            .pipe(
              Effect.catchTag("NoSuchElementError", () =>
                Effect.fail(notFound("Fixture", decoded.fixtureId)),
              ),
            );
          const teamRows = yield* repo.getFixtureTeamStats(decoded);
          const playerRows = yield* repo.listFixturePlayerStats(decoded);
          const teamRow = teamRows[0];
          const team =
            teamRow === undefined
              ? null
              : (() => {
                  const scores = effectiveScores({
                    isHome: fixture.isHome,
                    homeScore: fixture.homeScore,
                    awayScore: fixture.awayScore,
                    goalsForOverride: teamRow.goalsForOverride,
                    goalsAgainstOverride: teamRow.goalsAgainstOverride,
                  });
                  return scores === null
                    ? null
                    : new FixtureTeamStat({
                        fixtureId: fixture.id,
                        teamId: fixture.teamId,
                        goalsForOverride: teamRow.goalsForOverride,
                        goalsAgainstOverride: teamRow.goalsAgainstOverride,
                        assistedGoals: teamRow.assistedGoals,
                        shots: teamRow.shots,
                        saves: teamRow.saves,
                        effectiveGoalsFor: scores.goalsFor,
                        effectiveGoalsAgainst: scores.goalsAgainst,
                        updatedAt: teamRow.updatedAt,
                      });
                })();
          return new FixtureStatSheet({
            fixtureId: fixture.id,
            team,
            players: playerRows.map(
              (row) =>
                new FixturePlayerStat({
                  ...row,
                  points: row.goals + row.assists,
                }),
            ),
          });
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(parseSqlError(error)),
          ),
          Effect.tapError((error) =>
            Effect.logError("Failed to get fixture statistics", error),
          ),
        );

      const upsertFixtureStatSheet = (
        input: SchemaInput<typeof UpsertFixtureStatSheetInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(
            UpsertFixtureStatSheetInput,
            input,
          );
          const fixture = yield* matchRepo
            .getFixture({
              organizationId: decoded.organizationId,
              id: decoded.fixtureId,
            })
            .pipe(
              Effect.catchTag("NoSuchElementError", () =>
                Effect.fail(notFound("Fixture", decoded.fixtureId)),
              ),
            );
          const sourceCompleted =
            fixture.homeScore !== null && fixture.awayScore !== null;
          const fixtureHasStarted =
            fixture.scheduledAt !== null &&
            fixture.scheduledAt.getTime() <= Date.now();
          if (!sourceCompleted && !fixtureHasStarted) {
            return yield* Effect.fail(
              validation("Statistics can only be entered after the fixture"),
            );
          }
          const hasGoalsForOverride = decoded.goalsForOverride !== null;
          const hasGoalsAgainstOverride = decoded.goalsAgainstOverride !== null;
          if (hasGoalsForOverride !== hasGoalsAgainstOverride) {
            return yield* Effect.fail(
              validation(
                "Goals for and against overrides must be set together",
              ),
            );
          }
          const scores = effectiveScores({
            isHome: fixture.isHome,
            homeScore: fixture.homeScore,
            awayScore: fixture.awayScore,
            goalsForOverride: decoded.goalsForOverride,
            goalsAgainstOverride: decoded.goalsAgainstOverride,
          });
          if (scores === null) {
            return yield* Effect.fail(
              validation(
                "A completed score or paired manual score override is required",
              ),
            );
          }
          if (decoded.assistedGoals > scores.goalsFor) {
            return yield* Effect.fail(
              validation("Assisted goals cannot exceed goals for"),
            );
          }
          if (decoded.shots !== null && decoded.shots < scores.goalsFor) {
            return yield* Effect.fail(
              validation("Team shots cannot be lower than goals for"),
            );
          }
          const seenPlayers = new Set<string>();
          for (const playerInput of decoded.players) {
            if (seenPlayers.has(playerInput.rosterPlayerId)) {
              return yield* Effect.fail(
                validation("Each player can appear only once in a stat sheet"),
              );
            }
            seenPlayers.add(playerInput.rosterPlayerId);
            const player = yield* clubRepo
              .getRosterPlayer({
                organizationId: decoded.organizationId,
                id: playerInput.rosterPlayerId,
              })
              .pipe(
                Effect.catchTag("NoSuchElementError", () =>
                  Effect.fail(
                    notFound("RosterPlayer", playerInput.rosterPlayerId),
                  ),
                ),
              );
            if (player.teamId !== fixture.teamId) {
              return yield* Effect.fail(
                validation("Every stat player must belong to the fixture team"),
              );
            }
            if (
              playerInput.shots !== null &&
              playerInput.shots < playerInput.goals
            ) {
              return yield* Effect.fail(
                validation(`${player.name}'s shots cannot be lower than goals`),
              );
            }
          }
          yield* repo.upsertFixtureTeamStats({
            organizationId: decoded.organizationId,
            fixtureId: fixture.id,
            teamId: fixture.teamId,
            goalsForOverride: decoded.goalsForOverride,
            goalsAgainstOverride: decoded.goalsAgainstOverride,
            assistedGoals: decoded.assistedGoals,
            shots: decoded.shots,
            saves: decoded.saves,
            submittedByUserId: decoded.submittedByUserId,
          });
          yield* repo.replaceFixturePlayerStats({
            organizationId: decoded.organizationId,
            fixtureId: fixture.id,
            teamId: fixture.teamId,
            players: decoded.players,
          });
          return yield* getFixtureStatSheet(decoded);
        }).pipe(
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new NotFoundError({
                domain: "FixtureStats",
                id: input.fixtureId,
              }),
            ),
          ),
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(parseSqlError(error)),
          ),
          Effect.tapError((error) =>
            Effect.logError("Failed to save fixture statistics", error),
          ),
        );

      const getTeamSeasonSummary = (
        input: SchemaInput<typeof TeamSeasonStatsInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamSeasonStatsInput, input);
          yield* clubRepo
            .getTeam({
              organizationId: decoded.organizationId,
              id: decoded.teamId,
            })
            .pipe(
              Effect.catchTag("NoSuchElementError", () =>
                Effect.fail(notFound("ClubTeam", decoded.teamId)),
              ),
            );
          const link = yield* resolveLink(decoded);
          const rows = yield* repo.listSeasonFixtures({
            organizationId: decoded.organizationId,
            teamId: decoded.teamId,
            seasonId: link.seasonId,
          });
          let played = 0;
          let wins = 0;
          let losses = 0;
          let draws = 0;
          let goalsFor = 0;
          let goalsAgainst = 0;
          let assistedGoals = 0;
          let gamesWithStats = 0;
          let shots = 0;
          let saves = 0;
          let trackedShots = false;
          let trackedSaves = false;
          for (const row of rows) {
            const scores = effectiveScores({
              isHome: row.isHome,
              homeScore: row.homeScore,
              awayScore: row.awayScore,
              goalsForOverride: row.goalsForOverride,
              goalsAgainstOverride: row.goalsAgainstOverride,
            });
            if (scores === null) continue;
            played += 1;
            goalsFor += scores.goalsFor;
            goalsAgainst += scores.goalsAgainst;
            if (scores.goalsFor > scores.goalsAgainst) wins += 1;
            else if (scores.goalsFor < scores.goalsAgainst) losses += 1;
            else draws += 1;
            if (row.hasStats !== null) {
              gamesWithStats += 1;
              assistedGoals += row.assistedGoals ?? 0;
              if (row.shots !== null) {
                trackedShots = true;
                shots += row.shots;
              }
              if (row.saves !== null) {
                trackedSaves = true;
                saves += row.saves;
              }
            }
          }
          return new TeamSeasonSummary({
            teamId: decoded.teamId,
            seasonId: link.seasonId,
            played,
            wins,
            losses,
            draws,
            goalsFor,
            goalsAgainst,
            goalDifference: goalsFor - goalsAgainst,
            assistedGoals,
            shots: trackedShots ? shots : null,
            saves: trackedSaves ? saves : null,
            gamesWithStats,
          });
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(parseSqlError(error)),
          ),
          Effect.tapError((error) =>
            Effect.logError("Failed to get team season summary", error),
          ),
        );

      const getTeamPlayerStats = (
        input: SchemaInput<typeof TeamSeasonStatsInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamSeasonStatsInput, input);
          const link = yield* resolveLink(decoded);
          const manualRows = yield* repo.listManualSeasonPlayerStats({
            organizationId: decoded.organizationId,
            teamId: decoded.teamId,
            seasonId: link.seasonId,
          });
          const totals = new Map<
            string,
            {
              rosterPlayerId: string;
              playerName: string;
              jerseyNumber: number | null;
              gamesPlayed: number;
              goals: number;
              assists: number;
              shots: number;
              saves: number;
              trackedShots: boolean;
              trackedSaves: boolean;
            }
          >();
          for (const row of manualRows) {
            const current = totals.get(row.rosterPlayerId) ?? {
              rosterPlayerId: row.rosterPlayerId,
              playerName: row.playerName,
              jerseyNumber: row.jerseyNumber,
              gamesPlayed: 0,
              goals: 0,
              assists: 0,
              shots: 0,
              saves: 0,
              trackedShots: false,
              trackedSaves: false,
            };
            current.gamesPlayed += 1;
            current.goals += row.goals;
            current.assists += row.assists;
            if (row.shots !== null) {
              current.trackedShots = true;
              current.shots += row.shots;
            }
            if (row.saves !== null) {
              current.trackedSaves = true;
              current.saves += row.saves;
            }
            totals.set(row.rosterPlayerId, current);
          }
          const gamedayRows = yield* repo.listGamedaySeasonPlayerStats({
            organizationId: decoded.organizationId,
            teamId: decoded.teamId,
            seasonId: link.seasonId,
          });
          return new TeamPlayerStats({
            teamId: decoded.teamId,
            seasonId: link.seasonId,
            manual: [...totals.values()]
              .map(
                (row) =>
                  new ManualPlayerSeasonTotal({
                    rosterPlayerId: row.rosterPlayerId,
                    playerName: row.playerName,
                    jerseyNumber: row.jerseyNumber,
                    gamesPlayed: row.gamesPlayed,
                    goals: row.goals,
                    assists: row.assists,
                    points: row.goals + row.assists,
                    shots: row.trackedShots ? row.shots : null,
                    saves: row.trackedSaves ? row.saves : null,
                  }),
              )
              .toSorted((a, b) =>
                b.points === a.points
                  ? a.playerName.localeCompare(b.playerName)
                  : b.points - a.points,
              ),
            gameday: gamedayRows.map((row) => {
              const points =
                row.goals === null && row.assists === null
                  ? null
                  : (row.goals ?? 0) + (row.assists ?? 0);
              return new GamedayPlayerSeasonTotal({ ...row, points });
            }),
          });
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(parseSqlError(error)),
          ),
          Effect.tapError((error) =>
            Effect.logError("Failed to get team player statistics", error),
          ),
        );

      const getTeamStandings = (
        input: SchemaInput<typeof TeamSeasonStatsInput>,
      ) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(TeamSeasonStatsInput, input);
          const link = yield* resolveLink(decoded);
          let rows = yield* repo.listStandings(link);
          if (rows.length === 0) {
            yield* gameday.fetchLadder(link.compId).pipe(
              Effect.flatMap((ladder) =>
                gamedayRepo.replaceLadder({
                  sourceId: link.sourceId,
                  seasonId: link.seasonId,
                  compId: link.compId,
                  ladder,
                }),
              ),
              Effect.catchTag("GamedayError", (error) =>
                Effect.fail(
                  validation(
                    `GameDay standings are not available yet: ${error.message}`,
                  ),
                ),
              ),
            );
            rows = yield* repo.listStandings(link);
          }
          const first = rows[0];
          if (first === undefined) {
            return yield* Effect.fail(
              validation(
                "GameDay returned no ladder rows for this competition",
              ),
            );
          }
          return new TeamStandings({
            teamId: decoded.teamId,
            seasonId: link.seasonId,
            compId: link.compId,
            compName: link.compName ?? link.compId,
            gamedayTeamId: link.gamedayTeamId,
            sourceUploadedAt: first.sourceUploadedAt,
            fetchedAt: first.fetchedAt,
            rows: rows.map(
              (row) =>
                new StandingRow({
                  position: row.position,
                  gamedayTeamId: row.gamedayTeamId,
                  teamName: row.teamName,
                  played: row.played,
                  wins: row.wins,
                  losses: row.losses,
                  draws: row.draws,
                  byes: row.byes,
                  forfeitsFor: row.forfeitsFor,
                  forfeitsGiven: row.forfeitsGiven,
                  goalsFor: row.goalsFor,
                  goalsAgainst: row.goalsAgainst,
                  goalDifference: row.goalDifference,
                  percentage: row.percentage,
                  premiershipPoints: row.premiershipPoints,
                }),
            ),
          });
        }).pipe(
          Effect.catchTag("SqlError", (error) =>
            Effect.fail(parseSqlError(error)),
          ),
          Effect.tapError((error) =>
            Effect.logError("Failed to get team standings", error),
          ),
        );

      return {
        getFixtureStatSheet,
        upsertFixtureStatSheet,
        getTeamSeasonSummary,
        getTeamPlayerStats,
        getTeamStandings,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide([
      StatsRepo.layer,
      MatchRepo.layer,
      ClubRepo.layer,
      GamedayRepo.layer,
      GamedayClient.layer,
    ]),
  );
}
