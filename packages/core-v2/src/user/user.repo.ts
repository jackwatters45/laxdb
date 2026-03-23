import { eq } from "drizzle-orm";
import { Effect, Layer, ServiceMap } from "effect";

import { headOrFail, PgDrizzle, query } from "../drizzle/drizzle.service";

import type { GetUserFromEmailInput } from "./user.schema";
import { type UserSelect, userTable } from "./user.sql";

export class UserRepo extends ServiceMap.Service<UserRepo>()("UserRepo", {
  make: Effect.gen(function* () {
    const db = yield* PgDrizzle;

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
