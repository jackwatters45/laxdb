import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type {
  CreateGameInput,
  DeleteGameInput,
  GetAllGamesInput,
  GetGameInput,
  UpdateGameInput,
} from './game.schema';
import { type GameSelect, gameTable } from './game.sql';

export class GameRepo extends Effect.Service<GameRepo>()('GameRepo', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...rest } = getTableColumns(gameTable);

    return {
      list: (input: GetAllGamesInput) =>
        Effect.gen(function* () {
          const games: GameSelect[] = yield* db
            .select(rest)
            .from(gameTable)
            .where(
              and(
                eq(gameTable.organizationId, input.organizationId),
                input.teamId ? eq(gameTable.teamId, input.teamId) : undefined,
                isNull(gameTable.deletedAt)
              )
            )
            .pipe(Effect.tapError(Effect.logError));

          return games;
        }),
      get: (input: GetGameInput) =>
        Effect.gen(function* () {
          const game: GameSelect = yield* db
            .select(rest)
            .from(gameTable)
            .where(
              and(
                eq(gameTable.publicId, input.publicId),
                eq(gameTable.organizationId, input.organizationId),
                input.teamId ? eq(gameTable.teamId, input.teamId) : undefined,
                isNull(gameTable.deletedAt)
              )
            )
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return game;
        }),
      create: (input: CreateGameInput) =>
        Effect.gen(function* () {
          const game: GameSelect = yield* db
            .insert(gameTable)
            .values({
              organizationId: input.organizationId,
              teamId: input.teamId,
              seasonId: input.seasonId,
              opponentName: input.opponentName,
              gameDate: input.gameDate,
              venue: input.venue,
              isHomeGame: input.isHomeGame,
              gameType: input.gameType ?? 'regular',
              status: input.status ?? 'scheduled',
            })
            .returning(rest)
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return game;
        }),
      update: (input: UpdateGameInput) =>
        db
          .update(gameTable)
          .set({
            ...(input.opponentName !== undefined && {
              opponentName: input.opponentName,
            }),
            ...(input.gameDate !== undefined && {
              gameDate: input.gameDate,
            }),
            ...(input.venue !== undefined && { venue: input.venue }),
            ...(input.isHomeGame !== undefined && {
              isHomeGame: input.isHomeGame,
            }),
            ...(input.gameType !== undefined && {
              gameType: input.gameType,
            }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.homeScore !== undefined && {
              homeScore: input.homeScore,
            }),
            ...(input.awayScore !== undefined && {
              awayScore: input.awayScore,
            }),
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.location !== undefined && {
              location: input.location,
            }),
            ...(input.uniformColor !== undefined && {
              uniformColor: input.uniformColor,
            }),
            ...(input.arrivalTime !== undefined && {
              arrivalTime: input.arrivalTime,
            }),
            ...(input.opponentLogoUrl !== undefined && {
              opponentLogoUrl: input.opponentLogoUrl,
            }),
            ...(input.externalGameId !== undefined && {
              externalGameId: input.externalGameId,
            }),
          })
          .where(
            and(
              eq(gameTable.publicId, input.publicId),
              eq(gameTable.organizationId, input.organizationId),
              input.teamId ? eq(gameTable.teamId, input.teamId) : undefined,
              isNull(gameTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
      delete: (input: DeleteGameInput) =>
        db
          .update(gameTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(gameTable.publicId, input.publicId),
              eq(gameTable.organizationId, input.organizationId),
              input.teamId ? eq(gameTable.teamId, input.teamId) : undefined,
              isNull(gameTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
