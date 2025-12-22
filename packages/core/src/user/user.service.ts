import { Effect, Schema } from 'effect';
import { NotFoundError } from '../error';
import { parsePostgresError } from '../util';
import { UserRepo } from './user.repo';
import { GetUserFromEmailInput } from './user.schema';

export class UserService extends Effect.Service<UserService>()('UserService', {
  effect: Effect.gen(function* () {
    const userRepo = yield* UserRepo;

    return {
      fromEmail: (input: GetUserFromEmailInput) =>
        Effect.gen(function* () {
          const decoded = yield* Schema.decode(GetUserFromEmailInput)(input);
          return yield* userRepo.get(decoded);
        }).pipe(
          Effect.catchTag('NoSuchElementException', () =>
            Effect.fail(new NotFoundError({ domain: 'User', id: input.email }))
          ),
          Effect.catchTag('SqlError', (error) =>
            Effect.fail(parsePostgresError(error))
          ),
          Effect.tap((user) => Effect.log(`Found user: ${user.email}`)),
          Effect.tapError((error) =>
            Effect.logError('Failed to get user', error)
          )
        ),
    } as const;
  }),
  dependencies: [UserRepo.Default],
}) {}
