import { Effect, type ParseResult, Schema } from "effect";

import { makeRestClient } from "../api-client/rest-client.service";
import { NLLConfig } from "../config";
import { ParseError } from "../error";

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
      // Methods will be added in subsequent stories
    };
  }),
  dependencies: [NLLConfig.Default],
}) {}
