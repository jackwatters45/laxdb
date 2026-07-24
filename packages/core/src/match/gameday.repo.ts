import { DrizzleService, query } from "@laxdb/core/drizzle/drizzle.service";
import { and, asc, eq, getColumns, or } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import type {
  UpsertClubTeamGamedayLinkInput,
  UpsertGamedaySourceInput,
  UpsertRosterPlayerGamedayLinkInput,
  UpsertSyncedGamedayCompetitionInput,
  UpsertSyncedGamedayFixtureInput,
  UpsertSyncedGamedayPlayerInput,
  UpsertSyncedGamedayRosterEntryInput,
  UpsertSyncedGamedaySeasonInput,
  UpsertSyncedGamedayTeamInput,
} from "./gameday.schema";
import {
  clubTeamGamedayLinks,
  gamedayCompetitions,
  gamedayFixtures,
  gamedayPlayers,
  gamedayRosterEntries,
  gamedaySeasons,
  gamedaySources,
  gamedayTeams,
  rosterPlayerGamedayLinks,
} from "./gameday.sql";

const seasonRowId = (sourceId: string, seasonId: string) =>
  `${sourceId}:season:${seasonId}`;

const competitionRowId = (sourceId: string, seasonId: string, compId: string) =>
  `${sourceId}:season:${seasonId}:comp:${compId}`;

const teamRowId = (
  sourceId: string,
  seasonId: string,
  compId: string,
  teamId: string,
) => `${sourceId}:season:${seasonId}:comp:${compId}:team:${teamId}`;

const fixtureRowId = (
  sourceId: string,
  seasonId: string,
  compId: string,
  fixtureId: string,
) => `${sourceId}:season:${seasonId}:comp:${compId}:fixture:${fixtureId}`;

const playerRowId = (sourceId: string, playerId: string) =>
  `${sourceId}:player:${playerId}`;

const rosterEntryRowId = (
  sourceId: string,
  seasonId: string,
  compId: string,
  teamId: string,
  playerId: string,
) =>
  `${sourceId}:season:${seasonId}:comp:${compId}:team:${teamId}:player:${playerId}`;

const clubTeamLinkRowId = (
  organizationId: string,
  sourceId: string,
  seasonId: string,
  compId: string,
  teamId: string,
) =>
  `${organizationId}:source:${sourceId}:season:${seasonId}:comp:${compId}:team:${teamId}`;

const rosterPlayerLinkRowId = (
  organizationId: string,
  sourceId: string,
  seasonId: string,
  compId: string,
  teamId: string,
  playerId: string,
) =>
  `${organizationId}:source:${sourceId}:season:${seasonId}:comp:${compId}:team:${teamId}:player:${playerId}`;

