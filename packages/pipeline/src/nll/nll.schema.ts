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

// NLLTeamLogo - raw API structure for team logo object
const NLLTeamLogoRaw = Schema.Struct({
  url: Schema.String,
}).pipe(Schema.annotations({ identifier: "NLLTeamLogoRaw" }));

// NLLTeamRaw - raw API response structure for a single team
// API returns: { map: { id: { id, code, name, nickname, team_logo: {...}, ... } } }
export class NLLTeamRaw extends Schema.Class<NLLTeamRaw>("NLLTeamRaw")({
  id: Schema.Number,
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  nickname: Schema.NullOr(Schema.String),
  displayName: Schema.NullOr(Schema.String),
  team_city: Schema.NullOr(Schema.String),
  team_logo: Schema.NullOr(NLLTeamLogoRaw),
  team_website_url: Schema.NullOr(Schema.String),
}) {}

// TeamsMapToArray - transforms { map: Record<id, TeamData> } -> NLLTeam[]
export const TeamsMapToArray = Schema.transform(
  Schema.Struct({
    map: Schema.Record({ key: Schema.String, value: NLLTeamRaw }),
  }),
  Schema.Array(NLLTeam),
  {
    strict: true,
    decode: (response) =>
      Object.values(response.map).map((team) => ({
        id: String(team.id),
        code: team.code,
        name: team.name,
        nickname: team.nickname,
        displayName: team.displayName,
        team_city: team.team_city,
        team_logo: team.team_logo?.url ?? null,
        team_website_url: team.team_website_url,
      })),
    encode: (teams) => ({
      map: Object.fromEntries(
        teams.map((team) => [
          team.id,
          {
            id: Number(team.id),
            code: team.code,
            name: team.name,
            nickname: team.nickname,
            displayName: team.displayName,
            team_city: team.team_city,
            team_logo: team.team_logo ? { url: team.team_logo } : null,
            team_website_url: team.team_website_url,
          },
        ]),
      ),
    }),
  },
);

// NLLPlayerMatchesRaw - raw API structure for player matches (just season games count)
const NLLPlayerMatchesRaw = Schema.Struct({
  season: Schema.Number,
}).pipe(Schema.annotations({ identifier: "NLLPlayerMatchesRaw" }));

// NLLPlayerRaw - raw API response structure for a single player
// API returns: { map: { personId: { firstname, surname, ... } } }
// Note: Many fields can be missing entirely from the API response
export class NLLPlayerRaw extends Schema.Class<NLLPlayerRaw>("NLLPlayerRaw")({
  personId: Schema.Number,
  firstname: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  surname: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  fullname: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  dateOfBirth: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  height: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  weight: Schema.optionalWith(Schema.NullOr(Schema.Number), {
    default: () => null,
  }),
  position: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  jerseyNumber: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  team_id: Schema.optionalWith(Schema.NullOr(Schema.Number), {
    default: () => null,
  }),
  team_code: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  team_name: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  matches: Schema.optional(NLLPlayerMatchesRaw),
}) {}

// PlayersMapToArray - transforms { map: Record<personId, PlayerData> } -> NLLPlayer[]
export const PlayersMapToArray = Schema.transform(
  Schema.Struct({
    map: Schema.Record({ key: Schema.String, value: NLLPlayerRaw }),
  }),
  Schema.Array(NLLPlayer),
  {
    strict: true,
    decode: (response) =>
      Object.values(response.map).map((player) => ({
        personId: String(player.personId),
        firstname: player.firstname,
        surname: player.surname,
        fullname: player.fullname,
        dateOfBirth: player.dateOfBirth,
        height: player.height,
        weight: player.weight != null ? String(player.weight) : null,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        team_id: player.team_id != null ? String(player.team_id) : null,
        team_code: player.team_code,
        team_name: player.team_name,
        matches: player.matches
          ? {
              goals: 0,
              assists: 0,
              points: 0,
              penalty_minutes: 0,
              games_played: player.matches.season,
            }
          : undefined,
      })),
    encode: (players) => ({
      map: Object.fromEntries(
        players.map((player) => [
          player.personId,
          {
            personId: Number(player.personId),
            firstname: player.firstname,
            surname: player.surname,
            fullname: player.fullname,
            dateOfBirth: player.dateOfBirth,
            height: player.height,
            weight: player.weight != null ? Number(player.weight) : null,
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            team_id: player.team_id != null ? Number(player.team_id) : null,
            team_code: player.team_code,
            team_name: player.team_name,
            matches: player.matches
              ? { season: player.matches.games_played }
              : undefined,
          },
        ]),
      ),
    }),
  },
);

