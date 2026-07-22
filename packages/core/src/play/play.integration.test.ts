import { expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { validCreatePlay, validPlayDiagram } from "../test/fixtures";

import { PlayRepo } from "./play.repo";
import { PlayService } from "./play.service";

const ServiceLayer = Layer.effect(PlayService, PlayService.make).pipe(
  Layer.provide(Layer.effect(PlayRepo, PlayRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

layer(TestLayer)("PlayService integration", (it) => {
  it.effect("creates a play with defaults", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const play = yield* svc.create(validCreatePlay());

      expect(play.publicId).toHaveLength(12);
      expect(play.name).toBe("Test Play");
      expect(play.category).toBe("offense");
      expect(play.formation).toBeNull();
      expect(play.description).toBeNull();
      expect(play.personnelNotes).toBeNull();
      expect(play.tags).toEqual([]);
      expect(play.diagram).toBeNull();
      expect(play.diagramUrl).toBeNull();
      expect(play.videoUrl).toBeNull();
      expect(play.createdAt).toBeInstanceOf(Date);
    }),
  );

  it.effect("creates a play with all fields", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const play = yield* svc.create(
        validCreatePlay({
          name: "Invert 2-3-1",
          category: "emo",
          formation: "2-3-1",
          description: "Dodge from X and skip through the backside.",
          personnelNotes: "Lefty shooter at wing.",
          tags: ["extra-man", "late-clock"],
          diagram: validPlayDiagram(),
          diagramUrl: "https://example.com/diagram.png",
          videoUrl: "https://example.com/video.mp4",
        }),
      );

      expect(play.name).toBe("Invert 2-3-1");
      expect(play.category).toBe("emo");
      expect(play.formation).toBe("2-3-1");
      expect(play.description).toContain("Dodge from X");
      expect(play.personnelNotes).toBe("Lefty shooter at wing.");
      expect(play.tags).toEqual(["extra-man", "late-clock"]);
      expect(play.diagram).toEqual(validPlayDiagram());
      expect(play.diagramUrl).toBe("https://example.com/diagram.png");
      expect(play.videoUrl).toBe("https://example.com/video.mp4");
    }),
  );

  it.effect("lists all plays", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      yield* svc.create(validCreatePlay({ name: "Play A" }));
      yield* svc.create(validCreatePlay({ name: "Play B", category: "ride" }));

      const plays = yield* svc.list();

      expect(plays).toHaveLength(2);
      expect(plays.map((play) => play.name)).toEqual(["Play A", "Play B"]);
      expect(plays.every((play) => !("diagram" in play))).toBe(true);
    }),
  );

  it.effect("gets a play by publicId", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const created = yield* svc.create(validCreatePlay());
      const found = yield* svc.get({ publicId: created.publicId });

      expect(found.publicId).toBe(created.publicId);
      expect(found.name).toBe(created.name);
    }),
  );

  it.effect("get nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const exit = yield* svc
        .get({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(exit.cause.toString()).toContain("NotFoundError");
      }
    }),
  );

  it.effect("updates a play partially", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const created = yield* svc.create(
        validCreatePlay({
          name: "Original",
          category: "clear",
          formation: "1-4-1",
          tags: ["settled"],
        }),
      );
      const updated = yield* svc.update({
        publicId: created.publicId,
        name: "Updated",
        category: "transition",
        tags: ["fast-break"],
        diagram: validPlayDiagram(),
      });

      expect(updated.name).toBe("Updated");
      expect(updated.category).toBe("transition");
      expect(updated.formation).toBe("1-4-1");
      expect(updated.tags).toEqual(["fast-break"]);
      expect(updated.diagram).toEqual(validPlayDiagram());
    }),
  );

  it.effect("update nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const exit = yield* svc
        .update({ publicId: "AbCdEfGhIjKl", name: "Missing" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("deletes a play", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const created = yield* svc.create(validCreatePlay());
      const deleted = yield* svc.delete({ publicId: created.publicId });
      const afterDelete = yield* svc
        .get({ publicId: created.publicId })
        .pipe(Effect.exit);

      expect(deleted.publicId).toBe(created.publicId);
      expect(afterDelete._tag).toBe("Failure");
    }),
  );

  it.effect("delete nonexistent → NotFoundError", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const exit = yield* svc
        .delete({ publicId: "AbCdEfGhIjKl" })
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("rejects invalid cross-field diagram references and ids", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;
      const base = validPlayDiagram();
      const frame = base.frames[0];
      const actor = base.actors[0];
      const action = frame?.actions[0];
      const actorState = frame?.actorStates[0];

      expect(frame).toBeDefined();
      expect(actor).toBeDefined();
      expect(action).toBeDefined();
      expect(actorState).toBeDefined();
      if (
        frame === undefined ||
        actor === undefined ||
        action === undefined ||
        actorState === undefined
      ) {
        return;
      }

      const cases = [
        {
          name: "duplicate actor id",
          diagram: { ...base, actors: [...base.actors, { ...actor }] },
        },
        {
          name: "duplicate frame id",
          diagram: {
            ...base,
            frames: [
              ...base.frames,
              {
                ...frame,
                name: "Second set",
                actions: frame.actions.map((item) => ({
                  ...item,
                  id: `${item.id}-second`,
                })),
              },
            ],
          },
        },
        {
          name: "duplicate action id",
          diagram: {
            ...base,
            frames: base.frames.map((item) => ({
              ...item,
              actions: [...item.actions, { ...action }],
            })),
          },
        },
        {
          name: "duplicate actor state",
          diagram: {
            ...base,
            frames: base.frames.map((item) => ({
              ...item,
              actorStates: [...item.actorStates, { ...actorState }],
            })),
          },
        },
        {
          name: "dangling actor state reference",
          diagram: {
            ...base,
            frames: base.frames.map((item) => ({
              ...item,
              actorStates: item.actorStates.map((state, index) =>
                index === 0 ? { ...state, actorId: "missing-actor" } : state,
              ),
            })),
          },
        },
        {
          name: "dangling action actor reference",
          diagram: {
            ...base,
            frames: base.frames.map((item) => ({
              ...item,
              actions: item.actions.map((itemAction, index) =>
                index === 0
                  ? { ...itemAction, actorId: "missing-actor" }
                  : itemAction,
              ),
            })),
          },
        },
        {
          name: "dangling target actor reference",
          diagram: {
            ...base,
            frames: base.frames.map((item) => ({
              ...item,
              actions: item.actions.map((itemAction, index) =>
                index === 0
                  ? { ...itemAction, targetActorId: "missing-target" }
                  : itemAction,
              ),
            })),
          },
        },
      ];

      for (const testCase of cases) {
        const exit = yield* svc
          .create(validCreatePlay({ diagram: testCase.diagram }))
          .pipe(Effect.exit);
        expect(exit._tag, testCase.name).toBe("Failure");
      }
    }),
  );

  it.effect("rejects diagram coordinates outside the normalized field", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;
      const diagram = validPlayDiagram();
      const invalidDiagram = {
        ...diagram,
        frames: diagram.frames.map((frame, frameIndex) => ({
          ...frame,
          actorStates: frame.actorStates.map((state, stateIndex) =>
            frameIndex === 0 && stateIndex === 0
              ? { ...state, position: { x: 1.2, y: state.position.y } }
              : state,
          ),
        })),
      };

      const exit = yield* svc
        .create(validCreatePlay({ diagram: invalidDiagram }))
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );

  it.effect("rejects an empty name at the service interface", () =>
    Effect.gen(function* () {
      yield* truncateAll;
      const svc = yield* PlayService;

      const exit = yield* svc
        .create(validCreatePlay({ name: "" }))
        .pipe(Effect.exit);

      expect(exit._tag).toBe("Failure");
    }),
  );
});
