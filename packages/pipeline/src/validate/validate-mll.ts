import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { ExtractConfigService } from "../extract/extract.config";
import type {
  MLLTeam,
  MLLPlayer,
  MLLGoalie,
  MLLStanding,
  MLLStatLeader,
  MLLGame,
} from "../mll/mll.schema";

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

// MLL years: 2001-2020
const MLL_YEARS = Array.from({ length: 20 }, (_, i) => 2001 + i);

/** Schedule coverage stats for a single year */
interface YearScheduleCoverage {
  year: number;
  teamCount: number;
  expectedGames: number;
  actualGames: number;
  coveragePct: number;
}

/** Calculate expected games based on team count (MLL format) */
const getExpectedGames = (teamCount: number): number => {
  // MLL: ~12 reg season games per team + 3 playoff games
  const regSeasonGames = Math.floor((teamCount * 12) / 2);
  const playoffGames = 3;
  return regSeasonGames + playoffGames;
};

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
  const scheduleCoverage: YearScheduleCoverage[] = [];

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

    // Track schedule coverage for this year
    const teamCount = teams.length > 0 ? teams.length : 6; // Default to 6 if no teams
    const expectedGames = getExpectedGames(teamCount);

    if (scheduleFileResult.exists) {
      const { result: scheduleResult, data: games } =
        yield* validateJsonArray<MLLGame>(schedulePath, 0);

      // Record coverage statistics
      const coveragePct =
        expectedGames > 0
          ? Math.round((games.length / expectedGames) * 100)
          : 0;
      scheduleCoverage.push({
        year,
        teamCount,
        expectedGames,
        actualGames: games.length,
        coveragePct,
      });

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

        // Cross-reference: schedule.home_team_id -> teams.id
        const gamesWithHomeTeam = games.filter(
          (g: MLLGame) => g.home_team_id !== null,
        );
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

        // Cross-reference: schedule.away_team_id -> teams.id
        const gamesWithAwayTeam = games.filter(
          (g: MLLGame) => g.away_team_id !== null,
        );
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
      } else {
        fileResults.push(scheduleResult);
      }
    } else {
      // No schedule file - record zero coverage
      scheduleCoverage.push({
        year,
        teamCount,
        expectedGames,
        actualGames: 0,
        coveragePct: 0,
      });
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
    const playersWithTeam = players.filter(
      (p: MLLPlayer) => p.team_id !== null,
    );
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
    const goaliesWithTeam = goalies.filter(
      (g: MLLGoalie) => g.team_id !== null,
    );
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

  // Print schedule coverage statistics
  yield* Effect.log(`\nSCHEDULE COVERAGE (from Wayback Machine):`);
  yield* Effect.log("=".repeat(70));

  const totalExpected = scheduleCoverage.reduce(
    (sum, c) => sum + c.expectedGames,
    0,
  );
  const totalActual = scheduleCoverage.reduce(
    (sum, c) => sum + c.actualGames,
    0,
  );
  const yearsWithData = scheduleCoverage.filter(
    (c) => c.actualGames > 0,
  ).length;
  const overallCoverage =
    totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

  yield* Effect.log(`\nSummary:`);
  yield* Effect.log(
    `  Years with schedule data: ${yearsWithData}/${MLL_YEARS.length}`,
  );
  yield* Effect.log(
    `  Total games found: ${totalActual}/${totalExpected} expected`,
  );
  yield* Effect.log(`  Overall coverage: ${overallCoverage}%`);

  yield* Effect.log(`\nBy Year:`);
  for (const cov of scheduleCoverage) {
    const status =
      cov.coveragePct >= 80 ? "[OK]" : cov.coveragePct > 0 ? "[!!]" : "[--]";
    yield* Effect.log(
      `  ${status} ${cov.year}: ${cov.actualGames}/${cov.expectedGames} games (${cov.coveragePct}%)`,
    );
  }
  yield* Effect.log("");

  // Build extended report with schedule coverage
  // Extract report properties explicitly to avoid spreading a class instance
  const extendedReport = {
    source: report.source,
    timestamp: report.timestamp,
    durationMs: report.durationMs,
    summary: report.summary,
    files: report.files,
    crossReferences: report.crossReferences,
    overallValid: report.overallValid,
    scheduleCoverage: {
      summary: {
        yearsWithData,
        totalYears: MLL_YEARS.length,
        totalExpectedGames: totalExpected,
        totalActualGames: totalActual,
        overallCoveragePct: overallCoverage,
      },
      byYear: scheduleCoverage,
    },
  };

  const reportPath = path.join(mllDir, "validation-report.json");
  yield* fs.writeFileString(
    reportPath,
    JSON.stringify(extendedReport, null, 2),
  );
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return extendedReport;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
