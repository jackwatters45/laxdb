/**
 * Incremental Extraction Service
 *
 * Centralizes the logic for determining whether an entity should be extracted.
 * Handles staleness checking, current vs historical season detection, and
 * extraction options.
 */

import { Effect, Layer, ServiceMap } from "effect";

import {
  type EntityStatusLike,
  type ExtractOptions,
  isEntityStale,
} from "./extract.schema";
import { SeasonConfigService } from "./season-config";

export type ExtractionMode =
  | "full" // Extract everything, ignoring existing data
  | "skip-existing" // Skip already extracted entities (default)
  | "incremental"; // Re-extract stale data based on age

export interface IncrementalExtractOptions extends ExtractOptions {
  /** Extraction mode. Overrides skipExisting/maxAgeHours if set. */
  mode?: ExtractionMode;
}

export class IncrementalExtractionService extends ServiceMap.Service<IncrementalExtractionService>()(
  "IncrementalExtractionService",
  {
    make: Effect.gen(function* () {
      const seasonConfig = yield* SeasonConfigService;

      const shouldExtract = (
        entityStatus: EntityStatusLike | undefined,
        seasonId: number,
        options: IncrementalExtractOptions = {},
      ): boolean => {
        const { mode, skipExisting = true, maxAgeHours } = options;

        if (mode === "full") {
          return true;
        }

        if (mode === "incremental") {
          const autoMaxAge = seasonConfig.getMaxAgeHours(seasonId);
          return isEntityStale(entityStatus, autoMaxAge);
        }

        if (mode === "skip-existing") {
          return !entityStatus?.extracted;
        }

        if (!skipExisting) {
          return true;
        }

        if (maxAgeHours !== undefined) {
          return isEntityStale(entityStatus, maxAgeHours);
        }

        return !entityStatus?.extracted;
      };

      const getSeasonMaxAge = (seasonId: number): number | null => {
        return seasonConfig.getMaxAgeHours(seasonId);
      };

      const isCurrentSeason = (seasonId: number): boolean => {
        return seasonConfig.isCurrentSeason(seasonId);
      };

      const getCurrentSeasons = (): number[] => {
        return seasonConfig.getCurrentSeasonYears();
      };

      const normalizeOptions = (options: {
        force?: boolean;
        incremental?: boolean;
        maxAgeHours?: number | null;
        skipExisting?: boolean;
      }): IncrementalExtractOptions => {
        if (options.force) {
          return { mode: "full" };
        }
        if (options.incremental) {
          return { mode: "incremental" };
        }
        if (options.maxAgeHours !== undefined && options.maxAgeHours !== null) {
          return { maxAgeHours: options.maxAgeHours, skipExisting: true };
        }
        return { skipExisting: options.skipExisting ?? true };
      };

      return {
        shouldExtract,
        getSeasonMaxAge,
        isCurrentSeason,
        getCurrentSeasons,
        normalizeOptions,
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(SeasonConfigService.layer),
  );
  static readonly Default = this.layer;
}
