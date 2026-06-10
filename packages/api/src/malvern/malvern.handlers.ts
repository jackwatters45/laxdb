import { AuthService } from "@laxdb/core/auth/auth.service";
import { ValidationError } from "@laxdb/core/error";
import type { MalvernApiPayload } from "@laxdb/core/malvern/malvern.contract";
import { MalvernService } from "@laxdb/core/malvern/malvern.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  currentSession,
  organizationId,
  withAdminOrganization,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

const fetchFixtureSource = (sourceUrl: string) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(sourceUrl, {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "user-agent":
            "Mozilla/5.0 (compatible; MalvernLacrosseOps/0.1; +https://laxdb.io)",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Lacrosse Victoria/GameDay returned ${response.status} ${response.statusText}`,
        );
      }
      return response.text();
    },
    catch: (cause) =>
      new ValidationError({
        domain: "MalvernFixtureImport",
        message:
          "Unable to fetch fixtures from the Lacrosse Victoria/GameDay URL",
        cause,
      }),
  });

export const MalvernHandlers = HttpApiBuilder.group(
  LaxdbApi,
  "Malvern",
  (handlers) =>
    Effect.gen(function* () {
      const authService = yield* AuthService;
      const service = yield* MalvernService;

      const listTeams = () =>
        Effect.gen(function* () {
          const session = yield* currentSession(authService);
          const orgId = yield* organizationId(session);
          const includeAll =
            session.memberRole === "owner" || session.memberRole === "admin";
          return yield* service.listTeams({
            organizationId: orgId,
            viewerUserId: session.userId,
            includeAll,
          });
        });

      const getTeam = (payload: typeof MalvernApiPayload.teamScoped.Type) =>
        Effect.gen(function* () {
          const session = yield* currentSession(authService);
          const orgId = yield* organizationId(session);
          return yield* service.getTeam({
            organizationId: orgId,
            teamPublicId: payload.teamPublicId,
          });
        });

      const createTeam = (payload: typeof MalvernApiPayload.createTeam.Type) =>
        withAdminOrganization(authService, (orgId) =>
          service.createTeam({ organizationId: orgId, ...payload }),
        );

      const updateTeam = (payload: typeof MalvernApiPayload.updateTeam.Type) =>
        withAdminOrganization(authService, (orgId) =>
          service.updateTeam({ organizationId: orgId, ...payload }),
        );

      const assignCoach = (
        payload: typeof MalvernApiPayload.assignCoach.Type,
      ) =>
        withAdminOrganization(authService, (orgId) =>
          service.assignCoach({ organizationId: orgId, ...payload }),
        );

      const listCoaches = (payload: typeof MalvernApiPayload.teamScoped.Type) =>
        withAdminOrganization(authService, (orgId) =>
          service.listCoaches({
            organizationId: orgId,
            teamPublicId: payload.teamPublicId,
          }),
        );

      const listPlayers = (payload: typeof MalvernApiPayload.teamScoped.Type) =>
        Effect.gen(function* () {
          const session = yield* currentSession(authService);
          const orgId = yield* organizationId(session);
          return yield* service.listPlayers({
            organizationId: orgId,
            teamPublicId: payload.teamPublicId,
          });
        });

      const createPlayer = (
        payload: typeof MalvernApiPayload.createPlayer.Type,
      ) =>
        withAdminOrganization(authService, (orgId) =>
          service.createPlayer({ organizationId: orgId, ...payload }),
        );

      const updatePlayer = (
        payload: typeof MalvernApiPayload.updatePlayer.Type,
      ) =>
        withAdminOrganization(authService, (orgId) =>
          service.updatePlayer({ organizationId: orgId, ...payload }),
        );

      const listFixtures = (
        payload: typeof MalvernApiPayload.teamScoped.Type,
      ) =>
        Effect.gen(function* () {
          const session = yield* currentSession(authService);
          const orgId = yield* organizationId(session);
          return yield* service.listFixtures({
            organizationId: orgId,
            teamPublicId: payload.teamPublicId,
          });
        });

      const syncFixtures = (
        payload: typeof MalvernApiPayload.syncFixtures.Type,
      ) =>
        withAdminOrganization(authService, (orgId) =>
          Effect.gen(function* () {
            const team = yield* service.getTeam({
              organizationId: orgId,
              teamPublicId: payload.teamPublicId,
            });
            const sourceUrl = payload.sourceUrl ?? team.sourceUrl;
            if (sourceUrl === null) {
              return yield* Effect.fail(
                new ValidationError({
                  domain: "MalvernFixtureImport",
                  message: "Add a Lacrosse Victoria/GameDay fixtures URL first",
                }),
              );
            }
            const sourceText = yield* fetchFixtureSource(sourceUrl);
            return yield* service.importFixtures({
              organizationId: orgId,
              teamPublicId: payload.teamPublicId,
              sourceUrl,
              sourceText,
            });
          }),
        );

      const submitTopThree = (
        payload: typeof MalvernApiPayload.submitTopThree.Type,
      ) =>
        Effect.gen(function* () {
          const session = yield* currentSession(authService);
          const orgId = yield* organizationId(session);
          return yield* service.submitTopThree({
            organizationId: orgId,
            submittedByUserId: session.userId,
            ...payload,
          });
        });

      const listSubmissions = (
        payload: typeof MalvernApiPayload.listSubmissions.Type,
      ) =>
        withAdminOrganization(authService, (orgId) =>
          service.listSubmissions({ organizationId: orgId, ...payload }),
        );

      return handlers
        .handle("listTeams", listTeams)
        .handle("getTeam", ({ payload }) => getTeam(payload))
        .handle("createTeam", ({ payload }) => createTeam(payload))
        .handle("updateTeam", ({ payload }) => updateTeam(payload))
        .handle("assignCoach", ({ payload }) => assignCoach(payload))
        .handle("listCoaches", ({ payload }) => listCoaches(payload))
        .handle("listPlayers", ({ payload }) => listPlayers(payload))
        .handle("createPlayer", ({ payload }) => createPlayer(payload))
        .handle("updatePlayer", ({ payload }) => updatePlayer(payload))
        .handle("listFixtures", ({ payload }) => listFixtures(payload))
        .handle("syncFixtures", ({ payload }) => syncFixtures(payload))
        .handle("submitTopThree", ({ payload }) => submitTopThree(payload))
        .handle("listSubmissions", ({ payload }) => listSubmissions(payload));
    }),
);
