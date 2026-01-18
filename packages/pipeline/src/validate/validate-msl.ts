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
  validateFileExists,
} from "./validate.service";

// ============================================================================
// MSL Validation Interfaces
// ============================================================================

/** MSL Team extracted data structure */
interface MSLTeam {
  id: string;
  name: string;
  city: string | null;
  abbreviation: string | null;
  logo_url: string | null;
  website_url: string | null;
}

/** MSL Player extracted data structure */
interface MSLPlayer {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  jersey_number: string | null;
  position: string | null;
  team_id: string | null;
  team_name: string | null;
  stats?: {
    games_played: number;
    goals: number;
    assists: number;
    points: number;
    penalty_minutes: number;
    points_per_game: number;
    ppg: number | null;
    ppa: number | null;
    shg: number | null;
    sha: number | null;
    gwg: number | null;
    fg: number | null;
    otg: number | null;
  };
}

/** MSL Goalie extracted data structure */
interface MSLGoalie {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  jersey_number: string | null;
  team_id: string | null;
  team_name: string | null;
  stats?: {
    games_played: number;
    wins: number;
    losses: number;
    ties: number;
    goals_against: number;
    saves: number;
    shots_against: number;
    gaa: number;
    save_pct: number;
    shutouts: number;
    minutes_played: number;
  };
}

/** MSL Standing extracted data structure */
interface MSLStanding {
  team_id: string;
  team_name: string | null;
  position: number;
  wins: number;
  losses: number;
  ties: number;
  games_played: number;
  points: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  streak: string | null;
}

/** MSL Game extracted data structure */
interface MSLGame {
  id: string;
  date: string | null;
  time: string | null;
  status: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_score: number;
  away_score: number;
  venue: string | null;
  period_scores?: Array<{
    period: number;
    home_score: number;
    away_score: number;
  }>;
}

// MSL Gamesheet years (currently available data)
const MSL_YEARS = [2023, 2024, 2025] as const;

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const mslDir = path.join(config.outputDir, "msl");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating MSL extracted data...`);
  yield* Effect.log(`Output directory: ${mslDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // TODO: Implement year-by-year validation (msl-validate-002+)

  const report = buildReport("MSL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(mslDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