export class GamedayRepo extends Context.Service<GamedayRepo>()("GamedayRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;
    const sourceColumns = getColumns(gamedaySources);
    const competitionColumns = getColumns(gamedayCompetitions);
    const teamColumns = getColumns(gamedayTeams);
    const fixtureColumns = getColumns(gamedayFixtures);
    const rosterEntryColumns = getColumns(gamedayRosterEntries);
    const clubTeamLinkColumns = getColumns(clubTeamGamedayLinks);
    const rosterPlayerLinkColumns = getColumns(rosterPlayerGamedayLinks);

    return {
      upsertSource: (input: typeof UpsertGamedaySourceInput.Type) =>
        query(
          db
            .insert(gamedaySources)
            .values({
              id: input.id,
              name: input.name,
              clientId: input.clientId,
              baseUrl: input.baseUrl,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: gamedaySources.id,
              set: {
                name: input.name,
                clientId: input.clientId,
                baseUrl: input.baseUrl,
                updatedAt: new Date(),
              },
            })
            .returning(sourceColumns),
        ),

      getSource: (sourceId: string) =>
        query(
          db
            .select(sourceColumns)
            .from(gamedaySources)
            .where(eq(gamedaySources.id, sourceId)),
        ),

      upsertSeasons: (
        rows: readonly (typeof UpsertSyncedGamedaySeasonInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedaySeasons)
                  .values({
                    sourceId: row.sourceId,
                    seasonId: row.seasonId,
                    name: row.name,
                    id: seasonRowId(row.sourceId, row.seasonId),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [gamedaySeasons.sourceId, gamedaySeasons.seasonId],
                    set: {
                      name: row.name,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      upsertCompetitions: (
        rows: readonly (typeof UpsertSyncedGamedayCompetitionInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedayCompetitions)
                  .values({
                    sourceId: row.sourceId,
                    seasonId: row.seasonId,
                    compId: row.compId,
                    name: row.name,
                    id: competitionRowId(
                      row.sourceId,
                      row.seasonId,
                      row.compId,
                    ),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      gamedayCompetitions.sourceId,
                      gamedayCompetitions.seasonId,
                      gamedayCompetitions.compId,
                    ],
                    set: {
                      name: row.name,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      listCompetitions: (input: {
        readonly sourceId: string;
        readonly seasonId: string;
      }) =>
        query(
          db
            .select(competitionColumns)
            .from(gamedayCompetitions)
            .where(
              and(
                eq(gamedayCompetitions.sourceId, input.sourceId),
                eq(gamedayCompetitions.seasonId, input.seasonId),
              ),
            ),
        ),

      upsertTeams: (
        rows: readonly (typeof UpsertSyncedGamedayTeamInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedayTeams)
                  .values({
                    sourceId: row.sourceId,
                    seasonId: row.seasonId,
                    compId: row.compId,
                    teamId: row.teamId,
                    name: row.name,
                    id: teamRowId(
                      row.sourceId,
                      row.seasonId,
                      row.compId,
                      row.teamId,
                    ),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      gamedayTeams.sourceId,
                      gamedayTeams.seasonId,
                      gamedayTeams.compId,
                      gamedayTeams.teamId,
                    ],
                    set: {
                      name: row.name,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      listTeams: (input: {
        readonly sourceId: string;
        readonly seasonId: string;
      }) =>
        query(
          db
            .select(teamColumns)
            .from(gamedayTeams)
            .where(
              and(
                eq(gamedayTeams.sourceId, input.sourceId),
                eq(gamedayTeams.seasonId, input.seasonId),
              ),
            ),
        ),

      upsertFixtures: (
        rows: readonly (typeof UpsertSyncedGamedayFixtureInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedayFixtures)
                  .values({
                    sourceId: row.sourceId,
                    seasonId: row.seasonId,
                    compId: row.compId,
                    fixtureId: row.fixtureId,
                    compName: row.compName,
                    round: row.round,
                    scheduledAt: row.scheduledAt,
                    homeTeamId: row.homeTeamId,
                    awayTeamId: row.awayTeamId,
                    homeTeamName: row.homeTeamName,
                    awayTeamName: row.awayTeamName,
                    venueName: row.venueName,
                    matchStatus: row.matchStatus,
                    homeScore: row.homeScore,
                    awayScore: row.awayScore,
                    id: fixtureRowId(
                      row.sourceId,
                      row.seasonId,
                      row.compId,
                      row.fixtureId,
                    ),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      gamedayFixtures.sourceId,
                      gamedayFixtures.seasonId,
                      gamedayFixtures.compId,
                      gamedayFixtures.fixtureId,
                    ],
                    set: {
                      compName: row.compName,
                      round: row.round,
                      scheduledAt: row.scheduledAt,
                      homeTeamId: row.homeTeamId,
                      awayTeamId: row.awayTeamId,
                      homeTeamName: row.homeTeamName,
                      awayTeamName: row.awayTeamName,
                      venueName: row.venueName,
                      matchStatus: row.matchStatus,
                      homeScore: row.homeScore,
                      awayScore: row.awayScore,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      upsertPlayers: (
        rows: readonly (typeof UpsertSyncedGamedayPlayerInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedayPlayers)
                  .values({
                    sourceId: row.sourceId,
                    playerId: row.playerId,
                    name: row.name,
                    id: playerRowId(row.sourceId, row.playerId),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [gamedayPlayers.sourceId, gamedayPlayers.playerId],
                    set: {
                      name: row.name,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      upsertRosterEntries: (
        rows: readonly (typeof UpsertSyncedGamedayRosterEntryInput.Type)[],
      ) =>
        Effect.gen(function* () {
          const now = new Date();
          yield* Effect.forEach(
            rows,
            (row) =>
              query(
                db
                  .insert(gamedayRosterEntries)
                  .values({
                    sourceId: row.sourceId,
                    seasonId: row.seasonId,
                    compId: row.compId,
                    teamId: row.teamId,
                    playerId: row.playerId,
                    playerName: row.playerName,
                    gamesPlayed: row.gamesPlayed,
                    totalAssists: row.totalAssists,
                    totalScore: row.totalScore,
                    id: rosterEntryRowId(
                      row.sourceId,
                      row.seasonId,
                      row.compId,
                      row.teamId,
                      row.playerId,
                    ),
                    createdAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      gamedayRosterEntries.sourceId,
                      gamedayRosterEntries.seasonId,
                      gamedayRosterEntries.compId,
                      gamedayRosterEntries.teamId,
                      gamedayRosterEntries.playerId,
                    ],
                    set: {
                      playerName: row.playerName,
                      gamesPlayed: row.gamesPlayed,
                      totalAssists: row.totalAssists,
                      totalScore: row.totalScore,
                      updatedAt: now,
                    },
                  }),
              ),
            { discard: true },
          );
          return rows.length;
        }),

      getClubTeamLinkForExternal: (input: {
        readonly organizationId: string;
        readonly sourceId: string;
        readonly seasonId: string;
        readonly compId: string;
        readonly gamedayTeamId: string;
      }) =>
        query(
          db
            .select(clubTeamLinkColumns)
            .from(clubTeamGamedayLinks)
            .where(
              and(
                eq(clubTeamGamedayLinks.organizationId, input.organizationId),
                eq(clubTeamGamedayLinks.sourceId, input.sourceId),
                eq(clubTeamGamedayLinks.seasonId, input.seasonId),
                eq(clubTeamGamedayLinks.compId, input.compId),
                eq(clubTeamGamedayLinks.gamedayTeamId, input.gamedayTeamId),
              ),
            ),
        ),

      getLegacyClubTeamLinkForExternal: (input: {
        readonly organizationId: string;
        readonly sourceId: string;
        readonly compId: string;
        readonly gamedayTeamId: string;
      }) =>
        query(
          db
            .select(clubTeamLinkColumns)
            .from(clubTeamGamedayLinks)
            .where(
              and(
                eq(clubTeamGamedayLinks.organizationId, input.organizationId),
                eq(clubTeamGamedayLinks.sourceId, input.sourceId),
                eq(clubTeamGamedayLinks.seasonId, "legacy"),
                eq(clubTeamGamedayLinks.compId, input.compId),
                eq(clubTeamGamedayLinks.gamedayTeamId, input.gamedayTeamId),
              ),
            ),
        ),

      deleteClubTeamLink: (id: string) =>
        query(
          db
            .delete(clubTeamGamedayLinks)
            .where(eq(clubTeamGamedayLinks.id, id)),
        ),

      listClubTeamLinks: (input: {
        readonly organizationId: string;
        readonly clubTeamId: string;
      }) =>
        query(
          db
            .select(clubTeamLinkColumns)
            .from(clubTeamGamedayLinks)
            .where(
              and(
                eq(clubTeamGamedayLinks.organizationId, input.organizationId),
                eq(clubTeamGamedayLinks.clubTeamId, input.clubTeamId),
              ),
            )
            .orderBy(asc(clubTeamGamedayLinks.seasonId)),
        ),

      upsertClubTeamLink: (input: typeof UpsertClubTeamGamedayLinkInput.Type) =>
        query(
          db
            .insert(clubTeamGamedayLinks)
            .values({
              organizationId: input.organizationId,
              clubTeamId: input.clubTeamId,
              sourceId: input.sourceId,
              seasonId: input.seasonId,
              compId: input.compId,
              gamedayTeamId: input.gamedayTeamId,
              id: clubTeamLinkRowId(
                input.organizationId,
                input.sourceId,
                input.seasonId,
                input.compId,
                input.gamedayTeamId,
              ),
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                clubTeamGamedayLinks.organizationId,
                clubTeamGamedayLinks.sourceId,
                clubTeamGamedayLinks.seasonId,
                clubTeamGamedayLinks.compId,
                clubTeamGamedayLinks.gamedayTeamId,
              ],
              set: {
                clubTeamId: input.clubTeamId,
                updatedAt: new Date(),
              },
            })
            .returning(clubTeamLinkColumns),
        ),

      listFixturesForClubTeamLink: (input: {
        readonly sourceId: string;
        readonly seasonId: string;
        readonly compId: string;
        readonly gamedayTeamId: string;
      }) =>
        query(
          db
            .select(fixtureColumns)
            .from(gamedayFixtures)
            .where(
              and(
                eq(gamedayFixtures.sourceId, input.sourceId),
                eq(gamedayFixtures.seasonId, input.seasonId),
                eq(gamedayFixtures.compId, input.compId),
                or(
                  eq(gamedayFixtures.homeTeamId, input.gamedayTeamId),
                  eq(gamedayFixtures.awayTeamId, input.gamedayTeamId),
                ),
              ),
            )
            .orderBy(asc(gamedayFixtures.scheduledAt)),
        ),

      listRosterEntriesForClubTeamLink: (input: {
        readonly sourceId: string;
        readonly seasonId: string;
        readonly compId: string;
        readonly gamedayTeamId: string;
      }) =>
        query(
          db
            .select(rosterEntryColumns)
            .from(gamedayRosterEntries)
            .where(
              and(
                eq(gamedayRosterEntries.sourceId, input.sourceId),
                eq(gamedayRosterEntries.seasonId, input.seasonId),
                eq(gamedayRosterEntries.compId, input.compId),
                eq(gamedayRosterEntries.teamId, input.gamedayTeamId),
              ),
            )
            .orderBy(asc(gamedayRosterEntries.playerName)),
        ),

      getRosterPlayerLinkForExternal: (input: {
        readonly organizationId: string;
        readonly sourceId: string;
        readonly seasonId: string;
        readonly compId: string;
        readonly gamedayTeamId: string;
        readonly gamedayPlayerId: string;
      }) =>
        query(
          db
            .select(rosterPlayerLinkColumns)
            .from(rosterPlayerGamedayLinks)
            .where(
              and(
                eq(
                  rosterPlayerGamedayLinks.organizationId,
                  input.organizationId,
                ),
                eq(rosterPlayerGamedayLinks.sourceId, input.sourceId),
                eq(rosterPlayerGamedayLinks.seasonId, input.seasonId),
                eq(rosterPlayerGamedayLinks.compId, input.compId),
                eq(rosterPlayerGamedayLinks.gamedayTeamId, input.gamedayTeamId),
                eq(
                  rosterPlayerGamedayLinks.gamedayPlayerId,
                  input.gamedayPlayerId,
                ),
              ),
            ),
        ),

      upsertRosterPlayerLink: (
        input: typeof UpsertRosterPlayerGamedayLinkInput.Type,
      ) =>
        query(
          db
            .insert(rosterPlayerGamedayLinks)
            .values({
              organizationId: input.organizationId,
              rosterPlayerId: input.rosterPlayerId,
              sourceId: input.sourceId,
              seasonId: input.seasonId,
              compId: input.compId,
              gamedayTeamId: input.gamedayTeamId,
              gamedayPlayerId: input.gamedayPlayerId,
              id: rosterPlayerLinkRowId(
                input.organizationId,
                input.sourceId,
                input.seasonId,
                input.compId,
                input.gamedayTeamId,
                input.gamedayPlayerId,
              ),
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [
                rosterPlayerGamedayLinks.organizationId,
                rosterPlayerGamedayLinks.sourceId,
                rosterPlayerGamedayLinks.seasonId,
                rosterPlayerGamedayLinks.compId,
                rosterPlayerGamedayLinks.gamedayTeamId,
                rosterPlayerGamedayLinks.gamedayPlayerId,
              ],
              set: {
                rosterPlayerId: input.rosterPlayerId,
                updatedAt: new Date(),
              },
            })
            .returning(rosterPlayerLinkColumns),
        ),
    };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
