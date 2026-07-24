import { AuthService } from "@laxdb/core/auth/auth.service";
import type { ClubApiPayload } from "@laxdb/core/club/club.contract";
import { ClubService } from "@laxdb/core/club/club.service";
import { MatchService } from "@laxdb/core/match/match.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  requireTeamManager,
  withAdminOrganization,
  withMemberSession,
  withOrganization,
} from "../auth/auth";
import { LaxdbApi } from "../definition";
import { deleteMatchImageObjects } from "../match/match-images";

export const ClubHandlers = HttpApiBuilder.group(LaxdbApi, "Club", (handlers) =>
  Effect.gen(function* () {
    const authService = yield* AuthService;
    const matchService = yield* MatchService;
    const service = yield* ClubService;

    const listTeams = () =>
      withOrganization(authService, (orgId) =>
        service.listTeams({ organizationId: orgId }),
      );

    const createTeam = (payload: typeof ClubApiPayload.createTeam.Type) =>
      withAdminOrganization(authService, (orgId) =>
        service.createTeam({ organizationId: orgId, ...payload }),
      );

    const updateTeam = (payload: typeof ClubApiPayload.updateTeam.Type) =>
      withAdminOrganization(authService, (orgId) =>
        service.updateTeam({ organizationId: orgId, ...payload }),
      );

    const deleteTeam = (payload: typeof ClubApiPayload.byId.Type) =>
      withAdminOrganization(authService, (organizationId) =>
        Effect.gen(function* () {
          const fixtures = yield* matchService.listFixtures({
            organizationId,
            teamId: payload.id,
          });
          const imageGroups = yield* Effect.forEach(
            fixtures,
            (fixture) =>
              matchService.listMatchImages({
                organizationId,
                fixtureId: fixture.id,
              }),
            { concurrency: 4 },
          );
          // Remove objects before cascading metadata. R2 deletion is
          // idempotent, so a later database failure remains retryable.
          yield* deleteMatchImageObjects(
            imageGroups.flat().map((image) => image.objectKey),
          );
          return yield* service.deleteTeam({
            organizationId,
            id: payload.id,
          });
        }),
      );

    const authorizeTeam = (
      session: Parameters<typeof requireTeamManager>[0],
      teamId: string,
    ) =>
      Effect.gen(function* () {
        const team = yield* service.getTeam({
          organizationId: session.organizationId,
          id: teamId,
        });
        yield* requireTeamManager(session, team.coachMemberId);
      });

    const listRoster = (payload: typeof ClubApiPayload.teamScoped.Type) =>
      withMemberSession(authService, (session) =>
        Effect.gen(function* () {
          yield* authorizeTeam(session, payload.teamId);
          return yield* service.listRoster({
            organizationId: session.organizationId,
            teamId: payload.teamId,
          });
        }),
      );

    const addRosterPlayer = (
      payload: typeof ClubApiPayload.addRosterPlayer.Type,
    ) =>
      withMemberSession(authService, (session) =>
        Effect.gen(function* () {
          yield* authorizeTeam(session, payload.teamId);
          return yield* service.addRosterPlayer({
            organizationId: session.organizationId,
            ...payload,
          });
        }),
      );

    const updateRosterPlayer = (
      payload: typeof ClubApiPayload.updateRosterPlayer.Type,
    ) =>
      withMemberSession(authService, (session) =>
        Effect.gen(function* () {
          const player = yield* service.getRosterPlayer({
            organizationId: session.organizationId,
            id: payload.id,
          });
          yield* authorizeTeam(session, player.teamId);
          return yield* service.updateRosterPlayer({
            organizationId: session.organizationId,
            ...payload,
          });
        }),
      );

    const removeRosterPlayer = (payload: typeof ClubApiPayload.byId.Type) =>
      withMemberSession(authService, (session) =>
        Effect.gen(function* () {
          const player = yield* service.getRosterPlayer({
            organizationId: session.organizationId,
            id: payload.id,
          });
          yield* authorizeTeam(session, player.teamId);
          return yield* service.removeRosterPlayer({
            organizationId: session.organizationId,
            id: payload.id,
          });
        }),
      );

    const listRecipients = () =>
      withAdminOrganization(authService, (organizationId) =>
        service.listRecipients({ organizationId }),
      );

    const listRecipientsForTeam = (
      payload: typeof ClubApiPayload.teamScoped.Type,
    ) =>
      withMemberSession(authService, (session) =>
        Effect.gen(function* () {
          yield* authorizeTeam(session, payload.teamId);
          return yield* service.listRecipientsForTeam({
            organizationId: session.organizationId,
            teamId: payload.teamId,
          });
        }),
      );

    const addRecipient = (payload: typeof ClubApiPayload.addRecipient.Type) =>
      withAdminOrganization(authService, (orgId) =>
        service.addRecipient({ organizationId: orgId, ...payload }),
      );

    const removeRecipient = (payload: typeof ClubApiPayload.byId.Type) =>
      withAdminOrganization(authService, (orgId) =>
        service.removeRecipient({ organizationId: orgId, id: payload.id }),
      );

    return handlers
      .handle("listTeams", listTeams)
      .handle("createTeam", ({ payload }) => createTeam(payload))
      .handle("updateTeam", ({ payload }) => updateTeam(payload))
      .handle("deleteTeam", ({ payload }) => deleteTeam(payload))
      .handle("listRoster", ({ payload }) => listRoster(payload))
      .handle("addRosterPlayer", ({ payload }) => addRosterPlayer(payload))
      .handle("updateRosterPlayer", ({ payload }) =>
        updateRosterPlayer(payload),
      )
      .handle("removeRosterPlayer", ({ payload }) =>
        removeRosterPlayer(payload),
      )
      .handle("listRecipients", listRecipients)
      .handle("listRecipientsForTeam", ({ payload }) =>
        listRecipientsForTeam(payload),
      )
      .handle("addRecipient", ({ payload }) => addRecipient(payload))
      .handle("removeRecipient", ({ payload }) => removeRecipient(payload));
  }),
);
