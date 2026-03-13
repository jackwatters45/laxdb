import { PgClient } from "@effect/sql-pg";
import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";

import { UserRepo } from "./user.repo";
import { UserService } from "./user.service";

const ServiceLayer = Layer.effect(UserService, UserService.make).pipe(
  Layer.provide(Layer.effect(UserRepo, UserRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

/** Insert a test user directly via SQL (bypasses better-auth) */
const seedUser = (email: string, name = "Test User") =>
  Effect.gen(function* () {
    const sql = yield* PgClient.PgClient;
    yield* sql`
      INSERT INTO "user" (id, name, email, email_verified, created_at)
      VALUES (${`test-${email}`}, ${name}, ${email}, false, NOW())
    `;
  });

layer(TestLayer)("UserService integration", (it) => {
  it.effect("finds a user by email", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      yield* seedUser("alice@test.com", "Alice");

      const svc = yield* UserService;
      const user = yield* svc.fromEmail({ email: "alice@test.com" });

      expect(user.email).toBe("alice@test.com");
      expect(user.name).toBe("Alice");
    }),
  );

  it.effect("nonexistent email → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* UserService;

      const exit = yield* svc
        .fromEmail({ email: "nobody@test.com" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("invalid email → fails", () =>
    Effect.gen(function* () {
      const svc = yield* UserService;

      const exit = yield* svc
        .fromEmail({ email: "not-an-email" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("email lookup is case-sensitive", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      yield* seedUser("alice@test.com", "Alice");

      const svc = yield* UserService;

      // NOTE: PostgreSQL WHERE = is case-sensitive by default.
      // If this test fails, it means the DB or query has been changed to
      // case-insensitive matching, and we should update expectations.
      const exit = yield* svc
        .fromEmail({ email: "Alice@Test.com" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("empty string email → fails", () =>
    Effect.gen(function* () {
      const svc = yield* UserService;

      const exit = yield* svc.fromEmail({ email: "" }).pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );
});
