import { Schema } from "effect";

import { LeagueAbbreviation } from "./stats.schema";

// Source player details (from pipeline_source_player)
export class SourcePlayer extends Schema.Class<SourcePlayer>("SourcePlayer")({
  id: Schema.Number,
  leagueId: Schema.Number,
  leagueAbbreviation: Schema.String,
  sourceId: Schema.String,
  firstName: Schema.NullOr(Schema.String),
  lastName: Schema.NullOr(Schema.String),
  fullName: Schema.NullOr(Schema.String),
  normalizedName: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  jerseyNumber: Schema.NullOr(Schema.String),
  dob: Schema.NullOr(Schema.DateFromSelf),
  hometown: Schema.NullOr(Schema.String),
  college: Schema.NullOr(Schema.String),
  handedness: Schema.NullOr(Schema.String),
  heightInches: Schema.NullOr(Schema.Number),
  weightLbs: Schema.NullOr(Schema.Number),
}) {}

// Canonical player (golden record with linked sources)
export class CanonicalPlayer extends Schema.Class<CanonicalPlayer>(
  "CanonicalPlayer",
)({
  id: Schema.Number,
  displayName: Schema.String,
  position: Schema.NullOr(Schema.String),
  dob: Schema.NullOr(Schema.DateFromSelf),
  hometown: Schema.NullOr(Schema.String),
  college: Schema.NullOr(Schema.String),
  // Related source players
  sourceRecords: Schema.Array(SourcePlayer),
}) {}

// Search result entry
export class PlayerSearchResult extends Schema.Class<PlayerSearchResult>(
  "PlayerSearchResult",
)({
  playerId: Schema.Number,
  playerName: Schema.String,
  position: Schema.NullOr(Schema.String),
  leagueAbbreviation: Schema.String,
  teamName: Schema.NullOr(Schema.String),
}) {}

// Input schemas
export class GetPlayerInput extends Schema.Class<GetPlayerInput>(
  "GetPlayerInput",
)({
  playerId: Schema.Number,
}) {}

export class SearchPlayersInput extends Schema.Class<SearchPlayersInput>(
  "SearchPlayersInput",
)({
  query: Schema.String.pipe(Schema.minLength(2)),
  leagues: Schema.optional(Schema.Array(LeagueAbbreviation)),
  limit: Schema.optionalWith(
    Schema.Number.pipe(
      Schema.int(),
      Schema.greaterThan(0),
      Schema.lessThanOrEqualTo(50),
    ),
    { default: () => 20 },
  ),
}) {}
