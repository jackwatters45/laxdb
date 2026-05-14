import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

const apiSourceFiles = import.meta.glob<string>("../**/*.api.ts", {
  eager: true,
  query: "?raw",
  import: "default",
});

const getApiEndpointNames = Effect.sync(() => {
  const names = new Set<string>();

  for (const content of Object.values(apiSourceFiles)) {
    for (const match of content.matchAll(
      /HttpApiEndpoint\.\w+\(\s*"([^"]+)"/g,
    )) {
      const endpointName = match[1];
      if (endpointName !== undefined) {
        names.add(endpointName);
      }
    }
  }

  return [...names].toSorted((a, b) => a.localeCompare(b));
});

describe("API definition contract", () => {
  it.effect("keeps the generated HTTP API surface stable", () =>
    Effect.gen(function* () {
      const endpointNames = yield* getApiEndpointNames;

      expect(endpointNames).toEqual([
        "addPracticeItem",
        "createDrill",
        "createPlay",
        "createPlayer",
        "createPractice",
        "createPracticeReview",
        "deleteDrill",
        "deletePlay",
        "deletePlayer",
        "deletePractice",
        "getDrill",
        "getNamespace",
        "getPlay",
        "getPlayer",
        "getPractice",
        "getPracticeReview",
        "listDrills",
        "listPlayers",
        "listPlays",
        "listPracticeEdges",
        "listPracticeItems",
        "listPractices",
        "patchNamespace",
        "removePracticeItem",
        "reorderPracticeItems",
        "replacePracticeEdges",
        "updateDrill",
        "updatePlay",
        "updatePlayer",
        "updatePractice",
        "updatePracticeItem",
        "updatePracticeReview",
      ]);
    }),
  );
});
