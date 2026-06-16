import { AuthService } from "@laxdb/core/auth/auth.service";
import type { ClubApiPayload } from "@laxdb/core/club/club.contract";
import { ClubService } from "@laxdb/core/club/club.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { withAdminOrganization, withOrganization } from "../auth/auth";
import { LaxdbApi } from "../definition";

export const ClubHandlers = HttpApiBuilder.group(LaxdbApi, "Club", (handlers) =>
  Effect.gen(function* () {
    const authService = yield* AuthService;
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
      withAdminOrganization(authService, (orgId) =>
        service.deleteTeam({ organizationId: orgId, id: payload.id }),
      );

    const listRoster = (payload: typeof ClubApiPayload.teamScoped.Type) =>
      withOrganization(authService, (orgId) =>
        service.listRoster({ organizationId: orgId, teamId: payload.teamId }),
      );

    const addRosterPlayer = (
      payload: typeof ClubApiPayload.addRosterPlayer.Type,
    ) =>
      withOrganization(authService, (orgId) =>
        service.addRosterPlayer({ organizationId: orgId, ...payload }),
      );

    const updateRosterPlayer = (
      payload: typeof ClubApiPayload.updateRosterPlayer.Type,
    ) =>
      withOrganization(authService, (orgId) =>
        service.updateRosterPlayer({ organizationId: orgId, ...payload }),
      );

    const removeRosterPlayer = (payload: typeof ClubApiPayload.byId.Type) =>
      withOrganization(authService, (orgId) =>
        service.removeRosterPlayer({ organizationId: orgId, id: payload.id }),
      );

    const listRecipients = () =>
      withOrganization(authService, (orgId) =>
        service.listRecipients({ organizationId: orgId }),
      );

    const listRecipientsForTeam = (
      payload: typeof ClubApiPayload.teamScoped.Type,
    ) =>
      withOrganization(authService, (orgId) =>
        service.listRecipientsForTeam({
          organizationId: orgId,
          teamId: payload.teamId,
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
