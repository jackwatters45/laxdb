import { Effect, type ParseResult, Schema } from "effect";
import { ApiSchemaError } from "../api-client/api-client.error";
import { makeApiClient } from "../api-client/api-client.service";
import { makeGraphQLClient } from "../api-client/graphql.service";
import { PLLConfig } from "../config";
import {
  PLAYERS_QUERY,
  STANDINGS_QUERY,
  STAT_LEADERS_QUERY,
} from "./pll.queries";
import {
  PLLGraphQLStandingsResponse,
  PLLPlayersRequest,
  PLLPlayersResponse,
  PLLStandingsRequest,
  PLLStandingsResponse,
  PLLStatLeadersRequest,
  PLLStatLeadersResponse,
} from "./pll.schema";

const mapParseError = (error: ParseResult.ParseError): ApiSchemaError =>
  new ApiSchemaError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class PLLClient extends Effect.Service<PLLClient>()("PLLClient", {
  effect: Effect.gen(function* () {
    const config = yield* PLLConfig;

    const restClient = makeApiClient({
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
    };
  }),
  dependencies: [PLLConfig.Default],
}) {}