// --- Response Wrapper Schemas ---

// NLLTeamsResponse - wraps the TeamsMapToArray transform
export const NLLTeamsResponse = TeamsMapToArray;

// NLLPlayersResponse - wraps the PlayersMapToArray transform
export const NLLPlayersResponse = PlayersMapToArray;

// NLLStandingRaw - raw API response structure for a single standing
// API returns team_id as number and win_percentage as string
export class NLLStandingRaw extends Schema.Class<NLLStandingRaw>(
  "NLLStandingRaw",
)({
  team_id: Schema.Number,
  name: Schema.NullOr(Schema.String),
  wins: Schema.Number,
  losses: Schema.Number,
  games_played: Schema.Number,
  win_percentage: Schema.String,
  goals_for: Schema.Number,
  goals_against: Schema.Number,
  goal_diff: Schema.Number,
  position: Schema.Number,
}) {}

// StandingsMapToArray - transforms { standings_pretty: { "": [...] } } -> NLLStanding[]
export const StandingsMapToArray = Schema.transform(
  Schema.Struct({
    standings_pretty: Schema.Record({
      key: Schema.String,
      value: Schema.Array(NLLStandingRaw),
    }),
  }),
  Schema.Array(NLLStanding),
  {
    strict: true,
    decode: (response) =>
      Object.values(response.standings_pretty)
        .flat()
        .map((standing) => ({
          team_id: String(standing.team_id),
          name: standing.name,
          wins: standing.wins,
          losses: standing.losses,
          games_played: standing.games_played,
          win_percentage: Number.parseFloat(standing.win_percentage),
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          goal_diff: standing.goal_diff,
          position: standing.position,
        })),
    encode: (standings) => ({
      standings_pretty: {
        "": standings.map((standing) => ({
          team_id: Number(standing.team_id),
          name: standing.name,
          wins: standing.wins,
          losses: standing.losses,
          games_played: standing.games_played,
          win_percentage: standing.win_percentage.toFixed(3),
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          goal_diff: standing.goal_diff,
          position: standing.position,
        })),
      },
    }),
  },
);

// NLLStandingsResponse - wraps the StandingsMapToArray transform
export const NLLStandingsResponse = StandingsMapToArray;

// Raw API structures for schedule response
// API returns: [{ code: "WK01", id: 31382, matches: [...], name: "Week 01", ... }]

// Raw squad score structure
const NLLSquadScoreRaw = Schema.Struct({
  goals: Schema.Number,
  score: Schema.Number,
}).pipe(Schema.annotations({ identifier: "NLLSquadScoreRaw" }));

// Raw squad structure in schedule matches
const NLLScheduleSquadRaw = Schema.Struct({
  id: Schema.Number,
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  nickname: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  displayName: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  score: NLLSquadScoreRaw,
}).pipe(Schema.annotations({ identifier: "NLLScheduleSquadRaw" }));

// Raw squads structure with away/home
const NLLScheduleSquadsRaw = Schema.Struct({
  away: NLLScheduleSquadRaw,
  home: NLLScheduleSquadRaw,
}).pipe(Schema.annotations({ identifier: "NLLScheduleSquadsRaw" }));

// Raw date structure
const NLLScheduleDateRaw = Schema.Struct({
  startDate: Schema.NullOr(Schema.String),
  startTime: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  utcMatchStart: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
}).pipe(Schema.annotations({ identifier: "NLLScheduleDateRaw" }));

// Raw status structure
const NLLScheduleStatusRaw = Schema.Struct({
  id: Schema.Number,
  name: Schema.NullOr(Schema.String),
  code: Schema.NullOr(Schema.String),
  typeId: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  typeName: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  period: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  periodSecs: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  periodDisplay: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  periodTime: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  remainingSecs: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  remainingDisplay: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  remainingTime: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
}).pipe(Schema.annotations({ identifier: "NLLScheduleStatusRaw" }));

