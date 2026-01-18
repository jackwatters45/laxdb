import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schema } from "effect";

import { MSLConfig, PipelineConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  MSLGame,
  MSLGamePeriodScore,
  MSLGoalie,
  MSLGoalieStats,
  MSLGoaliesRequest,
  MSLPlayer,
  MSLPlayerStats,
  MSLPlayersRequest,
  MSLScheduleRequest,
  MSLStanding,
  MSLStandingsRequest,
  MSLTeam,
  MSLTeamsRequest,
} from "./msl.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class MSLClient extends Effect.Service<MSLClient>()("MSLClient", {
  effect: Effect.gen(function* () {
    const mslConfig = yield* MSLConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for HTML parsing in methods
    const $ = cheerio;

    return {
      // Placeholder for future methods
    };
  }),
  dependencies: [MSLConfig.Default, PipelineConfig.Default],
}) {}
