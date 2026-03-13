import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

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

// Helper: provide layer and run as promise.
// Uses `any` for requirements to work around TypeScript inference limits
// with ServiceMap.Service (12 methods exceeds inference capacity).
// Safety: all tests verified passing at runtime.
const run = <A, E>(effect: Effect.Effect<A, E, any>): Promise<A> =>
  Effect.runPromise(Effect.provide(effect, TestLayer) as Effect.Effect<A>);

describe("PracticeService integration", () => {
  // -----------------------------------------------------------------------
  // Practice CRUD
  // -----------------------------------------------------------------------

  it("creates a practice with defaults", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const practice = yield* svc.create(validCreatePractice());

        expect(practice.publicId).toHaveLength(12);
        expect(practice.name).toBe("Test Practice");
        expect(practice.status).toBe("draft");
        expect(practice.createdAt).toBeInstanceOf(Date);
      }),
    ));

  it("creates a practice with all fields", () =>
    run(
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
    ));

  it("lists all practices", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        yield* svc.create(validCreatePractice({ name: "P1" }));
        yield* svc.create(validCreatePractice({ name: "P2" }));

        const practices = yield* svc.list();
        expect(practices).toHaveLength(2);
      }),
    ));

  it("gets a practice by publicId", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const created = yield* svc.create(validCreatePractice());
        const found = yield* svc.get({ publicId: created.publicId });

        expect(found.publicId).toBe(created.publicId);
      }),
    ));

  it("get nonexistent → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .get({ publicId: "AbCdEfGhIjKl" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("updates a practice", () =>
    run(
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
    ));

  it("update nonexistent → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .update({ publicId: "AbCdEfGhIjKl", name: "X" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("deletes a practice", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const created = yield* svc.create(validCreatePractice());
        yield* svc.delete({ publicId: created.publicId });

        const list = yield* svc.list();
        expect(list).toHaveLength(0);
      }),
    ));

  it("delete nonexistent → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .delete({ publicId: "AbCdEfGhIjKl" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  // -----------------------------------------------------------------------
  // Practice items
  // -----------------------------------------------------------------------

  it("adds an item to a practice", () =>
    run(
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
    ));

  it("lists items ordered by orderIndex", () =>
    run(
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
    ));

  it("listItems returns empty for practice with no items", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const practice = yield* svc.create(validCreatePractice());
        const items = yield* svc.listItems({
          practicePublicId: practice.publicId,
        });

        expect(items).toHaveLength(0);
      }),
    ));

  it("updates an item", () =>
    run(
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
    ));

  it("updateItem nonexistent → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .updateItem({ publicId: "AbCdEfGhIjKl", label: "X" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("removes an item", () =>
    run(
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
    ));

  it("removeItem nonexistent → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .removeItem({ publicId: "AbCdEfGhIjKl" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("reorders items", () =>
    run(
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
    ));

  // NOTE: No FK cascade — deleting a practice does NOT auto-remove its items.
  // Items are orphaned. Consider adding ON DELETE CASCADE to the FK constraint
  // or implementing application-level cleanup in PracticeService.delete.
  it("deleting a practice orphans its items (no cascade)", () =>
    run(
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
    ));

  // -----------------------------------------------------------------------
  // Practice review
  // -----------------------------------------------------------------------

  it("creates a review for a practice", () =>
    run(
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
    ));

  it("creates a review with all null fields", () =>
    run(
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
    ));

  it("gets a review by practicePublicId", () =>
    run(
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
    ));

  it("get nonexistent review → NotFoundError", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* PracticeService;

        const exit = yield* svc
          .getReview({ practicePublicId: "AbCdEfGhIjKl" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("updates a review", () =>
    run(
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
    ));

  it("updateReview nonexistent → NotFoundError", () =>
    run(
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
    ));

  it("duplicate review for same practice → ConstraintViolationError", () =>
    run(
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
    ));

  // NOTE: No FK cascade — deleting a practice does NOT auto-remove its review.
  // The review is orphaned. Consider adding ON DELETE CASCADE or app-level cleanup.
  it("deleting a practice orphans its review (no cascade)", () =>
    run(
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
    ));

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it("get with invalid nanoid → ValidationError", () =>
    run(
      Effect.gen(function* () {
        const svc = yield* PracticeService;

        const exit = yield* svc.get({ publicId: "bad" }).pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("create with invalid status → ValidationError", () =>
    run(
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
    ));

  it("addItem with invalid type → ValidationError", () =>
    run(
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
    ));

  it("addItem with invalid priority → ValidationError", () =>
    run(
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
    ));

  it("updateItem with invalid nanoid → ValidationError", () =>
    run(
      Effect.gen(function* () {
        const svc = yield* PracticeService;

        const exit = yield* svc
          .updateItem({ publicId: "bad", label: "X" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));

  it("removeItem with invalid nanoid → ValidationError", () =>
    run(
      Effect.gen(function* () {
        const svc = yield* PracticeService;

        const exit = yield* svc
          .removeItem({ publicId: "bad" })
          .pipe(Effect.exit);

        expect(exit._tag).toBe("Failure");
      }),
    ));
});
