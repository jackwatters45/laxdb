import * as cheerio from "cheerio";
import { Effect, type ParseResult, Schedule, Schema } from "effect";

import { PipelineConfig, WLAConfig } from "../config";
import { HttpError, NetworkError, ParseError, TimeoutError } from "../error";

import {
  WLAGame,
  WLAGoalie,
  WLAGoalieStats,
  WLAGoaliesRequest,
  WLAPlayer,
  WLAPlayerStats,
  WLAPlayersRequest,
  WLAScheduleRequest,
  WLAStanding,
  WLAStandingsRequest,
  WLATeam,
  WLATeamsRequest,
} from "./wla.schema";

const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

export class WLAClient extends Effect.Service<WLAClient>()("WLAClient", {
  effect: Effect.gen(function* () {
    const wlaConfig = yield* WLAConfig;
    const pipelineConfig = yield* PipelineConfig;

    // Re-export cheerio for potential future HTML parsing needs
    const $ = cheerio;

    // TODO: Implement WLA client methods in subsequent stories
    // - fetchWLAPage helper
    // - getTeams
    // - getPlayers
    // - getGoalies
    // - getStandings
    // - getSchedule

    return {
      // Config and utilities
      config: wlaConfig,
      pipelineConfig,
      cheerio: $,
    };
  }),
  dependencies: [WLAConfig.Default, PipelineConfig.Default],
}) {}
