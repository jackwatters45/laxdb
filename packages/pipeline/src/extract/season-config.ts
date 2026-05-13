/**
 * Season Configuration Service
 *
 * Provides helpers for determining current vs historical seasons
 * and staleness thresholds for incremental scraping.
 */

import { Effect, Layer, ServiceMap } from "effect";

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

const isTimestampStale = (
  timestamp: string | null | undefined,
  maxAgeHours: number | null,
): boolean => {
  if (!timestamp) return true;
  if (maxAgeHours === null) return false;

  const ageMs = Date.now() - new Date(timestamp).getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
};

// ============================================================================
// Season Config Service
// ============================================================================

export class SeasonConfigService extends ServiceMap.Service<SeasonConfigService>()(
  "SeasonConfigService",
  {
    make: Effect.gen(function* () {
      const currentYear = new Date().getFullYear();

      const config: SeasonConfig = {
        lookaheadYears: 1,
        currentSeasonMaxAgeHours: 24,
        historicalSeasonMaxAgeHours: null,
      };

      const isCurrentSeason = (seasonId: number): boolean => {
        if (seasonId >= 2000 && seasonId <= 2100) {
          return (
            seasonId >= currentYear &&
            seasonId <= currentYear + config.lookaheadYears
          );
        }
        return true;
      };

      const getCurrentSeasonYears = (): number[] => {
        const years: number[] = [];
        for (let i = 0; i <= config.lookaheadYears; i++) {
          years.push(currentYear + i);
        }
        return years;
      };

      const getMaxAgeHours = (seasonId: number): number | null => {
        if (isCurrentSeason(seasonId)) {
          return config.currentSeasonMaxAgeHours;
        }
        return config.historicalSeasonMaxAgeHours;
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
) {
  static readonly layer = Layer.effect(this, this.make);
}
