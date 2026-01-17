import { Schema } from "effect";

// NLL season ID - positive integer (e.g., 225 = 2025-26 season)
export const NLLSeasonId = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("NLLSeasonId"),
  Schema.annotations({
    description: "NLL season identifier (positive integer)",
  }),
);
export type NLLSeasonId = typeof NLLSeasonId.Type;

// NLL Team response schema
export class NLLTeam extends Schema.Class<NLLTeam>("NLLTeam")({
  id: Schema.String,
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  nickname: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  team_city: Schema.NullOr(Schema.String),
  team_logo: Schema.NullOr(Schema.String),
  team_website_url: Schema.NullOr(Schema.String),
}) {}

// NLL Player Season Stats - nested schema for player statistics
export class NLLPlayerSeasonStats extends Schema.Class<NLLPlayerSeasonStats>(
  "NLLPlayerSeasonStats",
)({
  goals: Schema.Number,
  assists: Schema.Number,
  points: Schema.Number,
  penalty_minutes: Schema.Number,
  games_played: Schema.Number,
}) {}

// NLL Player response schema
export class NLLPlayer extends Schema.Class<NLLPlayer>("NLLPlayer")({
  personId: Schema.String,
  firstname: Schema.NullOr(Schema.String),
  surname: Schema.NullOr(Schema.String),
  fullname: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  height: Schema.NullOr(Schema.String),
  weight: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  jerseyNumber: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_code: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  matches: Schema.optional(NLLPlayerSeasonStats),
}) {}

// NLL Standing response schema
export class NLLStanding extends Schema.Class<NLLStanding>("NLLStanding")({
  team_id: Schema.String,
  name: Schema.NullOr(Schema.String),
  wins: Schema.Number,
  losses: Schema.Number,
  games_played: Schema.Number,
  win_percentage: Schema.Number,
  goals_for: Schema.Number,
  goals_against: Schema.Number,
  goal_diff: Schema.Number,
  position: Schema.Number,
}) {}

// NLL Venue nested schema - for match venue information
export class NLLVenue extends Schema.Class<NLLVenue>("NLLVenue")({
  id: Schema.String,
  name: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
}) {}

// NLL Squad nested schema - for match squad information
export class NLLSquad extends Schema.Class<NLLSquad>("NLLSquad")({
  id: Schema.String,
  name: Schema.NullOr(Schema.String),
  code: Schema.NullOr(Schema.String),
  score: Schema.Number,
  isHome: Schema.Boolean,
}) {}

// NLL Match Squads nested schema - away and home squads
export class NLLMatchSquads extends Schema.Class<NLLMatchSquads>(
  "NLLMatchSquads",
)({
  away: NLLSquad,
  home: NLLSquad,
}) {}

// NLL Match response schema - for schedule/game information
export class NLLMatch extends Schema.Class<NLLMatch>("NLLMatch")({
  id: Schema.String,
  date: Schema.NullOr(Schema.String),
  status: Schema.NullOr(Schema.String),
  venue: NLLVenue,
  winningSquadId: Schema.NullOr(Schema.String),
  squads: NLLMatchSquads,
}) {}

// --- Request Schemas ---

// NLL Teams request schema
export class NLLTeamsRequest extends Schema.Class<NLLTeamsRequest>(
  "NLLTeamsRequest",
)({
  seasonId: NLLSeasonId,
}) {}

// NLL Players request schema
export class NLLPlayersRequest extends Schema.Class<NLLPlayersRequest>(
  "NLLPlayersRequest",
)({
  seasonId: NLLSeasonId,
}) {}

// NLL Standings request schema
export class NLLStandingsRequest extends Schema.Class<NLLStandingsRequest>(
  "NLLStandingsRequest",
)({
  seasonId: NLLSeasonId,
}) {}

// NLL Schedule request schema
export class NLLScheduleRequest extends Schema.Class<NLLScheduleRequest>(
  "NLLScheduleRequest",
)({
  seasonId: NLLSeasonId,
}) {}

// --- Transform Schemas ---

// NLLTeamRaw - raw API response structure for a single team
// API returns: { id: { code, name, nickname, ... } }
export class NLLTeamRaw extends Schema.Class<NLLTeamRaw>("NLLTeamRaw")({
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  nickname: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  team_city: Schema.NullOr(Schema.String),
  team_logo: Schema.NullOr(Schema.String),
  team_website_url: Schema.NullOr(Schema.String),
}) {}

// TeamsMapToArray - transforms Record<id, TeamData> -> NLLTeam[]
export const TeamsMapToArray = Schema.transform(
  Schema.Record({ key: Schema.String, value: NLLTeamRaw }),
  Schema.Array(NLLTeam),
  {
    strict: true,
    decode: (record) =>
      Object.entries(record).map(([id, team]) => ({
        id,
        code: team.code,
        name: team.name,
        nickname: team.nickname,
        displayName: team.displayName,
        team_city: team.team_city,
        team_logo: team.team_logo,
        team_website_url: team.team_website_url,
      })),
    encode: (teams) =>
      Object.fromEntries(
        teams.map((team) => [
          team.id,
          {
            code: team.code,
            name: team.name,
            nickname: team.nickname,
            displayName: team.displayName,
            team_city: team.team_city,
            team_logo: team.team_logo,
            team_website_url: team.team_website_url,
          },
        ]),
      ),
  },
);

// NLLPlayerRaw - raw API response structure for a single player
// API returns: { personId: { firstname, surname, ... } }
export class NLLPlayerRaw extends Schema.Class<NLLPlayerRaw>("NLLPlayerRaw")({
  firstname: Schema.NullOr(Schema.String),
  surname: Schema.NullOr(Schema.String),
  fullname: Schema.NullOr(Schema.String),
  dateOfBirth: Schema.NullOr(Schema.String),
  height: Schema.NullOr(Schema.String),
  weight: Schema.NullOr(Schema.String),
  position: Schema.NullOr(Schema.String),
  jerseyNumber: Schema.NullOr(Schema.String),
  team_id: Schema.NullOr(Schema.String),
  team_code: Schema.NullOr(Schema.String),
  team_name: Schema.NullOr(Schema.String),
  matches: Schema.optional(NLLPlayerSeasonStats),
}) {}

// PlayersMapToArray - transforms Record<personId, PlayerData> -> NLLPlayer[]
export const PlayersMapToArray = Schema.transform(
  Schema.Record({ key: Schema.String, value: NLLPlayerRaw }),
  Schema.Array(NLLPlayer),
  {
    strict: true,
    decode: (record) =>
      Object.entries(record).map(([personId, player]) => ({
        personId,
        firstname: player.firstname,
        surname: player.surname,
        fullname: player.fullname,
        dateOfBirth: player.dateOfBirth,
        height: player.height,
        weight: player.weight,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        team_id: player.team_id,
        team_code: player.team_code,
        team_name: player.team_name,
        matches: player.matches,
      })),
    encode: (players) =>
      Object.fromEntries(
        players.map((player) => [
          player.personId,
          {
            firstname: player.firstname,
            surname: player.surname,
            fullname: player.fullname,
            dateOfBirth: player.dateOfBirth,
            height: player.height,
            weight: player.weight,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            team_id: player.team_id,
            team_code: player.team_code,
            team_name: player.team_name,
            matches: player.matches,
          },
        ]),
      ),
  },
);
