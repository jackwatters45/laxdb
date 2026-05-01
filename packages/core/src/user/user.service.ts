import { Effect, Layer, Schema, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { parseSqlError } from "../util";

import { UserRepo } from "./user.repo";
import { GetUserFromEmailInput } from "./user.schema";

export class UserService extends ServiceMap.Service<UserService>()(
  "UserService",
  {
    make: Effect.gen(function* () {
      const userRepo = yield* UserRepo;

      return {
        fromEmail: (input: GetUserFromEmailInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decodeUnknownEffect(
              GetUserFromEmailInput,
            )(input);
            return yield* userRepo.get(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "User", id: input.email }),
              ),
            ),
            Effect.catchTag("SqlError", (error) =>
              Effect.fail(parseSqlError(error)),
            ),
            Effect.tap((user) => Effect.log(`Found user: ${user.email}`)),
            Effect.tapError((error) =>
              Effect.logError("Failed to get user", error),
            ),
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(UserRepo.layer),
  );
}
