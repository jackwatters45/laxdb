import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schema } from "effect";

import { MLLConfig, PipelineConfig } from "../config";
import { ParseError } from "../error";

import {
  type MLLGame,
  type MLLGoalie,
  MLLGoaliesRequest,
  type MLLPlayer,
  MLLPlayersRequest,
  MLLScheduleRequest,
  type MLLStanding,
  MLLStandingsRequest,
  type MLLStatLeader,
  MLLStatLeadersRequest,
  type MLLTeam,
  MLLTeamsRequest,
  type WaybackCDXEntry,
} from "./mll.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class MLLClient extends Effect.Service<MLLClient>()("MLLClient", {
  effect: Effect.gen(function* () {
    const mllConfig = yield* MLLConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for HTML parsing in methods
    const $ = cheerio;

    return {
      // Placeholder methods - implementations will be added in subsequent stories
      config: mllConfig,
      pipelineConfig,
      cheerio: $,

      // Type exports for method signatures (to be implemented)
      _types: {
        mapParseError,
      } as const,
    };
  }),
  dependencies: [MLLConfig.Default, PipelineConfig.Default],
}) {}
