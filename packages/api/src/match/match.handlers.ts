import { AuthService } from "@laxdb/core/auth/auth.service";
import { ClubService } from "@laxdb/core/club/club.service";
import { DatabaseError, ValidationError } from "@laxdb/core/error";
import type { MatchApiPayload } from "@laxdb/core/match/match.contract";
import { MatchService } from "@laxdb/core/match/match.service";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  requireTeamManager,
  withAdminOrganization,
  withMemberSession,
  type MemberSessionContext,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

import { matchImagesBucket } from "./match-images";

const base64Payload = (value: string) => {
  const commaIndex = value.indexOf(",");
  return commaIndex === -1 ? value : value.slice(commaIndex + 1);
};

const decodeBase64Bytes = (value: string) =>
  Effect.try({
    try: () => {
      const binary = globalThis.atob(base64Payload(value));
      return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
    },
    catch: (cause) =>
      new ValidationError({
        domain: "MatchImage",
        message: "Image data must be valid base64",
        cause,
      }),
  });

const bytesMatchContentType = (
  bytes: Uint8Array,
  contentType: (typeof MatchApiPayload.uploadMatchImage.Type)["contentType"],
) => {
  switch (contentType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case "image/webp":
      return (
        String.fromCodePoint(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCodePoint(...bytes.slice(8, 12)) === "WEBP"
      );
    case "image/gif": {
      const signature = String.fromCodePoint(...bytes.slice(0, 6));
      return signature === "GIF87a" || signature === "GIF89a";
    }
  }
};

const validateImageBytes = (
  bytes: Uint8Array,
  contentType: (typeof MatchApiPayload.uploadMatchImage.Type)["contentType"],
) =>
  bytesMatchContentType(bytes, contentType)
    ? Effect.void
    : Effect.fail(
        new ValidationError({
          domain: "MatchImage",
          message: "Image bytes do not match the declared content type",
        }),
      );

export const MatchesHandlers = HttpApiBuilder.group(
  LaxdbApi,
  "Matches",
  (handlers) =>
    Effect.gen(function* () {
      const authService = yield* AuthService;
      const clubService = yield* ClubService;
      const service = yield* MatchService;

      const authorizeTeam = (session: MemberSessionContext, teamId: string) =>
        Effect.gen(function* () {
          const team = yield* clubService.getTeam({
            organizationId: session.organizationId,
            id: teamId,
          });
          yield* requireTeamManager(session, team.coachMemberId);
        });

      const authorizeFixture = (
        session: MemberSessionContext,
        fixtureId: string,
      ) =>
        Effect.gen(function* () {
          const fixture = yield* service.getFixture({
            organizationId: session.organizationId,
            id: fixtureId,
          });
          yield* authorizeTeam(session, fixture.teamId);
          return fixture;
        });

      const listFixtures = (
        payload: typeof MatchApiPayload.listFixtures.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            if (payload.teamId === undefined) {
              yield* requireTeamManager(session, null);
            } else {
              yield* authorizeTeam(session, payload.teamId);
            }
            return yield* service.listFixtures({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      const getFixture = (payload: typeof MatchApiPayload.fixtureById.Type) =>
        withMemberSession(authService, (session) =>
          authorizeFixture(session, payload.id),
        );

      const syncFixtures = (
        payload: typeof MatchApiPayload.syncFixtures.Type,
      ) =>
        withAdminOrganization(authService, (organizationId) =>
          service.syncFixtures({
            organizationId,
            teamId: payload.teamId,
          }),
        );

      const syncGamedayRoster = (
        payload: typeof MatchApiPayload.syncGamedayRoster.Type,
      ) =>
        withAdminOrganization(authService, (organizationId) =>
          service.syncGamedayRoster({
            organizationId,
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
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            if (payload.teamId === undefined) {
              yield* requireTeamManager(session, null);
            } else {
              yield* authorizeTeam(session, payload.teamId);
            }
            return yield* service.listReports({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      const submitReport = (
        payload: typeof MatchApiPayload.submitReport.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeFixture(session, payload.fixtureId);
            return yield* service.submitReport({
              organizationId: session.organizationId,
              submittedByUserId: session.userId,
              submitterName: session.userName,
              ...payload,
            });
          }),
        );

      const listMatchImages = (
        payload: typeof MatchApiPayload.listMatchImages.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            if (payload.fixtureId !== undefined) {
              yield* authorizeFixture(session, payload.fixtureId);
            } else if (payload.teamId !== undefined) {
              yield* authorizeTeam(session, payload.teamId);
            } else {
              yield* requireTeamManager(session, null);
            }
            return yield* service.listMatchImages({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      const uploadMatchImage = (
        payload: typeof MatchApiPayload.uploadMatchImage.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            const { organizationId, userId } = session;
            yield* authorizeFixture(session, payload.fixtureId);
            const bytes = yield* decodeBase64Bytes(payload.dataBase64);
            yield* validateImageBytes(bytes, payload.contentType);
            // Resolve the binding before inserting metadata so a missing R2
            // binding cannot create a broken database row.
            const bucket = yield* matchImagesBucket;
            const image = yield* service.createMatchImage({
              organizationId,
              fixtureId: payload.fixtureId,
              uploadedByUserId: userId,
              fileName: payload.fileName,
              contentType: payload.contentType,
              sizeBytes: bytes.byteLength,
            });
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
            }).pipe(
              Effect.catchTag("DatabaseError", (error) =>
                service
                  .deleteMatchImage({ organizationId, id: image.id })
                  .pipe(Effect.flatMap(() => Effect.fail(error))),
              ),
            );
            return image;
          }),
        );

      const deleteMatchImage = (
        payload: typeof MatchApiPayload.deleteMatchImage.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            const image = yield* service.getMatchImage({
              organizationId: session.organizationId,
              id: payload.id,
            });
            yield* authorizeFixture(session, image.fixtureId);
            const bucket = yield* matchImagesBucket;
            // Delete R2 first. R2 deletion is idempotent, so a later database
            // failure leaves the operation safely retryable.
            yield* Effect.tryPromise({
              try: () => bucket.delete(image.objectKey),
              catch: (cause) =>
                new DatabaseError({
                  domain: "MatchImage",
                  message: "Failed to delete image from R2",
                  cause,
                }),
            });
            return yield* service.deleteMatchImage({
              organizationId: session.organizationId,
              id: payload.id,
            });
          }),
        );

      return handlers
        .handle("listFixtures", ({ payload }) => listFixtures(payload))
        .handle("getFixture", ({ payload }) => getFixture(payload))
        .handle("syncFixtures", ({ payload }) => syncFixtures(payload))
        .handle("syncGamedayRoster", ({ payload }) =>
          syncGamedayRoster(payload),
        )
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
