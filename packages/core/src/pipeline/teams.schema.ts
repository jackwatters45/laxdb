import { Schema } from "effect";

import { LeagueAbbreviation } from "./stats.schema";

// Output types
export class TeamDetails extends Schema.Class<TeamDetails>("TeamDetails")({
  id: Schema.Number,
  name: Schema.String,
  abbreviation: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  leagueId: Schema.Number,
  leagueAbbreviation: Schema.String,
}) {}

export class TeamWithRoster extends Schema.Class<TeamWithRoster>(
  "TeamWithRoster",
)({
  id: Schema.Number,
  name: Schema.String,
  abbreviation: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  leagueId: Schema.Number,
  leagueAbbreviation: Schema.String,
  roster: Schema.Array(
    Schema.Struct({
      playerId: Schema.Number,
      playerName: Schema.String,
      position: Schema.NullOr(Schema.String),
      jerseyNumber: Schema.NullOr(Schema.String),
    }),
  ),
}) {}

// Input types
export class GetTeamInput extends Schema.Class<GetTeamInput>("GetTeamInput")({
  teamId: Schema.Number,
  seasonId: Schema.optional(Schema.Number),
}) {}

export class GetTeamsInput extends Schema.Class<GetTeamsInput>("GetTeamsInput")(
  {
    leagues: Schema.optional(Schema.Array(LeagueAbbreviation)),
    seasonYear: Schema.optional(Schema.Number),
    limit: Schema.optionalWith(
      Schema.Number.pipe(
        Schema.int(),
        Schema.greaterThan(0),
        Schema.lessThanOrEqualTo(100),
      ),
      { default: () => 50 },
    ),
  },
) {}
