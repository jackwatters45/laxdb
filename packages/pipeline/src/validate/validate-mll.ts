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
// MLL Validation Interfaces
// ============================================================================

/** MLL Team extracted data structure */
interface MLLTeam {
  id: string;
  name: string;
  city: string | null;
  abbreviation: string | null;
  founded_year: number | null;
  final_year: number | null;
}

/** MLL Player extracted data structure */
interface MLLPlayer {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  team_id: string | null;
  team_name: string | null;
  college: string | null;
  stats?: {
    games_played: number;
    goals: number;
    assists: number;
    points: number;
    shots: number | null;
    shot_pct: number | null;
    ground_balls: number | null;
    caused_turnovers: number | null;
    turnovers: number | null;
    faceoffs_won: number | null;
    faceoffs_lost: number | null;
    faceoff_pct: number | null;
  };
}

/** MLL Goalie extracted data structure */
interface MLLGoalie {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
  team_name: string | null;
  stats?: {
    games_played: number;
    wins: number;
    losses: number;
    goals_against: number;
    saves: number;
    gaa: number | null;
    save_pct: number | null;
  };
}

/** MLL Standing extracted data structure */
interface MLLStanding {
  team_id: string;
  team_name: string | null;
  position: number;
  wins: number;
  losses: number;
  games_played: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  win_pct: number;
}

/** MLL Stat Leader extracted data structure */
interface MLLStatLeader {
  player_id: string;
  player_name: string;
  team_id: string | null;
  team_name: string | null;
  stat_type: string;
  stat_value: number;
  rank: number;
}

/** MLL Game extracted data structure (from Wayback Machine) */
interface MLLGame {
  id: string;
  date: string | null;
  status: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  source_url: string | null;
}

// MLL years: 2001-2020
const MLL_YEARS = Array.from({ length: 20 }, (_, i) => 2001 + i);

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const mllDir = path.join(config.outputDir, "mll");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating MLL extracted data...`);
  yield* Effect.log(`Output directory: ${mllDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // Validate each year's data files
  for (const year of MLL_YEARS) {
    const yearDir = path.join(mllDir, String(year));
    yield* Effect.log(`Validating year ${year}...`);

    // Validate teams.json
    const { result: teamsResult, data: teams } =
      yield* validateJsonArray<MLLTeam>(path.join(yearDir, "teams.json"), 1);

    if (teams.length > 0) {
      const requiredCheck = yield* validateRequiredFields(teams, [
        "id",
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
      yield* validateJsonArray<MLLPlayer>(
        path.join(yearDir, "players.json"),
        1,
      );

    if (players.length > 0) {
      const requiredCheck = yield* validateRequiredFields(players, [
        "id",
        "name",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(players, "id");
      const {
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks,
      } = playersResult;
      fileResults.push({
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks: [...checks, requiredCheck, uniqueIdCheck],
      });
    } else {
      fileResults.push(playersResult);
    }

    // Validate goalies.json
    const { result: goaliesResult, data: goalies } =
      yield* validateJsonArray<MLLGoalie>(
        path.join(yearDir, "goalies.json"),
        1,
      );

    if (goalies.length > 0) {
      const requiredCheck = yield* validateRequiredFields(goalies, [
        "id",
        "name",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(goalies, "id");
      const {
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks,
      } = goaliesResult;
      fileResults.push({
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks: [...checks, requiredCheck, uniqueIdCheck],
      });
    } else {
      fileResults.push(goaliesResult);
    }

    // Validate standings.json
    const { result: standingsResult, data: standings } =
      yield* validateJsonArray<MLLStanding>(
        path.join(yearDir, "standings.json"),
        1,
      );

    if (standings.length > 0) {
      const requiredCheck = yield* validateRequiredFields(standings, [
        "team_id",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(standings, "team_id");
      const {
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks,
      } = standingsResult;
      fileResults.push({
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks: [...checks, requiredCheck, uniqueIdCheck],
      });
    } else {
      fileResults.push(standingsResult);
    }

    // Validate stat-leaders.json
    const { result: leadersResult, data: leaders } =
      yield* validateJsonArray<MLLStatLeader>(
        path.join(yearDir, "stat-leaders.json"),
        1,
      );

    if (leaders.length > 0) {
      const requiredCheck = yield* validateRequiredFields(leaders, [
        "player_id",
      ]);
      const {
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks,
      } = leadersResult;
      fileResults.push({
        filePath: fp,
        exists,
        sizeBytes,
        recordCount,
        checks: [...checks, requiredCheck],
      });
    } else {
      fileResults.push(leadersResult);
    }

    // Validate schedule.json (optional file - from Wayback Machine)
    const schedulePath = path.join(yearDir, "schedule.json");
    const scheduleFileResult = yield* validateFileExists(schedulePath);

    if (scheduleFileResult.exists) {
      const { result: scheduleResult, data: games } =
        yield* validateJsonArray<MLLGame>(schedulePath, 0);

      if (games.length > 0) {
        const requiredCheck = yield* validateRequiredFields(games, ["id"]);
        const uniqueIdCheck = yield* validateUniqueField(games, "id");
        const {
          filePath: fp,
          exists,
          sizeBytes,
          recordCount,
          checks,
        } = scheduleResult;
        fileResults.push({
          filePath: fp,
          exists,
          sizeBytes,
          recordCount,
          checks: [...checks, requiredCheck, uniqueIdCheck],
        });
      } else {
        fileResults.push(scheduleResult);
      }
    }

    // Cross-reference: standings.team_id -> teams.id
    if (standings.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        standings,
        teams,
        "team_id",
        "id",
        `${year}/standings.json`,
        `${year}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // Cross-reference: players.team_id -> teams.id
    const playersWithTeam = players.filter((p) => p.team_id !== null);
    if (playersWithTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        playersWithTeam,
        teams,
        "team_id",
        "id",
        `${year}/players.json`,
        `${year}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // Cross-reference: goalies.team_id -> teams.id
    const goaliesWithTeam = goalies.filter((g) => g.team_id !== null);
    if (goaliesWithTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        goaliesWithTeam,
        teams,
        "team_id",
        "id",
        `${year}/goalies.json`,
        `${year}/teams.json`,
      );
      crossRefs.push(xref);
    }
  }

  const report = buildReport("MLL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(mllDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