// Raw venue structure in schedule matches (includes timeZone)
const NLLScheduleVenueRaw = Schema.Struct({
  id: Schema.Number,
  code: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
  name: Schema.NullOr(Schema.String),
  timeZone: Schema.optionalWith(Schema.NullOr(Schema.String), {
    default: () => null,
  }),
}).pipe(Schema.annotations({ identifier: "NLLScheduleVenueRaw" }));

// Raw match structure in schedule response
const NLLScheduleMatchRaw = Schema.Struct({
  id: Schema.Number,
  weekOrder: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  squads: NLLScheduleSquadsRaw,
  date: NLLScheduleDateRaw,
  status: NLLScheduleStatusRaw,
  type: Schema.optionalWith(
    Schema.Struct({
      id: Schema.Number,
      name: Schema.NullOr(Schema.String),
      code: Schema.NullOr(Schema.String),
    }),
    { default: () => ({ id: 0, name: null, code: null }) },
  ),
  venue: NLLScheduleVenueRaw,
  winningSquadId: Schema.NullOr(Schema.Number),
}).pipe(Schema.annotations({ identifier: "NLLScheduleMatchRaw" }));

// Raw week structure in schedule response
const NLLScheduleWeekRaw = Schema.Struct({
  id: Schema.Number,
  code: Schema.String,
  name: Schema.NullOr(Schema.String),
  number: Schema.Number,
  phaseNumber: Schema.optionalWith(Schema.Number, { default: () => 1 }),
  season_id: Schema.String,
  matches: Schema.Array(NLLScheduleMatchRaw),
}).pipe(Schema.annotations({ identifier: "NLLScheduleWeekRaw" }));

// NLLScheduleResponse - transforms week array to flat match array
// API returns: [{ code: "WK01", matches: [...] }, ...] -> NLLMatch[]
export const NLLScheduleResponse = Schema.transform(
  Schema.Array(NLLScheduleWeekRaw),
  Schema.Array(NLLMatch),
  {
    strict: true,
    decode: (weeks) =>
      weeks.flatMap((week) =>
        week.matches.map((match) => ({
          id: String(match.id),
          date: match.date.startDate,
          status: match.status.name,
          venue: {
            id: String(match.venue.id),
            name: match.venue.name,
            city: null, // Not provided in this API structure
          },
          winningSquadId:
            match.winningSquadId != null ? String(match.winningSquadId) : null,
          squads: {
            away: {
              id: String(match.squads.away.id),
              name: match.squads.away.name,
              code: match.squads.away.code,
              score: match.squads.away.score.goals,
              isHome: false,
            },
            home: {
              id: String(match.squads.home.id),
              name: match.squads.home.name,
              code: match.squads.home.code,
              score: match.squads.home.score.goals,
              isHome: true,
            },
          },
        })),
      ),
    encode: (matches) => [
      {
        id: 0,
        code: "WK",
        name: "Week",
        number: 1,
        phaseNumber: 1,
        season_id: "0",
        matches: matches.map((match) => ({
          id: Number(match.id),
          weekOrder: 0,
          squads: {
            away: {
              id: Number(match.squads.away.id),
              code: match.squads.away.code ?? "",
              name: match.squads.away.name,
              nickname: null,
              displayName: null,
              score: {
                goals: match.squads.away.score,
                score: match.squads.away.score,
              },
            },
            home: {
              id: Number(match.squads.home.id),
              code: match.squads.home.code ?? "",
              name: match.squads.home.name,
              nickname: null,
              displayName: null,
              score: {
                goals: match.squads.home.score,
                score: match.squads.home.score,
              },
            },
          },
          date: { startDate: match.date, startTime: null, utcMatchStart: null },
          status: {
            id: 0,
            name: match.status,
            code: null,
            typeId: 0,
            typeName: null,
            period: 0,
            periodSecs: 0,
            periodDisplay: null,
            periodTime: null,
            remainingSecs: 0,
            remainingDisplay: null,
            remainingTime: null,
          },
          type: { id: 0, name: null, code: null },
          venue: {
            id: Number(match.venue.id),
            code: null,
            name: match.venue.name,
            timeZone: null,
          },
          winningSquadId:
            match.winningSquadId != null ? Number(match.winningSquadId) : null,
        })),
      },
    ],
  },
);
