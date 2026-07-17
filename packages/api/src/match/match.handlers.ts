import type { R2Bucket } from "@cloudflare/workers-types";
import { AuthService } from "@laxdb/core/auth/auth.service";
import { DatabaseError, ValidationError } from "@laxdb/core/error";
import type { MatchApiPayload } from "@laxdb/core/match/match.contract";
import { MatchService } from "@laxdb/core/match/match.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  withAdminOrganization,
  withMemberSession,
  withOrganization,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isR2Bucket = (value: unknown): value is R2Bucket =>
  isRecord(value) &&
  typeof value.put === "function" &&
  typeof value.get === "function" &&
  typeof value.delete === "function";

const matchImagesBucket = Effect.gen(function* () {
  const env = yield* Cloudflare.WorkerEnvironment;
  if (!isRecord(env) || !isR2Bucket(env.STORAGE)) {
    return yield* new DatabaseError({
      domain: "MatchImage",
      message: "R2 binding STORAGE is missing from api worker env",
    });
  }
  return env.STORAGE;
});

const base64Payload = (value: string) => {
  const commaIndex = value.indexOf(",");
  return commaIndex === -1 ? value : value.slice(commaIndex + 1);
};

const decodeBase64Bytes = (value: string) =>
  Effect.try({
    try: () => {
      const binary = globalThis.atob(base64Payload(value));
      return Uint8Array.from(binary, (char) => char.codePointAt(0));
    },
    catch: (cause) =>
      new ValidationError({
        domain: "MatchImage",
        message: "Image data must be valid base64",
        cause,
      }),
  });

export const MatchesHandlers = HttpApiBuilder.group(
  LaxdbApi,
  "Matches",
  (handlers) =>
    Effect.gen(function* () {
      const authService = yield* AuthService;
      const service = yield* MatchService;

      const listFixtures = (
        payload: typeof MatchApiPayload.listFixtures.Type,
      ) =>
        withOrganization(authService, (orgId) =>
          service.listFixtures({ organizationId: orgId, ...payload }),
        );

      const getFixture = (payload: typeof MatchApiPayload.fixtureById.Type) =>
        withOrganization(authService, (orgId) =>
          service.getFixture({ organizationId: orgId, id: payload.id }),
        );

      const syncFixtures = (
        payload: typeof MatchApiPayload.syncFixtures.Type,
      ) =>
        withOrganization(authService, (orgId) =>
          service.syncFixtures({
            organizationId: orgId,
            teamId: payload.teamId,
          }),
        );

      const syncGamedayAssociationSeason = (
        payload: typeof MatchApiPayload.syncGamedayAssociationSeason.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.syncGamedayAssociationSeason(payload),
        );

      const importGamedayTeams = (
        payload: typeof MatchApiPayload.importGamedayTeams.Type,
      ) =>
        withAdminOrganization(authService, (organizationId) =>
          service.importGamedayTeams({ organizationId, ...payload }),
        );

      const listCompetitions = (
        payload: typeof MatchApiPayload.listCompetitions.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.listCompetitions(payload),
        );

      const listGamedayTeams = (
        payload: typeof MatchApiPayload.listGamedayTeams.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.listGamedayTeams(payload),
        );

      const listGamedaySeasons = () =>
        withAdminOrganization(authService, () => service.listGamedaySeasons());

      const listGamedayClubs = (
        payload: typeof MatchApiPayload.listGamedayClubs.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.listGamedayClubs(payload),
        );

      const listCompetitionsForClubs = (
        payload: typeof MatchApiPayload.listCompetitionsForClubs.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.listCompetitionsForClubs(payload),
        );

      const listReports = (payload: typeof MatchApiPayload.listReports.Type) =>
        withOrganization(authService, (orgId) =>
          service.listReports({ organizationId: orgId, ...payload }),
        );

      const submitReport = (
        payload: typeof MatchApiPayload.submitReport.Type,
      ) =>
        withMemberSession(authService, ({ organizationId, userId, userName }) =>
          service.submitReport({
            organizationId,
            submittedByUserId: userId,
            submitterName: userName,
            ...payload,
          }),
        );

      const listMatchImages = (
        payload: typeof MatchApiPayload.listMatchImages.Type,
      ) =>
        withOrganization(authService, (organizationId) =>
          service.listMatchImages({ organizationId, ...payload }),
        );

      const uploadMatchImage = (
        payload: typeof MatchApiPayload.uploadMatchImage.Type,
      ) =>
        withMemberSession(authService, ({ organizationId, userId }) =>
          Effect.gen(function* () {
            const bytes = yield* decodeBase64Bytes(payload.dataBase64);
            const image = yield* service.createMatchImage({
              organizationId,
              fixtureId: payload.fixtureId,
              uploadedByUserId: userId,
              fileName: payload.fileName,
              contentType: payload.contentType,
              sizeBytes: bytes.byteLength,
            });
            const bucket = yield* matchImagesBucket;
            yield* Effect.tryPromise({
              try: () =>
                bucket.put(image.objectKey, bytes, {
                  httpMetadata: { contentType: image.contentType },
                }),
              catch: (cause) =>
                new DatabaseError({
                  domain: "MatchImage",
                  message: "Failed to write image to R2",
                  cause,
                }),
            });
            return image;
          }),
        );

      const deleteMatchImage = (
        payload: typeof MatchApiPayload.deleteMatchImage.Type,
      ) =>
        withMemberSession(authService, ({ organizationId }) =>
          Effect.gen(function* () {
            const image = yield* service.deleteMatchImage({
              organizationId,
              id: payload.id,
            });
            const bucket = yield* matchImagesBucket;
            yield* Effect.tryPromise({
              try: () => bucket.delete(image.objectKey),
              catch: (cause) =>
                new DatabaseError({
                  domain: "MatchImage",
                  message: "Failed to delete image from R2",
                  cause,
                }),
            });
            return image;
          }),
        );

      return handlers
        .handle("listFixtures", ({ payload }) => listFixtures(payload))
        .handle("getFixture", ({ payload }) => getFixture(payload))
        .handle("syncFixtures", ({ payload }) => syncFixtures(payload))
        .handle("syncGamedayAssociationSeason", ({ payload }) =>
          syncGamedayAssociationSeason(payload),
        )
        .handle("importGamedayTeams", ({ payload }) =>
          importGamedayTeams(payload),
        )
        .handle("listCompetitions", ({ payload }) => listCompetitions(payload))
        .handle("listGamedayTeams", ({ payload }) => listGamedayTeams(payload))
        .handle("listGamedaySeasons", listGamedaySeasons)
        .handle("listGamedayClubs", ({ payload }) => listGamedayClubs(payload))
        .handle("listCompetitionsForClubs", ({ payload }) =>
          listCompetitionsForClubs(payload),
        )
        .handle("listReports", ({ payload }) => listReports(payload))
        .handle("submitReport", ({ payload }) => submitReport(payload))
        .handle("listMatchImages", ({ payload }) => listMatchImages(payload))
        .handle("uploadMatchImage", ({ payload }) => uploadMatchImage(payload))
        .handle("deleteMatchImage", ({ payload }) => deleteMatchImage(payload));
    }),
);
