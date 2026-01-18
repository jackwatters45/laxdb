import { Schema } from "effect";

// MSL (Major Series Lacrosse) data sources:
// - Gamesheet: 2023-present (season IDs: 3246, 6007, 9567)
// - Pointstreak: 2009-2018 (league ID: 832)
// Season ID is a positive integer unique to each Gamesheet season

export const MSLSeasonId = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("MSLSeasonId"),
  Schema.annotations({
    description: "MSL Gamesheet season ID (e.g., 9567 for 2025)",
  }),
);
export type MSLSeasonId = typeof MSLSeasonId.Type;

// Year to Gamesheet Season ID mapping
export const MSL_GAMESHEET_SEASONS: Record<number, number> = {
  2025: 9567,
  2024: 6007,
  2023: 3246,
};

// Pointstreak league ID for historical data (2009-2018)
export const MSL_POINTSTREAK_LEAGUE_ID = 832;

// Years available on each platform
export const MSL_GAMESHEET_YEARS = [2023, 2024, 2025] as const;
export const MSL_POINTSTREAK_YEARS = [
  2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018,
] as const;

// Helper to get Gamesheet season ID from year
export function getMSLSeasonId(year: number): number | undefined {
  return MSL_GAMESHEET_SEASONS[year];
}

// Helper to check if year has Gamesheet data
export function hasMSLGamesheetData(year: number): boolean {
  return year in MSL_GAMESHEET_SEASONS;
}

// Helper to check if year has Pointstreak data
export function hasMSLPointstreakData(year: number): boolean {
  return MSL_POINTSTREAK_YEARS.includes(
    year as (typeof MSL_POINTSTREAK_YEARS)[number],
  );
}

// MSL Team response schema
export class MSLTeam extends Schema.Class<MSLTeam>("MSLTeam")({
  id: Schema.String,
  name: Schema.String,
  city: Schema.NullOr(Schema.String),
  abbreviation: Schema.NullOr(Schema.String),
  logo_url: Schema.NullOr(Schema.String),
  website_url: Schema.NullOr(Schema.String),
}) {}
