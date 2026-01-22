/**
 * League season configuration
 *
 * Defines when each league's season runs. Used by the cron worker to
 * determine which leagues to extract data from at any given time.
 */

export type LeagueAbbreviation = "PLL" | "NLL" | "MLL" | "MSL" | "WLA";

interface SeasonConfig {
  readonly start: { readonly month: number; readonly day: number };
  readonly end: { readonly month: number; readonly day: number };
  readonly historical?: boolean;
}

/**
 * Season dates for each league
 *
 * - PLL: June - September (outdoor summer league)
 * - NLL: December - May (indoor winter/spring league)
 * - MLL: May - August (defunct, historical only)
 * - MSL: May - September (outdoor summer league)
 * - WLA: May - September (outdoor summer league)
 */
export const LEAGUE_SEASONS: Record<LeagueAbbreviation, SeasonConfig> = {
  PLL: { start: { month: 6, day: 1 }, end: { month: 9, day: 15 } },
  NLL: { start: { month: 12, day: 1 }, end: { month: 5, day: 15 } },
  MLL: { start: { month: 5, day: 1 }, end: { month: 8, day: 30 }, historical: true },
  MSL: { start: { month: 5, day: 1 }, end: { month: 9, day: 30 } },
  WLA: { start: { month: 5, day: 1 }, end: { month: 9, day: 30 } },
};

/**
 * Check if a date falls within a league's season
 */
function isInSeason(date: Date, config: SeasonConfig): boolean {
  const month = date.getMonth() + 1; // getMonth is 0-indexed
  const day = date.getDate();

  // Handle seasons that span year boundary (like NLL: Dec-May)
  if (config.start.month > config.end.month) {
    // If current month is after start OR before end, it's in season
    if (month >= config.start.month) {
      return day >= config.start.day || month > config.start.month;
    }
    if (month <= config.end.month) {
      return day <= config.end.day || month < config.end.month;
    }
    return false;
  }

  // Normal season (start month < end month)
  if (month < config.start.month || month > config.end.month) {
    return false;
  }
  if (month === config.start.month && day < config.start.day) {
    return false;
  }
  if (month === config.end.month && day > config.end.day) {
    return false;
  }
  return true;
}

/**
 * Get list of leagues that are currently in-season
 *
 * @param date - The date to check (defaults to now)
 * @returns Array of league abbreviations that are currently active
 */
export function getActiveLeagues(date: Date = new Date()): LeagueAbbreviation[] {
  const active: LeagueAbbreviation[] = [];

  for (const [league, config] of Object.entries(LEAGUE_SEASONS) as Array<
    [LeagueAbbreviation, SeasonConfig]
  >) {
    // Skip historical leagues
    if (config.historical) {
      continue;
    }

    if (isInSeason(date, config)) {
      active.push(league);
    }
  }

  return active;
}

/**
 * Get all non-historical leagues
 */
export function getAllActiveLeagues(): LeagueAbbreviation[] {
  return (Object.entries(LEAGUE_SEASONS) as Array<[LeagueAbbreviation, SeasonConfig]>)
    .filter(([_, config]) => !config.historical)
    .map(([league]) => league);
}
