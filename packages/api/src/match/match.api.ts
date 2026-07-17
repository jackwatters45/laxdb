import { EmailDeliveryError } from "@laxdb/core/email/email.error";
import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { GamedayError } from "@laxdb/core/match/gameday";
import {
  MatchApiPayload,
  MatchContract,
} from "@laxdb/core/match/match.contract";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

const MatchErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
  NotFoundError.pipe(HttpApiSchema.status(404)),
  ValidationError.pipe(HttpApiSchema.status(400)),
  DatabaseError.pipe(HttpApiSchema.status(500)),
  ConstraintViolationError.pipe(HttpApiSchema.status(409)),
  GamedayError.pipe(HttpApiSchema.status(502)),
  EmailDeliveryError.pipe(HttpApiSchema.status(502)),
] as const;

const listFixtures = HttpApiEndpoint.post(
  "listFixtures",
  "/api/fixtures/list",
  {
    success: MatchContract.listFixtures.success,
    error: MatchErrors,
    payload: MatchApiPayload.listFixtures,
  },
);

const getFixture = HttpApiEndpoint.post("getFixture", "/api/fixtures/get", {
  success: MatchContract.getFixture.success,
  error: MatchErrors,
  payload: MatchApiPayload.fixtureById,
});

const syncFixtures = HttpApiEndpoint.post(
  "syncFixtures",
  "/api/fixtures/sync",
  {
    success: MatchContract.syncFixtures.success,
    error: MatchErrors,
    payload: MatchApiPayload.syncFixtures,
  },
);

const syncGamedayAssociationSeason = HttpApiEndpoint.post(
  "syncGamedayAssociationSeason",
  "/api/gameday/sync-association-season",
  {
    success: MatchContract.syncGamedayAssociationSeason.success,
    error: MatchErrors,
    payload: MatchApiPayload.syncGamedayAssociationSeason,
  },
);

const importGamedayTeams = HttpApiEndpoint.post(
  "importGamedayTeams",
  "/api/gameday/import-teams",
  {
    success: MatchContract.importGamedayTeams.success,
    error: MatchErrors,
    payload: MatchApiPayload.importGamedayTeams,
  },
);

const listCompetitions = HttpApiEndpoint.post(
  "listCompetitions",
  "/api/gameday/competitions",
  {
    success: MatchContract.listCompetitions.success,
    error: MatchErrors,
    payload: MatchApiPayload.listCompetitions,
  },
);

const listGamedayTeams = HttpApiEndpoint.post(
  "listGamedayTeams",
  "/api/gameday/teams",
  {
    success: MatchContract.listGamedayTeams.success,
    error: MatchErrors,
    payload: MatchApiPayload.listGamedayTeams,
  },
);

const listGamedaySeasons = HttpApiEndpoint.post(
  "listGamedaySeasons",
  "/api/gameday/seasons",
  {
    success: MatchContract.listGamedaySeasons.success,
    error: MatchErrors,
    payload: MatchApiPayload.listGamedaySeasons,
  },
);

const listGamedayClubs = HttpApiEndpoint.post(
  "listGamedayClubs",
  "/api/gameday/clubs",
  {
    success: MatchContract.listGamedayClubs.success,
    error: MatchErrors,
    payload: MatchApiPayload.listGamedayClubs,
  },
);

const listCompetitionsForClubs = HttpApiEndpoint.post(
  "listCompetitionsForClubs",
  "/api/gameday/competitions-for-clubs",
  {
    success: MatchContract.listCompetitionsForClubs.success,
    error: MatchErrors,
    payload: MatchApiPayload.listCompetitionsForClubs,
  },
);

const listReports = HttpApiEndpoint.post("listReports", "/api/reports/list", {
  success: MatchContract.listReports.success,
  error: MatchErrors,
  payload: MatchApiPayload.listReports,
});

const submitReport = HttpApiEndpoint.post(
  "submitReport",
  "/api/reports/submit",
  {
    success: MatchContract.submitReport.success,
    error: MatchErrors,
    payload: MatchApiPayload.submitReport,
  },
);

const listMatchImages = HttpApiEndpoint.post(
  "listMatchImages",
  "/api/match-images/list",
  {
    success: MatchContract.listMatchImages.success,
    error: MatchErrors,
    payload: MatchApiPayload.listMatchImages,
  },
);

const uploadMatchImage = HttpApiEndpoint.post(
  "uploadMatchImage",
  "/api/match-images/upload",
  {
    success: MatchContract.uploadMatchImage.success,
    error: MatchErrors,
    payload: MatchApiPayload.uploadMatchImage,
  },
);

const deleteMatchImage = HttpApiEndpoint.post(
  "deleteMatchImage",
  "/api/match-images/delete",
  {
    success: MatchContract.deleteMatchImage.success,
    error: MatchErrors,
    payload: MatchApiPayload.deleteMatchImage,
  },
);

export const MatchesGroup = HttpApiGroup.make("Matches")
  .add(listFixtures)
  .add(getFixture)
  .add(syncFixtures)
  .add(syncGamedayAssociationSeason)
  .add(importGamedayTeams)
  .add(listCompetitions)
  .add(listGamedayTeams)
  .add(listGamedaySeasons)
  .add(listGamedayClubs)
  .add(listCompetitionsForClubs)
  .add(listReports)
  .add(submitReport)
  .add(listMatchImages)
  .add(uploadMatchImage)
  .add(deleteMatchImage);
