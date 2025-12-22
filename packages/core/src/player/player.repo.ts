import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, inArray, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type {
  AddPlayerToTeamInput,
  BulkDeletePlayersInput,
  CreatePlayerInput,
  DeletePlayerInput,
  GetAllPlayersInput,
  GetTeamPlayersInput,
  UpdatePlayerInput,
  UpdateTeamPlayerInput,
} from './player.schema';
import {
  type Player as PlayerSelect,
  playerTable,
  teamPlayerTable,
} from './player.sql';

export class PlayerRepo extends Effect.Service<PlayerRepo>()('PlayerRepo', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...rest } = getTableColumns(playerTable);

    return {
      list: (input: GetAllPlayersInput) =>
        Effect.gen(function* () {
          const players: PlayerSelect[] = yield* db
            .select(rest)
            .from(playerTable)
            .where(
              and(
                eq(playerTable.organizationId, input.organizationId),
                isNull(playerTable.deletedAt)
              )
            )
            .pipe(Effect.tapError(Effect.logError));

          return players;
        }),

      create: (input: CreatePlayerInput) =>
        Effect.gen(function* () {
          const player: PlayerSelect = yield* db
            .insert(playerTable)
            .values({
              organizationId: input.organizationId,
              userId: input.userId ?? null,
              name: input.name,
              email: input.email ?? null,
              phone: input.phone ?? null,
              dateOfBirth: input.dateOfBirth ?? null,
            })
            .returning(rest)
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return player;
        }),

      update: (input: UpdatePlayerInput) =>
        db
          .update(playerTable)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.email !== undefined && { email: input.email }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.dateOfBirth !== undefined && {
              dateOfBirth: input.dateOfBirth,
            }),
          })
          .where(
            and(
              eq(playerTable.publicId, input.publicPlayerId),
              isNull(playerTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      delete: (input: DeletePlayerInput) =>
        db
          .update(playerTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(playerTable.publicId, input.playerId),
              isNull(playerTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      bulkDelete: (input: BulkDeletePlayersInput) =>
        db
          .update(playerTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(playerTable.publicId, input.playerIds),
              isNull(playerTable.deletedAt)
            )
          )
          .pipe(Effect.tapError(Effect.logError)),

      getTeamPlayers: (input: GetTeamPlayersInput) =>
        db
          .select({
            publicId: playerTable.publicId,
            organizationId: playerTable.organizationId,
            userId: playerTable.userId,
            name: playerTable.name,
            email: playerTable.email,
            phone: playerTable.phone,
            dateOfBirth: playerTable.dateOfBirth,
            createdAt: playerTable.createdAt,
            updatedAt: playerTable.updatedAt,
            deletedAt: playerTable.deletedAt,
            teamId: teamPlayerTable.teamId,
            jerseyNumber: teamPlayerTable.jerseyNumber,
            position: teamPlayerTable.position,
          })
          .from(playerTable)
          .innerJoin(
            teamPlayerTable,
            eq(playerTable.id, teamPlayerTable.playerId)
          )
          .where(
            and(
              eq(teamPlayerTable.teamId, input.teamId),
              isNull(playerTable.deletedAt)
            )
          )
          .pipe(Effect.tapError(Effect.logError)),

      getPlayerIdByPublicId: (publicId: string) =>
        db
          .select({ id: playerTable.id })
          .from(playerTable)
          .where(
            and(
              eq(playerTable.publicId, publicId),
              isNull(playerTable.deletedAt)
            )
          )
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      addPlayerToTeam: (playerId: number, input: AddPlayerToTeamInput) =>
        db
          .insert(teamPlayerTable)
          .values({
            teamId: input.teamId,
            playerId,
            jerseyNumber: input.jerseyNumber ?? null,
            position: input.position ?? null,
          })
          .returning()
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      updateTeamPlayer: (playerId: number, input: UpdateTeamPlayerInput) =>
        db
          .update(teamPlayerTable)
          .set({
            ...(input.jerseyNumber !== undefined && {
              jerseyNumber: input.jerseyNumber,
            }),
            ...(input.position !== undefined && { position: input.position }),
          })
          .where(
            and(
              eq(teamPlayerTable.teamId, input.teamId),
              eq(teamPlayerTable.playerId, playerId)
            )
          )
          .returning()
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),

      removePlayerFromTeam: (playerId: number, teamId: string) =>
        db
          .delete(teamPlayerTable)
          .where(
            and(
              eq(teamPlayerTable.teamId, teamId),
              eq(teamPlayerTable.playerId, playerId)
            )
          )
          .pipe(Effect.tapError(Effect.logError)),

      bulkRemovePlayersFromTeam: (playerIds: number[], teamId: string) =>
        db
          .delete(teamPlayerTable)
          .where(
            and(
              eq(teamPlayerTable.teamId, teamId),
              inArray(teamPlayerTable.playerId, playerIds)
            )
          )
          .pipe(Effect.tapError(Effect.logError)),

      getPlayerIdsByPublicIds: (publicIds: string[]) =>
        db
          .select({ id: playerTable.id })
          .from(playerTable)
          .where(
            and(
              inArray(playerTable.publicId, publicIds),
              isNull(playerTable.deletedAt)
            )
          )
          .pipe(Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
