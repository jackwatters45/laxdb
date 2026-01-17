import { Effect, type ParseResult, Schema } from "effect";

import { makeRestClient } from "../api-client/rest-client.service";
import { NLLConfig } from "../config";
import { ParseError } from "../error";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });
