/**
 * Incremental Extraction Service
 *
 * Centralizes the logic for determining whether an entity should be extracted.
 * Handles staleness checking, current vs historical season detection, and
 * extraction options.
 */

import { Effect } from "effect";

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

export class IncrementalExtractionService extends Effect.Service<IncrementalExtractionService>()(
  "IncrementalExtractionService",
  {
    effect: Effect.gen(function* () {
      const seasonConfig = yield* SeasonConfigService;

      /**
       * Determine if an entity should be extracted based on options and current state.
       *
       * Logic:
       * 1. mode="full" or skipExisting=false → always extract
       * 2. mode="incremental" → use season-aware staleness (24h for current, never for historical)
       * 3. mode="skip-existing" → only extract if not yet extracted
       * 4. Explicit maxAgeHours → override automatic staleness detection
       */
      const shouldExtract = (
        entityStatus: EntityStatusLike | undefined,
        seasonId: number,
        options: IncrementalExtractOptions = {},
      ): boolean => {
        const { mode, skipExisting = true, maxAgeHours } = options;

        // Mode takes precedence
        if (mode === "full") {
          return true;
        }

        if (mode === "incremental") {
          // Use season-aware staleness: 24h for current seasons, never for historical
          const autoMaxAge = seasonConfig.getMaxAgeHours(seasonId);
          return isEntityStale(entityStatus, autoMaxAge);
        }

        if (mode === "skip-existing") {
          return !entityStatus?.extracted;
        }

        // No mode specified - use legacy options
        if (!skipExisting) {
          return true;
        }

        // Explicit maxAgeHours provided
        if (maxAgeHours !== undefined) {
          return isEntityStale(entityStatus, maxAgeHours);
        }

        // Default: skip if already extracted
        return !entityStatus?.extracted;
      };

      /**
       * Get the appropriate max age for a season based on whether it's current or historical.
       */
      const getSeasonMaxAge = (seasonId: number): number | null => {
        return seasonConfig.getMaxAgeHours(seasonId);
      };

      /**
       * Check if a season is considered "current" (actively updating).
       */
      const isCurrentSeason = (seasonId: number): boolean => {
        return seasonConfig.isCurrentSeason(seasonId);
      };

      /**
       * Get the list of current season years (for year-based extractors).
       */
      const getCurrentSeasons = (): number[] => {
        return seasonConfig.getCurrentSeasonYears();
      };

      /**
       * Convert legacy ExtractOptions to IncrementalExtractOptions.
       * Handles the --force and --incremental CLI flag patterns.
       */
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
    dependencies: [SeasonConfigService.Default],
  },
) {}
