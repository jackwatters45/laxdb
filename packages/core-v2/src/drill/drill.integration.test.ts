import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { validCreateDrill } from "../test/fixtures";

import { DrillRepo } from "./drill.repo";
import { DrillService } from "./drill.service";

const ServiceLayer = Layer.effect(DrillService, DrillService.make).pipe(
  Layer.provide(Layer.effect(DrillRepo, DrillRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

layer(TestLayer)("DrillService integration", (it) => {
  it.effect("creates a drill with defaults", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const drill = yield* svc.create(validCreateDrill());

      expect(drill.publicId).toHaveLength(12);
      expect(drill.name).toBe("Test Drill");
      expect(drill.difficulty).toBe("intermediate");
      expect(drill.category).toEqual([]);
      expect(drill.tags).toEqual([]);
      expect(drill.createdAt).toBeInstanceOf(Date);
    }),
  );

  it.effect("creates a drill with all fields", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const drill = yield* svc.create(
        validCreateDrill({
          name: "Full Drill",
          subtitle: "A subtitle",
          description: "A description",
          difficulty: "advanced",
          category: ["shooting", "passing"],
          positionGroup: ["attack", "midfield"],
          intensity: "high",
          contact: true,
          competitive: false,
          playerCount: 10,
          durationMinutes: 15,
          fieldSpace: "half-field",
          equipment: ["balls", "cones"],
          tags: ["team", "speed"],
        }),
      );

      expect(drill.difficulty).toBe("advanced");
      expect(drill.category).toEqual(["shooting", "passing"]);
      expect(drill.positionGroup).toEqual(["attack", "midfield"]);
      expect(drill.intensity).toBe("high");
      expect(drill.contact).toBe(true);
      expect(drill.competitive).toBe(false);
      expect(drill.playerCount).toBe(10);
      expect(drill.durationMinutes).toBe(15);
      expect(drill.fieldSpace).toBe("half-field");
      expect(drill.equipment).toEqual(["balls", "cones"]);
      expect(drill.tags).toEqual(["team", "speed"]);
    }),
  );

  it.effect("lists all drills", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      yield* svc.create(validCreateDrill({ name: "Drill A" }));
      yield* svc.create(validCreateDrill({ name: "Drill B" }));

      const drills = yield* svc.list();
      expect(drills).toHaveLength(2);
    }),
  );

  it.effect("gets a drill by publicId", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(validCreateDrill());
      const found = yield* svc.get({ publicId: created.publicId });

      expect(found.publicId).toBe(created.publicId);
      expect(found.name).toBe(created.name);
    }),
  );

  it.effect("get nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const exit = yield* svc
        .get({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("updates a drill partially", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(
        validCreateDrill({ name: "Original", difficulty: "beginner" }),
      );
      const updated = yield* svc.update({
        publicId: created.publicId,
        name: "Updated",
        difficulty: "advanced",
      });

      expect(updated.name).toBe("Updated");
      expect(updated.difficulty).toBe("advanced");
      // Untouched fields preserved
      expect(updated.subtitle).toBeNull();
    }),
  );

  it.effect("updates array fields", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(validCreateDrill());
      const updated = yield* svc.update({
        publicId: created.publicId,
        category: ["defense", "ground-balls"],
        tags: ["new-tag"],
      });

      expect(updated.category).toEqual(["defense", "ground-balls"]);
      expect(updated.tags).toEqual(["new-tag"]);
    }),
  );

  it.effect("updates array fields to empty arrays", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(
        validCreateDrill({
          category: ["shooting"],
          tags: ["existing"],
        }),
      );
      const updated = yield* svc.update({
        publicId: created.publicId,
        category: [],
        tags: [],
      });

      expect(updated.category).toEqual([]);
      expect(updated.tags).toEqual([]);
    }),
  );

  it.effect("update nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const exit = yield* svc
        .update({ publicId: "AbCdEfGhIjKl", name: "X" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("deletes a drill", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(validCreateDrill());
      const deleted = yield* svc.delete({ publicId: created.publicId });

      expect(deleted.publicId).toBe(created.publicId);

      const list = yield* svc.list();
      expect(list).toHaveLength(0);
    }),
  );

  it.effect("delete nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

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
      const svc = yield* DrillService;

      const exit = yield* svc
        .create(validCreateDrill({ name: "" }))
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("get with invalid nanoid → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* DrillService;

      const exit = yield* svc.get({ publicId: "bad" }).pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with invalid difficulty → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* DrillService;

      const exit = yield* svc
        .create(
          // @ts-expect-error -- intentionally invalid enum
          validCreateDrill({ difficulty: "impossible" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with invalid intensity → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* DrillService;

      const exit = yield* svc
        .create(
          // @ts-expect-error -- intentionally invalid enum
          validCreateDrill({ intensity: "extreme" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with invalid category → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* DrillService;

      const exit = yield* svc
        .create(
          // @ts-expect-error -- intentionally invalid enum
          validCreateDrill({ category: ["invalid-category"] }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with invalid fieldSpace → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* DrillService;

      const exit = yield* svc
        .create(
          // @ts-expect-error -- intentionally invalid enum
          validCreateDrill({ fieldSpace: "parking-lot" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("update with invalid difficulty → ValidationError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* DrillService;

      const created = yield* svc.create(validCreateDrill());

      const exit = yield* svc
        .update({
          publicId: created.publicId,
          // @ts-expect-error -- intentionally invalid enum
          difficulty: "impossible",
        })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );
});
