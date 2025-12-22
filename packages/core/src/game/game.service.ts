import { Effect } from 'effect';
import { NotFoundError } from '../error';
import { decodeArguments, parsePostgresError } from '../util';
import { GameRepo } from './game.repo';
import {
  CreateGameInput,
  DeleteGameInput,
  GetAllGamesInput,
  GetGameInput,
  UpdateGameInput,
} from './game.schema';

export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const gameRepo = yield* GameRepo;

    return {
      list: (input: GetAllGamesInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(GetAllGamesInput, input);
          return yield* gameRepo.list(decoded);
        }).pipe(
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((games) => Effect.log(`Found ${games.length} games`)),
          Effect.tapError((error) =>
            Effect.logError('Failed to list games', error)
          )
        ),

      get: (input: GetGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(GetGameInput, input);
          return yield* gameRepo.get(decoded);
        }).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(
              new NotFoundError({ domain: 'Game', id: input.publicId })
            )
          ),
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((game) => Effect.log(`Found game: ${game.opponentName}`)),
          Effect.tapError((error) =>
            Effect.logError('Failed to get game', error)
          )
        ),

      create: (input: CreateGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(CreateGameInput, input);
          return yield* gameRepo.create(decoded);
        }).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(new NotFoundError({ domain: 'Game', id: 'create' }))
          ),
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((game) =>
            Effect.log(`Created game: ${game.opponentName}`)
          ),
          Effect.tapError((error) =>
            Effect.logError('Failed to create game', error)
          )
        ),

      update: (input: UpdateGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(UpdateGameInput, input);
          return yield* gameRepo.update(decoded);
        }).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(
              new NotFoundError({ domain: 'Game', id: input.publicId })
            )
          ),
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((game) =>
            Effect.log(`Updated game: ${game.opponentName}`)
          ),
          Effect.tapError((error) =>
            Effect.logError('Failed to update game', error)
          )
        ),

      delete: (input: DeleteGameInput) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(DeleteGameInput, input);
          return yield* gameRepo.delete(decoded);
        }).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(
              new NotFoundError({ domain: 'Game', id: input.publicId })
            )
          ),
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((game) =>
            Effect.log(`Deleted game: ${game.opponentName}`)
          ),
          Effect.tapError((error) =>
            Effect.logError('Failed to delete game', error)
          )
        ),
    } as const;
  }),
  dependencies: [GameRepo.Default],
}) {}
