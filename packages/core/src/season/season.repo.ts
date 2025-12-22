import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { and, eq, getTableColumns, isNull } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type {
  CreateSeasonInput,
  DeleteSeasonInput,
  GetAllSeasonsInput,
  GetSeasonInput,
  UpdateSeasonInput,
} from './season.schema';
import { type SeasonSelect, seasonTable } from './season.sql';

export class SeasonRepo extends Effect.Service<SeasonRepo>()('SeasonRepo', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const { id: _, ...rest } = getTableColumns(seasonTable);

    return {
      list: (input: GetAllSeasonsInput) =>
        Effect.gen(function* () {
          const seasons: SeasonSelect[] = yield* db
            .select(rest)
            .from(seasonTable)
            .where(
              and(
                eq(seasonTable.organizationId, input.organizationId),
                input.teamId ? eq(seasonTable.teamId, input.teamId) : undefined,
                isNull(seasonTable.deletedAt)
              )
            )
            .pipe(Effect.tapError(Effect.logError));

          return seasons;
        }),
      get: (input: GetSeasonInput) =>
        Effect.gen(function* () {
          const season: SeasonSelect = yield* db
            .select(rest)
            .from(seasonTable)
            .where(
              and(
                eq(seasonTable.publicId, input.publicId),
                eq(seasonTable.organizationId, input.organizationId),
                input.teamId ? eq(seasonTable.teamId, input.teamId) : undefined,
                isNull(seasonTable.deletedAt)
              )
            )
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return season;
        }),
      create: (input: CreateSeasonInput) =>
        Effect.gen(function* () {
          const season: SeasonSelect = yield* db
            .insert(seasonTable)
            .values({
              organizationId: input.organizationId,
              teamId: input.teamId,
              name: input.name,
              startDate: input.startDate,
              endDate: input.endDate ?? null,
              status: input.status ?? 'active',
              division: input.division ?? null,
            })
            .returning(rest)
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return season;
        }),
      update: (input: UpdateSeasonInput) =>
        db
          .update(seasonTable)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.startDate !== undefined && {
              startDate: input.startDate,
            }),
            ...(input.endDate !== undefined && { endDate: input.endDate }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.division !== undefined && { division: input.division }),
          })
          .where(
            and(
              eq(seasonTable.publicId, input.publicId),
              eq(seasonTable.organizationId, input.organizationId),
              // TODO: add nullish team id to this...
              // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
              isNull(seasonTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
      delete: (input: DeleteSeasonInput) =>
        db
          .update(seasonTable)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(seasonTable.publicId, input.publicId),
              eq(seasonTable.organizationId, input.organizationId),
              // TODO: add nullish team id to this...
              // ...{ decoded.teamId && { ...eq(seasonTable.teamId, decoded.teamId) } },
              isNull(seasonTable.deletedAt)
            )
          )
          .returning(rest)
          .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError)),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
