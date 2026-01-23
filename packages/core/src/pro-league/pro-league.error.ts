import { Schema } from "effect";

// =============================================================================
// PRO LEAGUE DOMAIN ERRORS
// =============================================================================

export class ProLeagueNotFoundError extends Schema.TaggedError<ProLeagueNotFoundError>()(
  "ProLeagueNotFoundError",
  {
    message: Schema.String,
    code: Schema.optional(Schema.String),
    id: Schema.optional(Schema.Number),
  },
) {}

export class ProSeasonNotFoundError extends Schema.TaggedError<ProSeasonNotFoundError>()(
  "ProSeasonNotFoundError",
  {
    message: Schema.String,
    leagueId: Schema.optional(Schema.Number),
    externalId: Schema.optional(Schema.String),
    year: Schema.optional(Schema.Number),
  },
) {}

export class ProTeamNotFoundError extends Schema.TaggedError<ProTeamNotFoundError>()(
  "ProTeamNotFoundError",
  {
    message: Schema.String,
    leagueId: Schema.optional(Schema.Number),
    externalId: Schema.optional(Schema.String),
  },
) {}

export class ProPlayerNotFoundError extends Schema.TaggedError<ProPlayerNotFoundError>()(
  "ProPlayerNotFoundError",
  {
    message: Schema.String,
    leagueId: Schema.optional(Schema.Number),
    externalId: Schema.optional(Schema.String),
  },
) {}

export class ProGameNotFoundError extends Schema.TaggedError<ProGameNotFoundError>()(
  "ProGameNotFoundError",
  {
    message: Schema.String,
    seasonId: Schema.optional(Schema.Number),
    externalId: Schema.optional(Schema.String),
  },
) {}

export class ProIngestionError extends Schema.TaggedError<ProIngestionError>()(
  "ProIngestionError",
  {
    message: Schema.String,
    leagueCode: Schema.optional(Schema.String),
    entityType: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class ProUpsertError extends Schema.TaggedError<ProUpsertError>()(
  "ProUpsertError",
  {
    message: Schema.String,
    entity: Schema.String,
    externalId: Schema.optional(Schema.String),
    cause: Schema.optional(Schema.Unknown),
  },
) {}
