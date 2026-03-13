import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import {
  validAddItem,
  validCreatePractice,
  validCreateReview,
} from "../test/fixtures";

import { PracticeRepo } from "./practice.repo";
import { PracticeService } from "./practice.service";

const ServiceLayer = Layer.effect(PracticeService, PracticeService.make).pipe(
  Layer.provide(Layer.effect(PracticeRepo, PracticeRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

layer(TestLayer)("PracticeService integration", (it) => {
  // -----------------------------------------------------------------------
  // Practice CRUD
  // -----------------------------------------------------------------------

  it.effect("creates a practice with defaults", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());

      expect(practice.publicId).toHaveLength(12);
      expect(practice.name).toBe("Test Practice");
      expect(practice.status).toBe("draft");
      expect(practice.createdAt).toBeInstanceOf(Date);
    }),
  );

  it.effect("creates a practice with all fields", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(
        validCreatePractice({
          name: "Full Practice",
          description: "Desc",
          notes: "Notes",
          durationMinutes: 90,
          location: "Field A",
          status: "scheduled",
        }),
      );

      expect(practice.name).toBe("Full Practice");
      expect(practice.description).toBe("Desc");
      expect(practice.durationMinutes).toBe(90);
      expect(practice.location).toBe("Field A");
      expect(practice.status).toBe("scheduled");
    }),
  );

  it.effect("lists all practices", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      yield* svc.create(validCreatePractice({ name: "P1" }));
      yield* svc.create(validCreatePractice({ name: "P2" }));

      const practices = yield* svc.list();
      expect(practices).toHaveLength(2);
    }),
  );

  it.effect("gets a practice by publicId", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const created = yield* svc.create(validCreatePractice());
      const found = yield* svc.get({ publicId: created.publicId });

      expect(found.publicId).toBe(created.publicId);
    }),
  );

  it.effect("get nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .get({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("updates a practice", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const created = yield* svc.create(validCreatePractice());
      const updated = yield* svc.update({
        publicId: created.publicId,
        name: "Updated",
        status: "completed",
      });

      expect(updated.name).toBe("Updated");
      expect(updated.status).toBe("completed");
    }),
  );

  it.effect("update nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .update({ publicId: "AbCdEfGhIjKl", name: "X" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("deletes a practice", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const created = yield* svc.create(validCreatePractice());
      yield* svc.delete({ publicId: created.publicId });

      const list = yield* svc.list();
      expect(list).toHaveLength(0);
    }),
  );

  it.effect("delete nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .delete({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  // -----------------------------------------------------------------------
  // Practice items
  // -----------------------------------------------------------------------

  it.effect("adds an item to a practice", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const item = yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "warmup",
          label: "Jogging",
          durationMinutes: 5,
        }),
      );

      expect(item.publicId).toHaveLength(12);
      expect(item.practicePublicId).toBe(practice.publicId);
      expect(item.type).toBe("warmup");
      expect(item.label).toBe("Jogging");
      expect(item.durationMinutes).toBe(5);
      expect(item.priority).toBe("required");
      expect(item.groups).toEqual(["all"]);
    }),
  );

  it.effect("lists items ordered by orderIndex", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "cooldown",
          orderIndex: 2,
        }),
      );
      yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "warmup",
          orderIndex: 0,
        }),
      );
      yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "drill",
          orderIndex: 1,
        }),
      );

      const items = yield* svc.listItems({
        practicePublicId: practice.publicId,
      });

      expect(items).toHaveLength(3);
      expect(items[0]?.type).toBe("warmup");
      expect(items[1]?.type).toBe("drill");
      expect(items[2]?.type).toBe("cooldown");
    }),
  );

  it.effect("listItems returns empty for practice with no items", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const items = yield* svc.listItems({
        practicePublicId: practice.publicId,
      });

      expect(items).toHaveLength(0);
    }),
  );

  it.effect("updates an item", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const item = yield* svc.addItem(
        validAddItem(practice.publicId, { label: "Original" }),
      );
      const updated = yield* svc.updateItem({
        publicId: item.publicId,
        label: "Updated",
        priority: "optional",
      });

      expect(updated.label).toBe("Updated");
      expect(updated.priority).toBe("optional");
      expect(updated.type).toBe(item.type); // unchanged
    }),
  );

  it.effect("updateItem nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .updateItem({ publicId: "AbCdEfGhIjKl", label: "X" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("removes an item", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const item = yield* svc.addItem(validAddItem(practice.publicId));
      yield* svc.removeItem({ publicId: item.publicId });

      const items = yield* svc.listItems({
        practicePublicId: practice.publicId,
      });
      expect(items).toHaveLength(0);
    }),
  );

  it.effect("removeItem nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .removeItem({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("reorders items", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const item1 = yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "warmup",
          orderIndex: 0,
        }),
      );
      const item2 = yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "drill",
          orderIndex: 1,
        }),
      );
      const item3 = yield* svc.addItem(
        validAddItem(practice.publicId, {
          type: "cooldown",
          orderIndex: 2,
        }),
      );

      // Reverse the order
      const reordered = yield* svc.reorderItems({
        practicePublicId: practice.publicId,
        orderedIds: [item3.publicId, item2.publicId, item1.publicId],
      });

      expect(reordered[0]?.publicId).toBe(item3.publicId);
      expect(reordered[1]?.publicId).toBe(item2.publicId);
      expect(reordered[2]?.publicId).toBe(item1.publicId);
    }),
  );

  // NOTE: No FK cascade — deleting a practice does NOT auto-remove its items.
  // Items are orphaned. Consider adding ON DELETE CASCADE to the FK constraint
  // or implementing application-level cleanup in PracticeService.delete.
  it.effect("deleting a practice orphans its items (no cascade)", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      yield* svc.addItem(validAddItem(practice.publicId));
      yield* svc.addItem(validAddItem(practice.publicId));
      yield* svc.delete({ publicId: practice.publicId });

      const items = yield* svc.listItems({
        practicePublicId: practice.publicId,
      });
      expect(items).toHaveLength(2);
    }),
  );

  // -----------------------------------------------------------------------
  // Practice review
  // -----------------------------------------------------------------------

  it.effect("creates a review for a practice", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const review = yield* svc.createReview(
        validCreateReview(practice.publicId, {
          wentWell: "Passing was sharp",
          needsImprovement: "Ground balls",
          notes: "Good energy",
        }),
      );

      expect(review.publicId).toHaveLength(12);
      expect(review.practicePublicId).toBe(practice.publicId);
      expect(review.wentWell).toBe("Passing was sharp");
      expect(review.needsImprovement).toBe("Ground balls");
      expect(review.notes).toBe("Good energy");
    }),
  );

  it.effect("creates a review with all null fields", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      const review = yield* svc.createReview(
        validCreateReview(practice.publicId),
      );

      expect(review.wentWell).toBeNull();
      expect(review.needsImprovement).toBeNull();
      expect(review.notes).toBeNull();
    }),
  );

  it.effect("gets a review by practicePublicId", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      yield* svc.createReview(validCreateReview(practice.publicId));
      const found = yield* svc.getReview({
        practicePublicId: practice.publicId,
      });

      expect(found.practicePublicId).toBe(practice.publicId);
    }),
  );

  it.effect("get nonexistent review → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .getReview({ practicePublicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("updates a review", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      yield* svc.createReview(validCreateReview(practice.publicId));
      const updated = yield* svc.updateReview({
        practicePublicId: practice.publicId,
        wentWell: "Everything",
      });

      expect(updated.wentWell).toBe("Everything");
    }),
  );

  it.effect("updateReview nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const exit = yield* svc
        .updateReview({
          practicePublicId: "AbCdEfGhIjKl",
          wentWell: "X",
        })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect(
    "duplicate review for same practice → ConstraintViolationError",
    () =>
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const practice = yield* svc.create(validCreatePractice());
        yield* svc.createReview(validCreateReview(practice.publicId));

        const exit = yield* svc
          .createReview(validCreateReview(practice.publicId))
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
  );

  // NOTE: No FK cascade — deleting a practice does NOT auto-remove its review.
  // The review is orphaned. Consider adding ON DELETE CASCADE or app-level cleanup.
  it.effect("deleting a practice orphans its review (no cascade)", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());
      yield* svc.createReview(
        validCreateReview(practice.publicId, { wentWell: "Great" }),
      );
      yield* svc.delete({ publicId: practice.publicId });

      // Review is still accessible — it was not cascaded
      const review = yield* svc.getReview({
        practicePublicId: practice.publicId,
      });
      expect(review.practicePublicId).toBe(practice.publicId);
    }),
  );

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it.effect("get with invalid nanoid → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;

      const exit = yield* svc.get({ publicId: "bad" }).pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("create with invalid status → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;

      const exit = yield* svc
        .create(
          // @ts-expect-error -- intentionally invalid enum
          validCreatePractice({ status: "invalid-status" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("addItem with invalid type → ValidationError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());

      const exit = yield* svc
        .addItem(
          // @ts-expect-error -- intentionally invalid enum
          validAddItem(practice.publicId, { type: "invalid-type" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("addItem with invalid priority → ValidationError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PracticeService;

      const practice = yield* svc.create(validCreatePractice());

      const exit = yield* svc
        .addItem(
          // @ts-expect-error -- intentionally invalid enum
          validAddItem(practice.publicId, { priority: "invalid" }),
        )
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("updateItem with invalid nanoid → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;

      const exit = yield* svc
        .updateItem({ publicId: "bad", label: "X" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("removeItem with invalid nanoid → ValidationError", () =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;

      const exit = yield* svc
        .removeItem({ publicId: "bad" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );
});
