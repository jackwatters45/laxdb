import { eq } from "drizzle-orm";
import { Effect, Layer, Context } from "effect";

import { users as userTable, type User as UserSelect } from "../auth/auth.sql";
import { headOrFail, DrizzleService, query } from "../drizzle/drizzle.service";

import type { GetUserFromEmailInput } from "./user.schema";

export class UserRepo extends Context.Service<UserRepo>()("UserRepo", {
  make: Effect.gen(function* () {
    const db = yield* DrizzleService;

    return {
      get: (input: GetUserFromEmailInput) =>
        Effect.gen(function* () {
          const user: UserSelect = yield* query(
            db.select().from(userTable).where(eq(userTable.email, input.email)),
          ).pipe(Effect.flatMap(headOrFail));

          return user;
        }),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}
