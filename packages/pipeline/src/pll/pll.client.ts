import { Effect, type ParseResult, Schema } from "effect";
import { ParseError } from "../error";
import { makeRestClient } from "../api-client/rest-client.service";
import { makeGraphQLClient } from "../api-client/graphql.service";
import { PLLConfig } from "../config";
import {
  ADVANCED_PLAYERS_QUERY,
  CAREER_STATS_QUERY,
  EVENT_DETAIL_QUERY,
  PLAYER_DETAIL_QUERY,
  PLAYERS_QUERY,
  STANDINGS_QUERY,
  STAT_LEADERS_QUERY,
  TEAM_DETAIL_QUERY,
  TEAM_STATS_ONLY_QUERY,
  TEAMS_QUERY,
} from "./pll.queries";
import {
  PLLAdvancedPlayersRequest,
  PLLAdvancedPlayersResponse,
  PLLCareerStatsRequest,
  PLLCareerStatsResponse,
  PLLEventDetailRequest,
  PLLEventDetailResponse,
  PLLEventsRequest,
  PLLEventsResponse,
  PLLGraphQLStandingsResponse,
  PLLPlayerDetailRequest,
  PLLPlayerDetailResponse,
  PLLPlayersRequest,
  PLLPlayersResponse,
  PLLStandingsRequest,
  PLLStandingsResponse,
  PLLStatLeadersRequest,
  PLLStatLeadersResponse,
  PLLTeamDetailRequest,
  PLLTeamDetailResponse,
  PLLTeamStatsRequest,
  PLLTeamStatsResponse,
  PLLTeamsRequest,
  PLLTeamsResponse,
} from "./pll.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class PLLClient extends Effect.Service<PLLClient>()("PLLClient", {
  effect: Effect.gen(function* () {
    const config = yield* PLLConfig;

    const restClient = makeRestClient({
      baseUrl: config.rest.baseUrl,
      authHeader: `Bearer ${config.rest.token}`,
      defaultHeaders: config.rest.headers,
    });

    const graphqlClient = makeGraphQLClient({
      endpoint: config.graphql.endpoint,
      authHeader: `Bearer ${config.graphql.token}`,
      defaultHeaders: config.graphql.headers,
    });

    return {
      getStandings: (input: typeof PLLStandingsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLStandingsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `/standings?year=${request.year}&champSeries=${request.champSeries}`;
          const response = yield* restClient.get(
            endpoint,
            PLLStandingsResponse,
          );
          return response.data.items;
        }).pipe(
          Effect.tap((standings) =>
            Effect.log(
              `Fetched ${standings.length} team standings for ${input.year}`,
            ),
          ),
        ),

      getStandingsGraphQL: (input: typeof PLLStandingsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLStandingsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const response = yield* graphqlClient.query(
            STANDINGS_QUERY,
            PLLGraphQLStandingsResponse,
            {
              year: request.year,
              champSeries: request.champSeries,
            },
          );
          return response.standings;
        }).pipe(
          Effect.tap((standings) =>
            Effect.log(
              `Fetched ${standings.length} standings via GraphQL for ${input.year}`,
            ),
          ),
        ),

      getPlayers: (input: typeof PLLPlayersRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLPlayersRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const response = yield* graphqlClient.query(
            PLAYERS_QUERY,
            PLLPlayersResponse,
            {
              season: request.season,
              league: request.league,
              includeZPP: request.includeZPP,
              includeReg: request.includeReg,
              includePost: request.includePost,
              limit: request.limit,
            },
          );
          return response.allPlayers;
        }).pipe(
          Effect.tap((players) =>
            Effect.log(`Fetched ${players.length} players for ${input.season}`),
          ),
        ),

      getStatLeaders: (input: typeof PLLStatLeadersRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLStatLeadersRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            STAT_LEADERS_QUERY,
            PLLStatLeadersResponse,
            {
              year: request.year,
              seasonSegment: request.seasonSegment,
              statList: request.statList,
              limit: request.limit,
            },
          );
          return response.playerStatLeaders;
        }).pipe(
          Effect.tap((leaders) =>
            Effect.log(
              `Fetched ${leaders.length} stat leaders for ${input.year}`,
            ),
          ),
        ),

      getAdvancedPlayers: (input: typeof PLLAdvancedPlayersRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLAdvancedPlayersRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            ADVANCED_PLAYERS_QUERY,
            PLLAdvancedPlayersResponse,
            {
              year: request.year,
              limit: request.limit,
              league: request.league,
            },
          );
          return response.allPlayers;
        }).pipe(
          Effect.tap((players) =>
            Effect.log(
              `Fetched ${players.length} players with advanced stats for ${input.year}`,
            ),
          ),
        ),

      getTeams: (input: typeof PLLTeamsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLTeamsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const response = yield* graphqlClient.query(
            TEAMS_QUERY,
            PLLTeamsResponse,
            {
              year: request.year,
              sortBy: request.sortBy,
              includeChampSeries: request.includeChampSeries,
            },
          );
          return response.allTeams;
        }).pipe(
          Effect.tap((teams) =>
            Effect.log(`Fetched ${teams.length} teams for ${input.year}`),
          ),
        ),

      getCareerStats: (input: typeof PLLCareerStatsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLCareerStatsRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            CAREER_STATS_QUERY,
            PLLCareerStatsResponse,
            {
              stat: request.stat,
              limit: request.limit,
            },
          );
          return response.careerStats;
        }).pipe(
          Effect.tap((stats) =>
            Effect.log(
              `Fetched ${stats.length} career stats for stat=${input.stat ?? "default"}`,
            ),
          ),
        ),

      getPlayerDetail: (input: typeof PLLPlayerDetailRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLPlayerDetailRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            PLAYER_DETAIL_QUERY,
            PLLPlayerDetailResponse,
            {
              slug: request.slug,
              year: request.year,
              statsYear: request.statsYear,
            },
          );
          return response.player;
        }).pipe(
          Effect.tap(() =>
            Effect.log(`Fetched player detail for slug=${input.slug}`),
          ),
        ),

      getTeamDetail: (input: typeof PLLTeamDetailRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLTeamDetailRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            TEAM_DETAIL_QUERY,
            PLLTeamDetailResponse,
            {
              id: request.id,
              year: request.year,
              statsYear: request.statsYear,
              eventsYear: request.eventsYear,
              includeChampSeries: request.includeChampSeries,
            },
          );
          return response.team;
        }).pipe(
          Effect.tap(() =>
            Effect.log(`Fetched team detail for id=${input.id}`),
          ),
        ),

      getTeamStats: (input: typeof PLLTeamStatsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLTeamStatsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const response = yield* graphqlClient.query(
            TEAM_STATS_ONLY_QUERY,
            PLLTeamStatsResponse,
            {
              id: request.id,
              year: request.year,
              segment: request.segment,
            },
          );
          return response.team?.stats ?? null;
        }).pipe(
          Effect.tap(() =>
            Effect.log(
              `Fetched team stats for id=${input.id} segment=${input.segment}`,
            ),
          ),
        ),

      getEvents: (input: typeof PLLEventsRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLEventsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `/events?year=${request.year}&includeCS=${request.includeCS}&includeWLL=${request.includeWLL}`;
          const response = yield* restClient.get(endpoint, PLLEventsResponse);
          return response.data.items;
        }).pipe(
          Effect.tap((events) =>
            Effect.log(`Fetched ${events.length} events for ${input.year}`),
          ),
        ),

      getEventDetail: (input: typeof PLLEventDetailRequest.Encoded) =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(PLLEventDetailRequest)(
            input,
          ).pipe(Effect.mapError(mapParseError));
          const response = yield* graphqlClient.query(
            EVENT_DETAIL_QUERY,
            PLLEventDetailResponse,
            {
              slug: request.slug,
            },
          );
          return response.event;
        }).pipe(
          Effect.tap((event) =>
            Effect.log(
              `Fetched event detail for slug=${input.slug}${event ? ` (${event.homeTeam?.locationCode ?? "?"} vs ${event.awayTeam?.locationCode ?? "?"})` : ""}`,
            ),
          ),
        ),
    };
  }),
  dependencies: [PLLConfig.Default],
}) {}
