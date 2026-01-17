import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { ExtractConfigService } from "../extract/extract.config";

import type {
  FileValidationResult,
  CrossReferenceResult,
} from "./validate.schema";
import {
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
  crossReference,
  buildReport,
  printReport,
} from "./validate.service";

// NLL validation interfaces - matches extracted JSON structure

interface NLLTeam {
  id: string;
  code: string;
  name: string | null;
  nickname: string | null;
  displayName: string | null;
  team_city: string | null;
  team_logo: string | null;
  team_website_url: string | null;
}

interface NLLPlayer {
  personId: string;
  firstname: string | null;
  surname: string | null;
  fullname: string | null;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  position: string | null;
  jerseyNumber: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  matches?: {
    goals: number;
    assists: number;
    points: number;
    penalty_minutes: number;
    games_played: number;
  };
}

interface NLLStanding {
  team_id: string;
  name: string | null;
  wins: number;
  losses: number;
  games_played: number;
  win_percentage: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  position: number;
}

interface NLLMatch {
  id: string;
  date: string | null;
  status: string | null;
  venue: {
    id: string;
    name: string | null;
    city: string | null;
  };
  winningSquadId: string | null;
  squads: {
    away: {
      id: string;
      name: string | null;
      code: string | null;
      score: number;
      isHome: boolean;
    };
    home: {
      id: string;
      name: string | null;
      code: string | null;
      score: number;
      isHome: boolean;
    };
  };
}

const NLL_SEASON = "225";

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const nllDir = path.join(config.outputDir, "nll");
  const seasonDir = path.join(nllDir, NLL_SEASON);
  const startTime = Date.now();

  yield* Effect.log(`\nValidating NLL extracted data...`);
  yield* Effect.log(`Output directory: ${nllDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // Validate teams.json
  const { result: teamsResult, data: teams } =
    yield* validateJsonArray<NLLTeam>(path.join(seasonDir, "teams.json"), 1);

  if (teams.length > 0) {
    const requiredCheck = yield* validateRequiredFields(teams, [
      "id",
      "code",
      "name",
    ]);
    const uniqueIdCheck = yield* validateUniqueField(teams, "id");

    const {
      filePath: fp,
      exists,
      sizeBytes,
      recordCount,
      checks,
    } = teamsResult;
    fileResults.push({
      filePath: fp,
      exists,
      sizeBytes,
      recordCount,
      checks: [...checks, requiredCheck, uniqueIdCheck],
    });
  } else {
    fileResults.push(teamsResult);
  }

  // Validate players.json
  const { result: playersResult, data: players } =
    yield* validateJsonArray<NLLPlayer>(
      path.join(seasonDir, "players.json"),
      1,
    );

  if (players.length > 0) {
    const requiredCheck = yield* validateRequiredFields(players, [
      "personId",
      "firstname",
      "team_id",
    ]);
    const uniqueIdCheck = yield* validateUniqueField(players, "personId");

    const {
      filePath: pFp,
      exists: pExists,
      sizeBytes: pSizeBytes,
      recordCount: pRecordCount,
      checks: pChecks,
    } = playersResult;
    fileResults.push({
      filePath: pFp,
      exists: pExists,
      sizeBytes: pSizeBytes,
      recordCount: pRecordCount,
      checks: [...pChecks, requiredCheck, uniqueIdCheck],
    });
  } else {
    fileResults.push(playersResult);
  }

  // TODO: Implement remaining validations in subsequent stories

  const report = buildReport("NLL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(nllDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
