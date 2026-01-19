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
// WLA Validation Interfaces
// ============================================================================

/** WLA Team extracted data structure */
interface WLATeam {
  id: string;
  code: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  website_url: string | null;
}

/** WLA Player extracted data structure */
interface WLAPlayer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  jersey_number: string | null;
  position: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  stats?: {
    games_played: number;
    goals: number;
    assists: number;
    points: number;
    penalty_minutes: number;
    ppg: number | null;
    shg: number | null;
    gwg: number | null;
    scoring_pct: number | null;
  };
}

/** WLA Goalie extracted data structure */
interface WLAGoalie {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  jersey_number: string | null;
  team_id: string | null;
  team_code: string | null;
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
  };
}

/** WLA Standing extracted data structure */
interface WLAStanding {
  team_id: string;
  team_name: string | null;
  position: number;
  wins: number;
  losses: number;
  ties: number;
  games_played: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  win_pct: number;
}

/** WLA Game extracted data structure */
interface WLAGame {
  id: string;
  date: string | null;
  status: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_score: number;
  away_score: number;
  venue: string | null;
}

// ============================================================================
// WLA Season Configuration
// ============================================================================

// WLA Pointstreak seasons (season ID → year mapping)
// Extraction outputs files by season year
const WLA_SEASONS = [
  { seasonId: 8669, year: 2025 },
  { seasonId: 6810, year: 2024 },
  { seasonId: 5207, year: 2023 },
  { seasonId: 4089, year: 2022 },
  // 2021: COVID - no season
  { seasonId: 2330, year: 2020 },
  { seasonId: 1528, year: 2019 },
  { seasonId: 1059, year: 2018 },
  { seasonId: 624, year: 2017 },
  { seasonId: 307, year: 2016 },
  { seasonId: 137, year: 2015 },
  { seasonId: 160, year: 2014 },
  { seasonId: 158, year: 2013 },
  { seasonId: 171, year: 2012 },
  { seasonId: 169, year: 2011 },
  { seasonId: 174, year: 2010 },
  { seasonId: 165, year: 2009 },
  { seasonId: 175, year: 2008 },
  { seasonId: 162, year: 2007 },
  { seasonId: 156, year: 2006 },
  { seasonId: 176, year: 2005 },
] as const;

