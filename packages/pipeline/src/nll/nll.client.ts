import { Effect, type ParseResult, Schema } from "effect";

import { makeRestClient } from "../api-client/rest-client.service";
import { NLLConfig } from "../config";
import { ParseError, type PipelineError } from "../error";

import { type NLLTeam, NLLTeamsRequest, NLLTeamsResponse } from "./nll.schema";

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
    };
  }),
  dependencies: [NLLConfig.Default],
}) {}
