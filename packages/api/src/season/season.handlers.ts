import { HttpApiBuilder } from "@effect/platform";
import { SeasonService } from "@laxdb/core/season/season.service";
import { Effect, Layer } from "effect";
import { LaxdbApi } from "../definition";

// Handler implementation using LaxdbApi
export const SeasonsGroupLive = HttpApiBuilder.group(
  LaxdbApi,
  "Seasons",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* SeasonService;

      return handlers
        .handle("listSeasons", ({ payload }) => service.list(payload))
        .handle("getSeason", ({ payload }) => service.get(payload))
        .handle("createSeason", ({ payload }) => service.create(payload))
        .handle("updateSeason", ({ payload }) => service.update(payload))
        .handle("deleteSeason", ({ payload }) => service.delete(payload));
    }),
).pipe(Layer.provide(SeasonService.Default));

// Legacy alias for backward compatibility
export const SeasonsApiLive = SeasonsGroupLive;
