import { Effect, type ParseResult, Schema } from "effect";

import { makeRestClient } from "../api-client/rest-client.service";
import { NLLConfig } from "../config";
import { ParseError, type PipelineError } from "../error";

import {
  type NLLPlayer,
  NLLPlayersRequest,
  NLLPlayersResponse,
  type NLLStanding,
  NLLStandingsRequest,
  NLLStandingsResponse,
  type NLLTeam,
  NLLTeamsRequest,
  NLLTeamsResponse,
} from "./nll.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class NLLClient extends Effect.Service<NLLClient>()("NLLClient", {
  effect: Effect.gen(function* () {
    const config = yield* NLLConfig;

    const restClient = makeRestClient({
      baseUrl: config.baseUrl,
      defaultHeaders: config.headers,
    });

    return {
      getTeams: (
        input: typeof NLLTeamsRequest.Encoded,
      ): Effect.Effect<readonly NLLTeam[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLTeamsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=teams&season_id=${request.seasonId}`;
          const teams = yield* Schema.decodeUnknown(NLLTeamsResponse)(
            yield* restClient.get(endpoint, Schema.Unknown),
          ).pipe(
            Effect.mapError(
              (error) =>
                new ParseError({
                  message: `Failed to parse teams response: ${String(error)}`,
                  cause: error,
                }),
            ),
          );
          return teams;
        }).pipe(
          Effect.tap((teams) =>
            Effect.log(
              `Fetched ${teams.length} teams for season ${input.seasonId}`,
            ),
          ),
        ),

      getPlayers: (
        input: typeof NLLPlayersRequest.Encoded,
      ): Effect.Effect<readonly NLLPlayer[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLPlayersRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=players&season_id=${request.seasonId}`;
          const players = yield* Schema.decodeUnknown(NLLPlayersResponse)(
            yield* restClient.get(endpoint, Schema.Unknown),
          ).pipe(
            Effect.mapError(
              (error) =>
                new ParseError({
                  message: `Failed to parse players response: ${String(error)}`,
                  cause: error,
                }),
            ),
          );
          return players;
        }).pipe(
          Effect.tap((players) =>
            Effect.log(
              `Fetched ${players.length} players for season ${input.seasonId}`,
            ),
          ),
        ),

      getStandings: (
        input: typeof NLLStandingsRequest.Encoded,
      ): Effect.Effect<readonly NLLStanding[], PipelineError> =>
        Effect.gen(function* () {
          const request = yield* Schema.decode(NLLStandingsRequest)(input).pipe(
            Effect.mapError(mapParseError),
          );
          const endpoint = `?data_type=standings&season_id=${request.seasonId}`;
          const standings = yield* Schema.decodeUnknown(NLLStandingsResponse)(
            yield* restClient.get(endpoint, Schema.Unknown),
          ).pipe(
            Effect.mapError(
              (error) =>
                new ParseError({
                  message: `Failed to parse standings response: ${String(error)}`,
                  cause: error,
                }),
            ),
          );
          return standings;
        }).pipe(
          Effect.tap((standings) =>
            Effect.log(
              `Fetched ${standings.length} standings for season ${input.seasonId}`,
            ),
          ),
        ),
    };
  }),
  dependencies: [NLLConfig.Default],
}) {}
