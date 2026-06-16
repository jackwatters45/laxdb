import { AuthService } from "@laxdb/core/auth/auth.service";
import type { MatchApiPayload } from "@laxdb/core/match/match.contract";
import { MatchService } from "@laxdb/core/match/match.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  withAdminOrganization,
  withMemberSession,
  withOrganization,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

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

      const listCompetitions = (
        payload: typeof MatchApiPayload.listCompetitions.Type,
      ) =>
        withAdminOrganization(authService, () =>
          service.listCompetitions(payload),
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

      return handlers
        .handle("listFixtures", ({ payload }) => listFixtures(payload))
        .handle("getFixture", ({ payload }) => getFixture(payload))
        .handle("syncFixtures", ({ payload }) => syncFixtures(payload))
        .handle("listCompetitions", ({ payload }) => listCompetitions(payload))
        .handle("listReports", ({ payload }) => listReports(payload))
        .handle("submitReport", ({ payload }) => submitReport(payload));
    }),
);
