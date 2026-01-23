import { Schema } from "effect";

import { NanoidSchema, SerialSchema } from "../schema";

// =============================================================================
// LEAGUE CODE
// =============================================================================

export const LeagueCode = Schema.Literal("pll", "nll", "mll", "msl", "wla");
export type LeagueCode = typeof LeagueCode.Type;

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const ProLeagueIdSchema = {
  leagueId: SerialSchema,
};

export const ProSeasonIdSchema = {
  seasonId: SerialSchema,
};

export const ProTeamIdSchema = {
  teamId: SerialSchema,
};

export const ProPlayerIdSchema = {
  playerId: SerialSchema,
};

export const ExternalIdSchema = {
  externalId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "External ID is required" }),
  ),
};

// =============================================================================
// LEAGUE SCHEMAS
// =============================================================================

export class CreateLeagueInput extends Schema.Class<CreateLeagueInput>(
  "CreateLeagueInput",
)({
  code: LeagueCode,
  name: Schema.String,
  shortName: Schema.optional(Schema.String),
  country: Schema.optional(Schema.String),
  isActive: Schema.optionalWith(Schema.Boolean, { default: () => true }),
  foundedYear: Schema.optional(Schema.Number),
  defunctYear: Schema.optional(Schema.Number),
  websiteUrl: Schema.optional(Schema.String),
  logoUrl: Schema.optional(Schema.String),
}) {}

export class LeagueOutput extends Schema.Class<LeagueOutput>("LeagueOutput")({
  id: SerialSchema,
  publicId: NanoidSchema,
  code: LeagueCode,
  name: Schema.String,
  shortName: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  isActive: Schema.Boolean,
  foundedYear: Schema.NullOr(Schema.Number),
  defunctYear: Schema.NullOr(Schema.Number),
  websiteUrl: Schema.NullOr(Schema.String),
  logoUrl: Schema.NullOr(Schema.String),
}) {}

// =============================================================================
// SEASON SCHEMAS
// =============================================================================

export class CreateSeasonInput extends Schema.Class<CreateSeasonInput>(
  "CreateSeasonInput",
)({
  leagueId: SerialSchema,
  externalId: Schema.String,
  year: Schema.Number.pipe(Schema.int(), Schema.between(1900, 2100)),
  displayName: Schema.String,
  startDate: Schema.optional(Schema.DateFromSelf),
  endDate: Schema.optional(Schema.DateFromSelf),
  isCurrent: Schema.optionalWith(Schema.Boolean, { default: () => false }),
}) {}

export class UpsertSeasonInput extends Schema.Class<UpsertSeasonInput>(
  "UpsertSeasonInput",
)({
  leagueId: SerialSchema,
  externalId: Schema.String,
  year: Schema.Number,
  displayName: Schema.String,
  startDate: Schema.NullOr(Schema.DateFromSelf),
  endDate: Schema.NullOr(Schema.DateFromSelf),
  isCurrent: Schema.Boolean,
}) {}

export class SeasonOutput extends Schema.Class<SeasonOutput>("SeasonOutput")({
  id: SerialSchema,
  publicId: NanoidSchema,
  leagueId: SerialSchema,
  externalId: Schema.String,
  year: Schema.Number,
  displayName: Schema.String,
  startDate: Schema.NullOr(Schema.DateFromSelf),
  endDate: Schema.NullOr(Schema.DateFromSelf),
  isCurrent: Schema.Boolean,
}) {}

// =============================================================================
// TEAM SCHEMAS
// =============================================================================

export class UpsertTeamInput extends Schema.Class<UpsertTeamInput>(
  "UpsertTeamInput",
)({
  leagueId: SerialSchema,
  externalId: Schema.String,
  code: Schema.NullOr(Schema.String),
  name: Schema.String,
  shortName: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  logoUrl: Schema.NullOr(Schema.String),
  primaryColor: Schema.NullOr(Schema.String),
  secondaryColor: Schema.NullOr(Schema.String),
  websiteUrl: Schema.NullOr(Schema.String),
  isActive: Schema.Boolean,
  firstSeasonYear: Schema.NullOr(Schema.Number),
  lastSeasonYear: Schema.NullOr(Schema.Number),
}) {}

