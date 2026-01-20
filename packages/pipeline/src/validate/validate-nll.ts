import { FileSystem, Path } from "@effect/platform";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { ExtractConfigService } from "../extract/extract.config";
import type {
  NLLTeam,
  NLLPlayer,
  NLLStanding,
  NLLMatch,
} from "../nll/nll.schema";

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

  // Validate standings.json
  const { result: standingsResult, data: standings } =
    yield* validateJsonArray<NLLStanding>(
      path.join(seasonDir, "standings.json"),
      1,
    );

  if (standings.length > 0) {
    const requiredCheck = yield* validateRequiredFields(standings, [
      "team_id",
      "wins",
      "losses",
    ]);
    const uniqueIdCheck = yield* validateUniqueField(standings, "team_id");

    const {
      filePath: sFp,
      exists: sExists,
      sizeBytes: sSizeBytes,
      recordCount: sRecordCount,
      checks: sChecks,
    } = standingsResult;
    fileResults.push({
      filePath: sFp,
      exists: sExists,
      sizeBytes: sSizeBytes,
      recordCount: sRecordCount,
      checks: [...sChecks, requiredCheck, uniqueIdCheck],
    });
  } else {
    fileResults.push(standingsResult);
  }

  // Validate schedule.json
  const { result: scheduleResult, data: schedule } =
    yield* validateJsonArray<NLLMatch>(
      path.join(seasonDir, "schedule.json"),
      1,
    );

  if (schedule.length > 0) {
    const requiredCheck = yield* validateRequiredFields(schedule, [
      "id",
      "date",
      "status",
    ]);
    const uniqueIdCheck = yield* validateUniqueField(schedule, "id");

    const {
      filePath: schFp,
      exists: schExists,
      sizeBytes: schSizeBytes,
      recordCount: schRecordCount,
      checks: schChecks,
    } = scheduleResult;
    fileResults.push({
      filePath: schFp,
      exists: schExists,
      sizeBytes: schSizeBytes,
      recordCount: schRecordCount,
      checks: [...schChecks, requiredCheck, uniqueIdCheck],
    });
  } else {
    fileResults.push(scheduleResult);
  }

  // Cross-reference validations
  if (teams.length > 0 && players.length > 0) {
    const playersToTeams = yield* crossReference(
      players,
      teams,
      "team_id",
      "id",
      path.join(seasonDir, "players.json"),
      path.join(seasonDir, "teams.json"),
    );
    crossRefs.push(playersToTeams);
  }

  if (teams.length > 0 && standings.length > 0) {
    const standingsToTeams = yield* crossReference(
      standings,
      teams,
      "team_id",
      "id",
      path.join(seasonDir, "standings.json"),
      path.join(seasonDir, "teams.json"),
    );
    crossRefs.push(standingsToTeams);
  }

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
