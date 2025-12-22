import { Effect } from 'effect';
import { NotFoundError, ValidationError } from '../error';
import { decodeArguments, parsePostgresError } from '../util';
import { SeasonRepo } from './season.repo';
import {
  CreateSeasonInput,
  DeleteSeasonInput,
  GetAllSeasonsInput,
  GetSeasonInput,
  UpdateSeasonInput,
} from './season.schema';

export class SeasonService extends Effect.Service<SeasonService>()(
  'SeasonService',
  {
    effect: Effect.gen(function* () {
      const seasonRepo = yield* SeasonRepo;

      return {
        list: (input: GetAllSeasonsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetAllSeasonsInput, input);
            return yield* seasonRepo.list(decoded);
          }).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((seasons) =>
              Effect.log(`Found ${seasons.length} seasons`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to list seasons', error)
            )
          ),

        get: (input: GetSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetSeasonInput, input);
            const season = yield* seasonRepo.get(decoded);
            return season;
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: 'Season', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((season) => Effect.log(`Found season: ${season.name}`)),
            Effect.tapError((error) =>
              Effect.logError('Failed to get season', error)
            )
          ),

        create: (input: CreateSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateSeasonInput, input);

            if (decoded.endDate && decoded.startDate >= decoded.endDate) {
              return yield* Effect.fail(new ValidationError());
            }

            return yield* seasonRepo.create(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(new ValidationError())
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((season) =>
              Effect.log(`Created season: ${season.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to create season', error)
            )
          ),

        update: (input: UpdateSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateSeasonInput, input);
            return yield* seasonRepo.update(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: 'Season', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((season) =>
              Effect.log(`Updated season: ${season.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to update season', error)
            )
          ),

        delete: (input: DeleteSeasonInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeleteSeasonInput, input);
            return yield* seasonRepo.delete(decoded);
          }).pipe(
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(
                new NotFoundError({ domain: 'Season', id: input.publicId })
              )
            ),
            Effect.catchTag('SqlError', (error) =>
              Effect.fail(parsePostgresError(error))
            ),
            Effect.tap((season) =>
              Effect.log(`Deleted season: ${season.name}`)
            ),
            Effect.tapError((error) =>
              Effect.logError('Failed to delete season', error)
            )
          ),
      } as const;
    }),
    dependencies: [SeasonRepo.Default],
  }
) {}
