import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { readJsonFile } from "@laxdb/core/util";
import { Effect, Layer } from "effect";

import { ExtractConfigService } from "../extract/extract.config";

import type {
  FileValidationResult,
  CrossReferenceResult,
  ValidationCheckResult,
} from "./validate.schema";
import { errorIssue, infoIssue } from "./validate.schema";
import {
  validateJsonArray,
  validateRequiredFields,
  validateUniqueField,
  crossReference,
  buildReport,
  printReport,
  validateFileExists,
} from "./validate.service";

interface PlayerDetail {
  slug: string;
  officialId: string;
  firstName: string;
  lastName: string;
}

interface CareerStatsPlayer {
  slug: string | null;
  name: string;
  experience: number | null;
  allYears: number[] | null;
  stats: {
    gamesPlayed: number;
    points: number;
    goals: number;
    assists: number;
    groundBalls: number;
    saves: number;
    faceoffsWon: number;
  };
  inPlayerDetails: boolean;
  likelySource: "pll" | "mll_or_retired";
}

interface EventDetailWrapper {
  slug: string;
  year: number;
  detail: {
    id: number;
    homeTeam: { officialId: string } | null;
    awayTeam: { officialId: string } | null;
    playLogs: unknown[] | null;
  };
}

interface TeamDetailWrapper {
  teamId: string;
  year: number;
  detail: {
    officialId: string;
    fullName: string;
    coaches: unknown[];
  };
}

type StatLeadersData = Record<string, Record<string, unknown[]>>;

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

