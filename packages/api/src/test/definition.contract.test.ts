import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";

const getApiEndpointNames = Effect.gen(function* () {
  const fs = yield* FileSystem;
  const path = yield* Path;
  const apiSrcRoot = path.join(import.meta.dirname, "..");
  const files = yield* fs.readDirectory(apiSrcRoot, { recursive: true });
  const apiFiles = files.filter((file) => file.endsWith(".api.ts"));
  const contents = yield* Effect.all(
    apiFiles.map((file) => fs.readFileString(path.join(apiSrcRoot, file))),
  );
  const names = new Set<string>();

  for (const content of contents) {
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
    }).pipe(Effect.provide(Layer.merge(NodeFileSystem.layer, NodePath.layer))),
  );
});
