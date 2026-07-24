import {
  DrizzleService,
  headOrFail,
  query,
} from "@laxdb/core/drizzle/drizzle.service";
import { and, asc, desc, eq, getColumns, notInArray } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { nanoid } from "nanoid";

import { rosterPlayers } from "../club/club.sql";
import {
  clubTeamGamedayLinks,
  gamedayCompetitions,
  gamedayLadderRows,
  gamedayRosterEntries,
  rosterPlayerGamedayLinks,
} from "../match/gameday.sql";
import { fixtures } from "../match/match.sql";

import { fixturePlayerStats, fixtureTeamStats } from "./stats.sql";

export type UpsertFixtureTeamStats = {
  readonly organizationId: string;
  readonly fixtureId: string;
  readonly teamId: string;
  readonly goalsForOverride: number | null;
  readonly goalsAgainstOverride: number | null;
  readonly assistedGoals: number;
  readonly shots: number | null;
  readonly saves: number | null;
  readonly submittedByUserId: string | null;
};

export type UpsertFixturePlayerStats = {
  readonly rosterPlayerId: string;
  readonly goals: number;
  readonly assists: number;
  readonly shots: number | null;
  readonly saves: number | null;
};

export class StatsRepo extends Context.Service<StatsRepo>()("StatsRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;
    const teamStatColumns = getColumns(fixtureTeamStats);

    return {
      getFixtureTeamStats: (input: {
        readonly organizationId: string;
        readonly fixtureId: string;
      }) =>
        query(
          db
            .select(teamStatColumns)
            .from(fixtureTeamStats)
            .where(
              and(
                eq(fixtureTeamStats.organizationId, input.organizationId),
                eq(fixtureTeamStats.fixtureId, input.fixtureId),
              ),
            ),
        ),

      listFixturePlayerStats: (input: {
        readonly organizationId: string;
        readonly fixtureId: string;
      }) =>
        query(
          db
            .select({
              rosterPlayerId: fixturePlayerStats.rosterPlayerId,
              playerName: rosterPlayers.name,
              jerseyNumber: rosterPlayers.jerseyNumber,
              goals: fixturePlayerStats.goals,
              assists: fixturePlayerStats.assists,
              shots: fixturePlayerStats.shots,
              saves: fixturePlayerStats.saves,
            })
            .from(fixturePlayerStats)
            .innerJoin(
              rosterPlayers,
              and(
                eq(rosterPlayers.id, fixturePlayerStats.rosterPlayerId),
                eq(
                  rosterPlayers.organizationId,
                  fixturePlayerStats.organizationId,
                ),
              ),
            )
            .where(
              and(
                eq(fixturePlayerStats.organizationId, input.organizationId),
                eq(fixturePlayerStats.fixtureId, input.fixtureId),
              ),
            )
            .orderBy(asc(rosterPlayers.name)),
        ),

      upsertFixtureTeamStats: (input: UpsertFixtureTeamStats) =>
        query(
          db
            .insert(fixtureTeamStats)
            .values({
              ...input,
              id: nanoid(),
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                fixtureTeamStats.organizationId,
                fixtureTeamStats.fixtureId,
              ],
              set: {
                goalsForOverride: input.goalsForOverride,
                goalsAgainstOverride: input.goalsAgainstOverride,
                assistedGoals: input.assistedGoals,
                shots: input.shots,
                saves: input.saves,
                submittedByUserId: input.submittedByUserId,
                updatedAt: new Date(),
              },
            })
            .returning(teamStatColumns),
        ).pipe(Effect.flatMap(headOrFail)),

      replaceFixturePlayerStats: (input: {
        readonly organizationId: string;
        readonly fixtureId: string;
        readonly teamId: string;
        readonly players: readonly UpsertFixturePlayerStats[];
      }) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            input.players,
            (player) =>
              query(
                db
                  .insert(fixturePlayerStats)
                  .values({
                    id: nanoid(),
                    organizationId: input.organizationId,
                    fixtureId: input.fixtureId,
                    teamId: input.teamId,
                    ...player,
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      fixturePlayerStats.organizationId,
                      fixturePlayerStats.fixtureId,
                      fixturePlayerStats.rosterPlayerId,
                    ],
                    set: {
                      goals: player.goals,
                      assists: player.assists,
                      shots: player.shots,
                      saves: player.saves,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          const ids = input.players.map((player) => player.rosterPlayerId);
          yield* query(
            db
              .delete(fixturePlayerStats)
              .where(
                ids.length === 0
                  ? and(
                      eq(
                        fixturePlayerStats.organizationId,
                        input.organizationId,
                      ),
                      eq(fixturePlayerStats.fixtureId, input.fixtureId),
                    )
                  : and(
                      eq(
                        fixturePlayerStats.organizationId,
                        input.organizationId,
                      ),
                      eq(fixturePlayerStats.fixtureId, input.fixtureId),
                      notInArray(fixturePlayerStats.rosterPlayerId, ids),
                    ),
              ),
          );
          return input.players.length;
        }),

      resolveTeamSeasonLink: (input: {
        readonly organizationId: string;
        readonly teamId: string;
        readonly seasonId?: string | undefined;
      }) =>
        query(
          db
            .select({
              sourceId: clubTeamGamedayLinks.sourceId,
              seasonId: clubTeamGamedayLinks.seasonId,
              compId: clubTeamGamedayLinks.compId,
              gamedayTeamId: clubTeamGamedayLinks.gamedayTeamId,
              compName: gamedayCompetitions.name,
            })
            .from(clubTeamGamedayLinks)
            .leftJoin(
              gamedayCompetitions,
              and(
                eq(gamedayCompetitions.sourceId, clubTeamGamedayLinks.sourceId),
                eq(gamedayCompetitions.seasonId, clubTeamGamedayLinks.seasonId),
                eq(gamedayCompetitions.compId, clubTeamGamedayLinks.compId),
              ),
            )
            .where(
              and(
                eq(clubTeamGamedayLinks.organizationId, input.organizationId),
                eq(clubTeamGamedayLinks.clubTeamId, input.teamId),
                input.seasonId === undefined
                  ? notInArray(clubTeamGamedayLinks.seasonId, ["legacy"])
                  : eq(clubTeamGamedayLinks.seasonId, input.seasonId),
              ),
            )
            .orderBy(desc(clubTeamGamedayLinks.createdAt))
            .limit(1),
        ).pipe(Effect.flatMap(headOrFail)),

      listSeasonFixtures: (input: {
        readonly organizationId: string;
        readonly teamId: string;
        readonly seasonId: string;
      }) =>
        query(
          db
            .select({
              id: fixtures.id,
              isHome: fixtures.isHome,
              homeScore: fixtures.homeScore,
              awayScore: fixtures.awayScore,
              goalsForOverride: fixtureTeamStats.goalsForOverride,
              goalsAgainstOverride: fixtureTeamStats.goalsAgainstOverride,
              assistedGoals: fixtureTeamStats.assistedGoals,
              shots: fixtureTeamStats.shots,
              saves: fixtureTeamStats.saves,
              hasStats: fixtureTeamStats.id,
            })
            .from(fixtures)
            .leftJoin(
              fixtureTeamStats,
              and(
                eq(fixtureTeamStats.organizationId, fixtures.organizationId),
                eq(fixtureTeamStats.fixtureId, fixtures.id),
              ),
            )
            .where(
              and(
                eq(fixtures.organizationId, input.organizationId),
                eq(fixtures.teamId, input.teamId),
                eq(fixtures.seasonId, input.seasonId),
              ),
            ),
        ),

      listManualSeasonPlayerStats: (input: {
        readonly organizationId: string;
        readonly teamId: string;
        readonly seasonId: string;
      }) =>
        query(
          db
            .select({
              rosterPlayerId: fixturePlayerStats.rosterPlayerId,
              playerName: rosterPlayers.name,
              jerseyNumber: rosterPlayers.jerseyNumber,
              goals: fixturePlayerStats.goals,
              assists: fixturePlayerStats.assists,
              shots: fixturePlayerStats.shots,
              saves: fixturePlayerStats.saves,
            })
            .from(fixturePlayerStats)
            .innerJoin(
              fixtures,
              and(
                eq(fixtures.id, fixturePlayerStats.fixtureId),
                eq(fixtures.organizationId, fixturePlayerStats.organizationId),
                eq(fixtures.teamId, fixturePlayerStats.teamId),
              ),
            )
            .innerJoin(
              rosterPlayers,
              and(
                eq(rosterPlayers.id, fixturePlayerStats.rosterPlayerId),
                eq(
                  rosterPlayers.organizationId,
                  fixturePlayerStats.organizationId,
                ),
                eq(rosterPlayers.teamId, fixturePlayerStats.teamId),
              ),
            )
            .where(
              and(
                eq(fixturePlayerStats.organizationId, input.organizationId),
                eq(fixturePlayerStats.teamId, input.teamId),
                eq(fixtures.seasonId, input.seasonId),
              ),
            ),
        ),

      listGamedaySeasonPlayerStats: (input: {
        readonly organizationId: string;
        readonly teamId: string;
        readonly seasonId: string;
      }) =>
        query(
          db
            .select({
              rosterPlayerId: rosterPlayers.id,
              playerName: rosterPlayers.name,
              jerseyNumber: rosterPlayers.jerseyNumber,
              gamesPlayed: gamedayRosterEntries.gamesPlayed,
              goals: gamedayRosterEntries.totalScore,
              assists: gamedayRosterEntries.totalAssists,
            })
            .from(rosterPlayerGamedayLinks)
            .innerJoin(
              rosterPlayers,
              and(
                eq(rosterPlayers.id, rosterPlayerGamedayLinks.rosterPlayerId),
                eq(
                  rosterPlayers.organizationId,
                  rosterPlayerGamedayLinks.organizationId,
                ),
              ),
            )
            .innerJoin(
              gamedayRosterEntries,
              and(
                eq(
                  gamedayRosterEntries.sourceId,
                  rosterPlayerGamedayLinks.sourceId,
                ),
                eq(
                  gamedayRosterEntries.seasonId,
                  rosterPlayerGamedayLinks.seasonId,
                ),
                eq(
                  gamedayRosterEntries.compId,
                  rosterPlayerGamedayLinks.compId,
                ),
                eq(
                  gamedayRosterEntries.teamId,
                  rosterPlayerGamedayLinks.gamedayTeamId,
                ),
                eq(
                  gamedayRosterEntries.playerId,
                  rosterPlayerGamedayLinks.gamedayPlayerId,
                ),
              ),
            )
            .where(
              and(
                eq(
                  rosterPlayerGamedayLinks.organizationId,
                  input.organizationId,
                ),
                eq(rosterPlayers.teamId, input.teamId),
                eq(rosterPlayerGamedayLinks.seasonId, input.seasonId),
              ),
            )
            .orderBy(asc(rosterPlayers.name)),
        ),

      listStandings: (input: {
        readonly sourceId: string;
        readonly seasonId: string;
        readonly compId: string;
      }) =>
        query(
          db
            .select()
            .from(gamedayLadderRows)
            .where(
              and(
                eq(gamedayLadderRows.sourceId, input.sourceId),
                eq(gamedayLadderRows.seasonId, input.seasonId),
                eq(gamedayLadderRows.compId, input.compId),
              ),
            )
            .orderBy(asc(gamedayLadderRows.position)),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