export class TeamOutput extends Schema.Class<TeamOutput>("TeamOutput")({
  id: SerialSchema,
  publicId: NanoidSchema,
  leagueId: SerialSchema,
  externalId: Schema.String,
  code: Schema.NullOr(Schema.String),
  name: Schema.String,
  shortName: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  logoUrl: Schema.NullOr(Schema.String),
  isActive: Schema.Boolean,
}) {}

// =============================================================================
// PLAYER SCHEMAS
// =============================================================================

export class UpsertPlayerInput extends Schema.Class<UpsertPlayerInput>(
  "UpsertPlayerInput",
)({
  leagueId: SerialSchema,
  externalId: Schema.String,
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.String,
  fullName: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.DateFromSelf),
  birthplace: Schema.NullOr(Schema.String),
  country: Schema.NullOr(Schema.String),
  height: Schema.NullOr(Schema.String),
  weight: Schema.NullOr(Schema.Number),
  handedness: Schema.NullOr(Schema.String),
  college: Schema.NullOr(Schema.String),
  highSchool: Schema.NullOr(Schema.String),
  profileUrl: Schema.NullOr(Schema.String),
  photoUrl: Schema.NullOr(Schema.String),
}) {}

export class PlayerOutput extends Schema.Class<PlayerOutput>("PlayerOutput")({
  id: SerialSchema,
  publicId: NanoidSchema,
  leagueId: SerialSchema,
  externalId: Schema.String,
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.String,
  fullName: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
}) {}

// =============================================================================
// PLAYER SEASON SCHEMAS
// =============================================================================

// Player season uses Record for stats JSONB (flexible structure)
const StatsRecord = Schema.NullOr(
  Schema.Record({ key: Schema.String, value: Schema.Unknown }),
);

export class UpsertPlayerSeasonInput extends Schema.Class<UpsertPlayerSeasonInput>(
  "UpsertPlayerSeasonInput",
)({
  playerId: SerialSchema,
  seasonId: SerialSchema,
  teamId: Schema.NullOr(SerialSchema),
  jerseyNumber: Schema.NullOr(Schema.Number),
  position: Schema.NullOr(Schema.String),
  isCaptain: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  stats: StatsRecord,
  postSeasonStats: StatsRecord,
  goalieStats: StatsRecord,
  postSeasonGoalieStats: StatsRecord,
  gamesPlayed: Schema.optionalWith(Schema.Number, { default: () => 0 }),
}) {}

// =============================================================================
// GAME SCHEMAS
// =============================================================================

export const GameStatus = Schema.Literal(
  "scheduled",
  "in_progress",
  "final",
  "postponed",
  "cancelled",
);
export type GameStatus = typeof GameStatus.Type;

export class UpsertGameInput extends Schema.Class<UpsertGameInput>(
  "UpsertGameInput",
)({
  seasonId: SerialSchema,
  externalId: Schema.NullOr(Schema.String),
  homeTeamId: SerialSchema,
  awayTeamId: SerialSchema,
  gameDate: Schema.DateFromSelf,
  week: Schema.NullOr(Schema.String),
  gameNumber: Schema.NullOr(Schema.Number),
  venue: Schema.NullOr(Schema.String),
  venueCity: Schema.NullOr(Schema.String),
  status: GameStatus,
  homeScore: Schema.NullOr(Schema.Number),
  awayScore: Schema.NullOr(Schema.Number),
  isOvertime: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  overtimePeriods: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  playByPlayUrl: Schema.NullOr(Schema.String),
  homeTeamStats: StatsRecord,
  awayTeamStats: StatsRecord,
  broadcaster: Schema.NullOr(Schema.String),
  streamUrl: Schema.NullOr(Schema.String),
}) {}

