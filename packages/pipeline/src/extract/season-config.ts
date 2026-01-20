/**
 * Season Configuration Service
 *
 * Provides helpers for determining current vs historical seasons
 * and staleness thresholds for incremental scraping.
 */

import { Effect } from "effect";

// ============================================================================
// Configuration Types
// ============================================================================

export interface SeasonConfig {
  /** How many years ahead to consider as "current" (default: 1) */
  lookaheadYears: number;
  /** Max age in hours before current season data is stale (default: 24) */
  currentSeasonMaxAgeHours: number;
  /** Max age in hours for historical seasons (default: never - null) */
  historicalSeasonMaxAgeHours: number | null;
}

// ============================================================================
// Season Config Service
// ============================================================================

export class SeasonConfigService extends Effect.Service<SeasonConfigService>()(
  "SeasonConfigService",
  {
    effect: Effect.gen(function* () {
      const currentYear = new Date().getFullYear();

      const config: SeasonConfig = {
        lookaheadYears: 1,
        currentSeasonMaxAgeHours: 24,
        historicalSeasonMaxAgeHours: null,
      };

      /**
       * Check if a season ID represents a "current" season.
       * Current seasons = current year + lookahead years.
       */
      const isCurrentSeason = (seasonId: number): boolean => {
        // For year-based season IDs (2019, 2020, etc.)
        if (seasonId >= 2000 && seasonId <= 2100) {
          return (
            seasonId >= currentYear &&
            seasonId <= currentYear + config.lookaheadYears
          );
        }
        // For non-year IDs (like NLL's 225), always treat as current
        // since we don't know the mapping
        return true;
      };

      /**
       * Get current season years for year-based extractors.
       */
      const getCurrentSeasonYears = (): number[] => {
        const years: number[] = [];
        for (let i = 0; i <= config.lookaheadYears; i++) {
          years.push(currentYear + i);
        }
        return years;
      };

      /**
       * Get max age in hours for a given season.
       * Returns null if staleness should never be checked (historical seasons).
       */
      const getMaxAgeHours = (seasonId: number): number | null => {
        if (isCurrentSeason(seasonId)) {
          return config.currentSeasonMaxAgeHours;
        }
        return config.historicalSeasonMaxAgeHours;
      };

      /**
       * Check if a timestamp is stale given a max age in hours.
       */
      const isTimestampStale = (
        timestamp: string | null | undefined,
        maxAgeHours: number | null,
      ): boolean => {
        // No timestamp = always stale
        if (!timestamp) return true;
        // No max age = never stale (historical)
        if (maxAgeHours === null) return false;

        const ageMs = Date.now() - new Date(timestamp).getTime();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        return ageMs > maxAgeMs;
      };

      return {
        config,
        currentYear,
        isCurrentSeason,
        getCurrentSeasonYears,
        getMaxAgeHours,
        isTimestampStale,
      };
    }),
  },
) {}
