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

// MSL Gamesheet seasons (season ID → year mapping)
// Extraction outputs files by season ID, not year
const MSL_SEASONS = [
  { seasonId: 3246, year: 2023 },
  { seasonId: 6007, year: 2024 },
  { seasonId: 9567, year: 2025 },
] as const;

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

  // Validate each season's data files
  for (const { seasonId, year } of MSL_SEASONS) {
    const seasonDir = path.join(mslDir, String(seasonId));
    yield* Effect.log(`Validating season ${year} (ID: ${seasonId})...`);

    // Validate teams.json
    const { result: teamsResult, data: teams } =
      yield* validateJsonArray<MSLTeam>(path.join(seasonDir, "teams.json"), 1);

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
      yield* validateJsonArray<MSLPlayer>(
        path.join(seasonDir, "players.json"),
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
      yield* validateJsonArray<MSLGoalie>(
        path.join(seasonDir, "goalies.json"),
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
      yield* validateJsonArray<MSLStanding>(
        path.join(seasonDir, "standings.json"),
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

    // Validate schedule.json
    const { result: scheduleResult, data: games } =
      yield* validateJsonArray<MSLGame>(
        path.join(seasonDir, "schedule.json"),
        1,
      );

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

    // Cross-reference validations
    // players.team_id -> teams.id
    const playersWithTeam = players.filter(
      (p: MSLPlayer) => p.team_id !== null,
    );
    if (playersWithTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        playersWithTeam,
        teams,
        "team_id",
        "id",
        `${seasonId}/players.json`,
        `${seasonId}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // goalies.team_id -> teams.id
    const goaliesWithTeam = goalies.filter(
      (g: MSLGoalie) => g.team_id !== null,
    );
    if (goaliesWithTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        goaliesWithTeam,
        teams,
        "team_id",
        "id",
        `${seasonId}/goalies.json`,
        `${seasonId}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // standings.team_id -> teams.id
    if (standings.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        standings,
        teams,
        "team_id",
        "id",
        `${seasonId}/standings.json`,
        `${seasonId}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // schedule.home_team_id -> teams.id
    const gamesWithHomeTeam = games.filter(
      (g: MSLGame) => g.home_team_id !== null,
    );
    if (gamesWithHomeTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        gamesWithHomeTeam,
        teams,
        "home_team_id",
        "id",
        `${seasonId}/schedule.json`,
        `${seasonId}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // schedule.away_team_id -> teams.id
    const gamesWithAwayTeam = games.filter(
      (g: MSLGame) => g.away_team_id !== null,
    );
    if (gamesWithAwayTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        gamesWithAwayTeam,
        teams,
        "away_team_id",
        "id",
        `${seasonId}/schedule.json`,
        `${seasonId}/teams.json`,
      );
      crossRefs.push(xref);
    }
  }

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