const program = Effect.gen(function* () {
  const config = yield* ExtractConfigService;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const pllDir = path.join(config.outputDir, "pll");
  const startTime = Date.now();

  yield* Effect.log(`\nValidating PLL extracted data...`);
  yield* Effect.log(`Output directory: ${pllDir}\n`);

  const fileResults: (typeof FileValidationResult.Type)[] = [];
  const crossRefs: (typeof CrossReferenceResult.Type)[] = [];

  const { result: playerDetailsResult, data: playerDetails } =
    yield* validateJsonArray<PlayerDetail>(
      path.join(pllDir, "player-details.json"),
      100,
    );

  if (playerDetails.length > 0) {
    const requiredCheck = yield* validateRequiredFields(playerDetails, [
      "slug",
      "officialId",
    ]);
    const uniqueSlugCheck = yield* validateUniqueField(playerDetails, "slug");
    const uniqueIdCheck = yield* validateUniqueField(
      playerDetails,
      "officialId",
    );

    const {
      filePath: fp,
      exists,
      sizeBytes,
      recordCount,
      checks,
    } = playerDetailsResult;
    fileResults.push({
      filePath: fp,
      exists,
      sizeBytes,
      recordCount,
      checks: [...checks, requiredCheck, uniqueSlugCheck, uniqueIdCheck],
    });
  } else {
    fileResults.push(playerDetailsResult);
  }

  const { result: careerStatsResult, data: careerStats } =
    yield* validateJsonArray<CareerStatsPlayer>(
      path.join(pllDir, "career-stats.json"),
      100,
    );

  if (careerStats.length > 0) {
    const requiredCheck = yield* validateRequiredFields(careerStats, [
      "name",
      "stats",
    ]);
    const {
      filePath: csFp,
      exists: csExists,
      sizeBytes: csSizeBytes,
      recordCount: csRecordCount,
      checks: csChecks,
    } = careerStatsResult;
    fileResults.push({
      filePath: csFp,
      exists: csExists,
      sizeBytes: csSizeBytes,
      recordCount: csRecordCount,
      checks: [...csChecks, requiredCheck],
    });

    const pllPlayers = careerStats.filter(
      (p: CareerStatsPlayer) => p.inPlayerDetails,
    );
    const mllPlayers = careerStats.filter(
      (p: CareerStatsPlayer) => !p.inPlayerDetails,
    );
    yield* Effect.log(
      `  Career stats breakdown: ${pllPlayers.length} PLL, ${mllPlayers.length} MLL/retired`,
    );
  } else {
    fileResults.push(careerStatsResult);
  }

  const { result: eventDetailsResult, data: eventDetails } =
    yield* validateJsonArray<EventDetailWrapper>(
      path.join(pllDir, "event-details.json"),
      50,
    );

  if (eventDetails.length > 0) {
    const requiredCheck = yield* validateRequiredFields(eventDetails, [
      "slug",
      "year",
      "detail",
    ]);
    const uniqueSlugCheck = yield* validateUniqueField(eventDetails, "slug");

    const playLogCount = eventDetails.reduce(
      (sum: number, e: EventDetailWrapper) =>
        sum + (e.detail?.playLogs?.length ?? 0),
      0,
    );
    yield* Effect.log(
      `  Event details: ${eventDetails.length} events, ${playLogCount} total play logs`,
    );

    const {
      filePath: edFp,
      exists: edExists,
      sizeBytes: edSizeBytes,
      recordCount: edRecordCount,
      checks: edChecks,
    } = eventDetailsResult;
    fileResults.push({
      filePath: edFp,
      exists: edExists,
      sizeBytes: edSizeBytes,
      recordCount: edRecordCount,
      checks: [...edChecks, requiredCheck, uniqueSlugCheck],
    });
  } else {
    fileResults.push(eventDetailsResult);
  }

  const { result: teamDetailsResult, data: teamDetails } =
    yield* validateJsonArray<TeamDetailWrapper>(
      path.join(pllDir, "team-details.json"),
      20,
    );

  if (teamDetails.length > 0) {
    const requiredCheck = yield* validateRequiredFields(teamDetails, [
      "teamId",
      "year",
      "detail",
    ]);
    const {
      filePath: tdFp,
      exists: tdExists,
      sizeBytes: tdSizeBytes,
      recordCount: tdRecordCount,
      checks: tdChecks,
    } = teamDetailsResult;
    fileResults.push({
      filePath: tdFp,
      exists: tdExists,
      sizeBytes: tdSizeBytes,
      recordCount: tdRecordCount,
      checks: [...tdChecks, requiredCheck],
    });
  } else {
    fileResults.push(teamDetailsResult);
  }

  const statLeadersPath = path.join(pllDir, "stat-leaders.json");
  const statLeadersFileResult = yield* validateFileExists(statLeadersPath);

  if (statLeadersFileResult.exists) {
    const statLeadersData = yield* readJsonFile<StatLeadersData>(
      statLeadersPath,
    ).pipe(Effect.catchAll(() => Effect.succeed({} as StatLeadersData)));

    const yearCount = Object.keys(statLeadersData).length;
    const firstYearData = Object.values(statLeadersData)[0];
    const statTypesPerYear = firstYearData
      ? Object.keys(firstYearData).length
      : 0;

    const checkResult: typeof ValidationCheckResult.Type = {
      checkName: "stat_leaders_structure",
      passed: yearCount > 0,
      issues:
        yearCount === 0
          ? [errorIssue("EMPTY_DATA", "No years found in stat leaders data")]
          : [
              infoIssue(
                "DATA_STRUCTURE",
                `${yearCount} years, ${statTypesPerYear} stat types per year`,
              ),
            ],
      durationMs: 0,
    };

    yield* Effect.log(
      `  Stat leaders: ${yearCount} years, ${statTypesPerYear} stat types each`,
    );

    const {
      filePath: slFp,
      exists: slExists,
      sizeBytes: slSizeBytes,
      checks: slChecks,
    } = statLeadersFileResult;
    fileResults.push({
      filePath: slFp,
      exists: slExists,
      sizeBytes: slSizeBytes,
      recordCount: yearCount,
      checks: [...slChecks, checkResult],
    });
  } else {
    fileResults.push(statLeadersFileResult);
  }

  for (const year of YEARS) {
    const yearDir = path.join(pllDir, String(year));

    const { result: playersResult } = yield* validateJsonArray(
      path.join(yearDir, "players.json"),
      10,
    );
    fileResults.push(playersResult);

    const { result: teamsResult } = yield* validateJsonArray(
      path.join(yearDir, "teams.json"),
      6,
    );
    fileResults.push(teamsResult);
  }

  if (careerStats.length > 0 && playerDetails.length > 0) {
    const careerStatsWithSlugs = careerStats.filter(
      (p: CareerStatsPlayer) => p.slug !== null,
    );
    const xref = yield* crossReference(
      careerStatsWithSlugs,
      playerDetails,
      "slug",
      "slug",
      "career-stats.json",
      "player-details.json",
    );

    crossRefs.push({
      sourceFile: xref.sourceFile,
      targetFile: xref.targetFile,
      sourceField: xref.sourceField,
      targetField: xref.targetField,
      totalSourceRecords: xref.totalSourceRecords,
      matchedRecords: xref.matchedRecords,
      unmatchedRecords: xref.unmatchedRecords,
      unmatchedSamples: xref.unmatchedSamples,
    });
  }

  const report = buildReport("PLL", fileResults, crossRefs, startTime);
  yield* printReport(report);

  const reportPath = path.join(pllDir, "validation-report.json");
  yield* fs.writeFileString(reportPath, JSON.stringify(report, null, 2));
  yield* Effect.log(`Report saved to: ${reportPath}`);

  return report;
});

const MainLayer = Layer.mergeAll(
  ExtractConfigService.Default,
  BunContext.layer,
);

BunRuntime.runMain(program.pipe(Effect.provide(MainLayer)));
