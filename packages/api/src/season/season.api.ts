import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
} from '@effect/platform';
import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '@laxdb/core/error';
import { SeasonContract } from '@laxdb/core/season/season.contract';
import { SeasonService } from '@laxdb/core/season/season.service';
import { Effect, Layer } from 'effect';

export const SeasonsApi = HttpApi.make('SeasonsApi').add(
  HttpApiGroup.make('Seasons')
    .add(
      HttpApiEndpoint.post('listSeasons', '/api/seasons')
        .addSuccess(SeasonContract.list.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(SeasonContract.list.payload)
    )
    .add(
      HttpApiEndpoint.post('getSeason', '/api/seasons/get')
        .addSuccess(SeasonContract.get.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(SeasonContract.get.payload)
    )
    .add(
      HttpApiEndpoint.post('createSeason', '/api/seasons/create')
        .addSuccess(SeasonContract.create.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(SeasonContract.create.payload)
    )
    .add(
      HttpApiEndpoint.post('updateSeason', '/api/seasons/update')
        .addSuccess(SeasonContract.update.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(SeasonContract.update.payload)
    )
    .add(
      HttpApiEndpoint.post('deleteSeason', '/api/seasons/delete')
        .addSuccess(SeasonContract.delete.success)
        .addError(NotFoundError)
        .addError(ValidationError)
        .addError(DatabaseError)
        .addError(ConstraintViolationError)
        .setPayload(SeasonContract.delete.payload)
    )
);

const SeasonsApiHandlers = HttpApiBuilder.group(
  SeasonsApi,
  'Seasons',
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* SeasonService;

      return handlers
        .handle('listSeasons', ({ payload }) => service.list(payload))
        .handle('getSeason', ({ payload }) => service.get(payload))
        .handle('createSeason', ({ payload }) => service.create(payload))
        .handle('updateSeason', ({ payload }) => service.update(payload))
        .handle('deleteSeason', ({ payload }) => service.delete(payload));
    })
).pipe(Layer.provide(SeasonService.Default));

export const SeasonsApiLive = HttpApiBuilder.api(SeasonsApi).pipe(
  Layer.provide(SeasonsApiHandlers)
);
