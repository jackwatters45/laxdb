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

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const nllDir = path.join(config.outputDir, "nll");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating NLL extracted data...`);
  yield* Effect.log(`Output directory: ${nllDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // TODO: Implement validations in subsequent stories

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
