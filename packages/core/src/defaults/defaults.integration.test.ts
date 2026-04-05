import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { TestDatabaseLive, truncateAll } from "../test/db";
import { makeTestRunner } from "../test/effect";

import { DefaultsRepo } from "./defaults.repo";
import { DefaultsService } from "./defaults.service";

const ServiceLayer = Layer.effect(DefaultsService, DefaultsService.make).pipe(
  Layer.provide(Layer.effect(DefaultsRepo, DefaultsRepo.make)),
  Layer.provide(TestDatabaseLive),
);
const TestLayer = Layer.mergeAll(ServiceLayer, TestDatabaseLive);

const run = makeTestRunner(TestLayer);

describe("DefaultsService integration", () => {
  it("returns an empty object when a namespace has not been set", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* DefaultsService;

        const values = yield* svc.getNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
        });

        expect(values).toEqual({});
      }),
    ));

  it("creates a namespace with json values", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* DefaultsService;

        const values = yield* svc.patchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            durationMinutes: 120,
            location: "Main Field",
          },
        });

        expect(values).toEqual({
          durationMinutes: 120,
          location: "Main Field",
        });
      }),
    ));

  it("merges partial updates into an existing namespace", () =>
    run(
      Effect.gen(function* () {
        yield* truncateAll;
        const svc = yield* DefaultsService;

        yield* svc.patchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            durationMinutes: 120,
            location: "Main Field",
          },
        });

        const values = yield* svc.patchNamespace({
          scopeType: "global",
          scopeId: "global",
          namespace: "practice",
          values: {
            location: "Indoor",
          },
        });

        expect(values).toEqual({
          durationMinutes: 120,
          location: "Indoor",
        });
      }),
    ));
});
