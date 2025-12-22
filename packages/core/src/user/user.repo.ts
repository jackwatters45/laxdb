import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { eq } from 'drizzle-orm';
import { Array as Arr, Effect } from 'effect';
import { DatabaseLive } from '../drizzle/drizzle.service';
import type { GetUserFromEmailInput } from './user.schema';
import { type UserSelect, userTable } from './user.sql';

export class UserRepo extends Effect.Service<UserRepo>()('UserRepo', {
  effect: Effect.gen(function* () {
    const db = yield* PgDrizzle;

    return {
      get: (input: GetUserFromEmailInput) =>
        Effect.gen(function* () {
          const user: UserSelect = yield* db
            .select()
            .from(userTable)
            .where(eq(userTable.email, input.email))
            .pipe(Effect.flatMap(Arr.head), Effect.tapError(Effect.logError));

          return user;
        }),
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}
