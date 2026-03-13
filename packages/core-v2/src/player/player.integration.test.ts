import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { validCreatePlayer } from "../test/fixtures";

import { PlayerRepo } from "./player.repo";
import { PlayerService } from "./player.service";

const ServiceLayer = Layer.effect(PlayerService, PlayerService.make).pipe(
  Layer.provide(Layer.effect(PlayerRepo, PlayerRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

layer(TestLayer)("PlayerService integration", (it) => {
  it.effect("creates a player and returns it", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const player = yield* svc.create(
        validCreatePlayer({ name: "Alice", email: "alice@test.com" }),
      );

      expect(player.publicId).toHaveLength(12);
      expect(player.name).toBe("Alice");
      expect(player.email).toBe("alice@test.com");
      expect(player.createdAt).toBeInstanceOf(Date);
    }),
  );

  it.effect("lists all players", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      yield* svc.create(validCreatePlayer({ name: "A", email: "a@test.com" }));
      yield* svc.create(validCreatePlayer({ name: "B", email: "b@test.com" }));

      const players = yield* svc.list();
      expect(players).toHaveLength(2);
    }),
  );

  it.effect("gets a player by publicId", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());
      const found = yield* svc.getByPublicId({
        publicId: created.publicId,
      });

      expect(found.publicId).toBe(created.publicId);
      expect(found.name).toBe(created.name);
    }),
  );

  it.effect("get nonexistent player → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const exit = yield* svc
        .getByPublicId({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("updates a player name only", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());
      const updated = yield* svc.update({
        publicId: created.publicId,
        name: "Updated Name",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.email).toBe(created.email);
    }),
  );

  it.effect("updates a player email only", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());
      const updated = yield* svc.update({
        publicId: created.publicId,
        email: "new@test.com",
      });

      expect(updated.email).toBe("new@test.com");
      expect(updated.name).toBe(created.name);
    }),
  );

  it.effect("updates both name and email", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());
      const updated = yield* svc.update({
        publicId: created.publicId,
        name: "New Name",
        email: "new@test.com",
      });

      expect(updated.name).toBe("New Name");
      expect(updated.email).toBe("new@test.com");
    }),
  );

  it.effect("update nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const exit = yield* svc
        .update({ publicId: "AbCdEfGhIjKl", name: "X" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("deletes a player", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());
      const deleted = yield* svc.delete({ publicId: created.publicId });

      expect(deleted.publicId).toBe(created.publicId);

      const list = yield* svc.list();
      expect(list).toHaveLength(0);
    }),
  );

  it.effect("delete nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const exit = yield* svc
        .delete({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it.effect("create with empty name → ValidationError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const exit = yield* svc
        .create({ name: "", email: "a@b.com" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with name > 100 chars → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;

      const exit = yield* svc
        .create({ name: "A".repeat(101), email: "a@b.com" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("get with invalid nanoid → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;

      const exit = yield* svc
        .getByPublicId({ publicId: "bad" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("update with empty name → ValidationError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayerService;

      const created = yield* svc.create(validCreatePlayer());

      const exit = yield* svc
        .update({ publicId: created.publicId, name: "" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );
});