export class GameOutput extends Schema.Class<GameOutput>("GameOutput")({
  id: SerialSchema,
  publicId: NanoidSchema,
  seasonId: SerialSchema,
  externalId: Schema.NullOr(Schema.String),
  homeTeamId: SerialSchema,
  awayTeamId: SerialSchema,
  gameDate: Schema.DateFromSelf,
  status: GameStatus,
  homeScore: Schema.NullOr(Schema.Number),
  awayScore: Schema.NullOr(Schema.Number),
}) {}

// =============================================================================
// STANDINGS SCHEMAS
// =============================================================================

export class UpsertStandingsInput extends Schema.Class<UpsertStandingsInput>(
  "UpsertStandingsInput",
)({
  seasonId: SerialSchema,
  teamId: SerialSchema,
  snapshotDate: Schema.DateFromSelf,
  position: Schema.Number,
  wins: Schema.Number,
  losses: Schema.Number,
  ties: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  overtimeLosses: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  points: Schema.NullOr(Schema.Number),
  winPercentage: Schema.NullOr(Schema.Number),
  goalsFor: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  goalsAgainst: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  goalDifferential: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  conference: Schema.NullOr(Schema.String),
  division: Schema.NullOr(Schema.String),
  clinchStatus: Schema.NullOr(Schema.String),
  seed: Schema.NullOr(Schema.Number),
}) {}

// =============================================================================
// INGESTION SCHEMAS
// =============================================================================

export const IngestionStatus = Schema.Literal(
  "pending",
  "running",
  "completed",
  "failed",
);
export type IngestionStatus = typeof IngestionStatus.Type;

export const EntityType = Schema.Literal(
  "teams",
  "players",
  "games",
  "standings",
  "play_by_play",
  "full_season",
);
export type EntityType = typeof EntityType.Type;

export const SourceType = Schema.Literal("api", "scrape", "wayback");
export type SourceType = typeof SourceType.Type;

export class CreateIngestionInput extends Schema.Class<CreateIngestionInput>(
  "CreateIngestionInput",
)({
  leagueId: SerialSchema,
  seasonId: Schema.NullOr(SerialSchema),
  entityType: EntityType,
  sourceUrl: Schema.NullOr(Schema.String),
  sourceType: Schema.NullOr(SourceType),
}) {}

export class UpdateIngestionInput extends Schema.Class<UpdateIngestionInput>(
  "UpdateIngestionInput",
)({
  id: SerialSchema,
  status: IngestionStatus,
  startedAt: Schema.NullOr(Schema.DateFromSelf),
  completedAt: Schema.NullOr(Schema.DateFromSelf),
  recordsProcessed: Schema.optional(Schema.Number),
  recordsCreated: Schema.optional(Schema.Number),
  recordsUpdated: Schema.optional(Schema.Number),
  recordsSkipped: Schema.optional(Schema.Number),
  durationMs: Schema.NullOr(Schema.Number),
  errorMessage: Schema.NullOr(Schema.String),
  errorStack: Schema.NullOr(Schema.String),
  rawDataUrl: Schema.NullOr(Schema.String),
  manifestVersion: Schema.NullOr(Schema.Number),
}) {}

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export class GetByLeagueInput extends Schema.Class<GetByLeagueInput>(
  "GetByLeagueInput",
)({
  leagueCode: LeagueCode,
}) {}

export class GetBySeasonInput extends Schema.Class<GetBySeasonInput>(
  "GetBySeasonInput",
)({
  seasonId: SerialSchema,
}) {}

export class GetByLeagueAndYearInput extends Schema.Class<GetByLeagueAndYearInput>(
  "GetByLeagueAndYearInput",
)({
  leagueCode: LeagueCode,
  year: Schema.Number,
}) {}

export class GetStandingsInput extends Schema.Class<GetStandingsInput>(
  "GetStandingsInput",
)({
  seasonId: SerialSchema,
  snapshotDate: Schema.optional(Schema.DateFromSelf),
}) {}