// ============================================================================
// WLA Validation Program
// ============================================================================

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const wlaDir = path.join(config.outputDir, "wla");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating WLA extracted data...`);
  yield* Effect.log(`Output directory: ${wlaDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  // Validate each season's data files
  for (const { seasonId, year } of WLA_SEASONS) {
    const seasonDir = path.join(wlaDir, String(year));
    yield* Effect.log(`Validating season ${year} (ID: ${seasonId})...`);

    // Validate teams.json
    const { result: teamsResult, data: teams } =
      yield* validateJsonArray<WLATeam>(path.join(seasonDir, "teams.json"), 1);

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
      yield* validateJsonArray<WLAPlayer>(
        path.join(seasonDir, "players.json"),
        0, // WLA SPA may not return players
      );

    if (players.length > 0) {
      const requiredCheck = yield* validateRequiredFields(players, [
        "id",
        "full_name",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(players, "id");

      // Validate stats numeric fields when present
      const statsNumericCheck = yield* Effect.succeed(
        (() => {
          const numericFields = [
            "games_played",
            "goals",
            "assists",
            "points",
            "penalty_minutes",
          ] as const;
          const invalidStats: string[] = [];

          for (const player of players) {
            if (player.stats) {
              for (const field of numericFields) {
                const value = player.stats[field];
                if (value !== undefined && typeof value !== "number") {
                  invalidStats.push(
                    `${player.id}.stats.${field}: ${typeof value}`,
                  );
                }
              }
            }
          }

          const issues: (typeof FileValidationResult.Type)["checks"][number]["issues"] =
            invalidStats.length > 0
              ? [
                  {
                    severity: "error" as const,
                    code: "INVALID_NUMERIC_STATS",
                    message: `Found ${invalidStats.length} non-numeric stat values`,
                    path: "stats",
                    context: { samples: invalidStats.slice(0, 5) },
                  },
                ]
              : [];

          return {
            checkName: "stats_numeric_fields",
            passed: invalidStats.length === 0,
            issues,
            durationMs: 0,
          };
        })(),
      );

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
        checks: [...checks, requiredCheck, uniqueIdCheck, statsNumericCheck],
      });
    } else {
      fileResults.push(playersResult);
    }

    // Validate goalies.json
    const { result: goaliesResult, data: goalies } =
      yield* validateJsonArray<WLAGoalie>(
        path.join(seasonDir, "goalies.json"),
        0, // WLA SPA may not return goalies
      );

    if (goalies.length > 0) {
      const requiredCheck = yield* validateRequiredFields(goalies, [
        "id",
        "full_name",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(goalies, "id");

      // Validate stats numeric fields when present
      const statsNumericCheck = yield* Effect.succeed(
        (() => {
          const numericFields = [
            "games_played",
            "wins",
            "losses",
            "ties",
            "goals_against",
            "saves",
            "shots_against",
            "shutouts",
          ] as const;
          const invalidStats: string[] = [];

          for (const goalie of goalies) {
            if (goalie.stats) {
              for (const field of numericFields) {
                const value = goalie.stats[field];
                if (value !== undefined && typeof value !== "number") {
                  invalidStats.push(
                    `${goalie.id}.stats.${field}: ${typeof value}`,
                  );
                }
              }
            }
          }

          const issues: (typeof FileValidationResult.Type)["checks"][number]["issues"] =
            invalidStats.length > 0
              ? [
                  {
                    severity: "error" as const,
                    code: "INVALID_NUMERIC_STATS",
                    message: `Found ${invalidStats.length} non-numeric stat values`,
                    path: "stats",
                    context: { samples: invalidStats.slice(0, 5) },
                  },
                ]
              : [];

          return {
            checkName: "stats_numeric_fields",
            passed: invalidStats.length === 0,
            issues,
            durationMs: 0,
          };
        })(),
      );

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
        checks: [...checks, requiredCheck, uniqueIdCheck, statsNumericCheck],
      });
    } else {
      fileResults.push(goaliesResult);
    }

    // Validate standings.json
    // WLA SPA may not expose standings in raw HTML - min 0
    const { result: standingsResult, data: standings } =
      yield* validateJsonArray<WLAStanding>(
        path.join(seasonDir, "standings.json"),
        0,
      );

    if (standings.length > 0) {
      const requiredCheck = yield* validateRequiredFields(standings, [
        "team_id",
        "wins",
        "losses",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(standings, "team_id");

      // Validate win_pct bounds (0-1)
      const winPctBoundsCheck = yield* Effect.succeed(
        (() => {
          const invalidWinPct: string[] = [];

          for (const standing of standings) {
            const { win_pct, team_id } = standing;
            if (win_pct !== undefined && win_pct !== null) {
              if (typeof win_pct !== "number" || win_pct < 0 || win_pct > 1) {
                invalidWinPct.push(`${team_id}: ${win_pct}`);
              }
            }
          }

          const issues: (typeof FileValidationResult.Type)["checks"][number]["issues"] =
            invalidWinPct.length > 0
              ? [
                  {
                    severity: "error" as const,
                    code: "WIN_PCT_OUT_OF_BOUNDS",
                    message: `Found ${invalidWinPct.length} win_pct values outside valid range (0-1)`,
                    path: "win_pct",
                    context: { samples: invalidWinPct.slice(0, 5) },
                  },
                ]
              : [];

          return {
            checkName: "win_pct_bounds",
            passed: invalidWinPct.length === 0,
            issues,
            durationMs: 0,
          };
        })(),
      );

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
        checks: [...checks, requiredCheck, uniqueIdCheck, winPctBoundsCheck],
      });
    } else {
      fileResults.push(standingsResult);
    }

    // Validate schedule.json (optional - requires --schedule flag during extraction)
    const { result: scheduleResult, data: schedule } =
      yield* validateJsonArray<WLAGame>(
        path.join(seasonDir, "schedule.json"),
        0, // Schedule may be empty for some seasons
        { optional: true },
      );

    if (schedule.length > 0) {
      const requiredCheck = yield* validateRequiredFields(schedule, [
        "id",
        "home_team_id",
        "away_team_id",
      ]);
      const uniqueIdCheck = yield* validateUniqueField(schedule, "id");

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
    const playersWithTeam = players.filter((p: WLAPlayer) => p.team_id !== null);
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

    // goalies.team_id -> teams.id
    const goaliesWithTeam = goalies.filter((g: WLAGoalie) => g.team_id !== null);
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

    // standings.team_id -> teams.id
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

    // schedule.home_team_id -> teams.id
    const gamesWithHomeTeam = schedule.filter((g: WLAGame) => g.home_team_id !== null);
    if (gamesWithHomeTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        gamesWithHomeTeam,
        teams,
        "home_team_id",
        "id",
        `${year}/schedule.json`,
        `${year}/teams.json`,
      );
      crossRefs.push(xref);
    }

    // schedule.away_team_id -> teams.id
    const gamesWithAwayTeam = schedule.filter((g: WLAGame) => g.away_team_id !== null);
    if (gamesWithAwayTeam.length > 0 && teams.length > 0) {
      const xref = yield* crossReference(
        gamesWithAwayTeam,
        teams,
        "away_team_id",
        "id",
        `${year}/schedule.json`,
        `${year}/teams.json`,
      );
      crossRefs.push(xref);
    }
  }

  const report = buildReport("WLA", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(wlaDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
