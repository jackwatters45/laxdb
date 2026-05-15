import type { FineApiPayload } from "@laxdb/core/fine/fine.contract";
import { FineService } from "@laxdb/core/fine/fine.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  withAdminOrganization,
  withAdminSession,
  withOrganization,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

export const FinesHandlers = HttpApiBuilder.group(
  LaxdbApi,
  "Fines",
  (handlers) =>
    Effect.gen(function* () {
      const service = yield* FineService;

      const listMembers = () =>
        withOrganization((orgId) =>
          service.listMembers({ organizationId: orgId }),
        );

      const listTemplates = () =>
        withOrganization((orgId) =>
          service.listTemplates({ organizationId: orgId }),
        );

      const createTemplate = (
        payload: typeof FineApiPayload.createTemplate.Type,
      ) =>
        withAdminOrganization((orgId) =>
          service.createTemplate({ organizationId: orgId, ...payload }),
        );

      const updateTemplate = (
        payload: typeof FineApiPayload.updateTemplate.Type,
      ) =>
        withAdminOrganization((orgId) =>
          service.updateTemplate({ organizationId: orgId, ...payload }),
        );

      const deleteTemplate = (payload: typeof FineApiPayload.fineById.Type) =>
        withAdminOrganization((orgId) =>
          service.deleteTemplate({ organizationId: orgId, id: payload.id }),
        );

      const listFines = () =>
        withOrganization((orgId) => service.list({ organizationId: orgId }));

      const listMemberFines = (
        payload: typeof FineApiPayload.memberFines.Type,
      ) =>
        withOrganization((orgId) =>
          service.listForMember({
            organizationId: orgId,
            memberId: payload.memberId,
          }),
        );

      const issueFine = (payload: typeof FineApiPayload.issueFine.Type) =>
        withAdminSession(({ organizationId: orgId, userId }) =>
          service.issue({
            organizationId: orgId,
            issuedByUserId: userId,
            ...payload,
          }),
        );

      const payFine = (payload: typeof FineApiPayload.fineAction.Type) =>
        withAdminSession(({ organizationId: orgId, userId }) =>
          service.pay({
            organizationId: orgId,
            id: payload.id,
            actorUserId: userId,
          }),
        );

      const forgiveFine = (payload: typeof FineApiPayload.forgiveFine.Type) =>
        withAdminSession(({ organizationId: orgId, userId }) =>
          service.forgive({
            organizationId: orgId,
            id: payload.id,
            actorUserId: userId,
            note: payload.note,
          }),
        );

      const adjustFine = (payload: typeof FineApiPayload.adjustFine.Type) =>
        withAdminSession(({ organizationId: orgId, userId }) =>
          service.adjust({
            organizationId: orgId,
            id: payload.id,
            actorUserId: userId,
            amountCents: payload.amountCents,
            note: payload.note,
          }),
        );

      const listFineEvents = (payload: typeof FineApiPayload.fineById.Type) =>
        withOrganization((orgId) =>
          service.listEvents({ organizationId: orgId, id: payload.id }),
        );

      const listAudit = (payload: typeof FineApiPayload.listAudit.Type) =>
        withOrganization((orgId) =>
          service.listAudit({
            organizationId: orgId,
            limit: payload.limit ?? 100,
          }),
        );

      return handlers
        .handle("listMembers", listMembers)
        .handle("listTemplates", listTemplates)
        .handle("createTemplate", ({ payload }) => createTemplate(payload))
        .handle("updateTemplate", ({ payload }) => updateTemplate(payload))
        .handle("deleteTemplate", ({ payload }) => deleteTemplate(payload))
        .handle("listFines", listFines)
        .handle("listMemberFines", ({ payload }) => listMemberFines(payload))
        .handle("issueFine", ({ payload }) => issueFine(payload))
        .handle("payFine", ({ payload }) => payFine(payload))
        .handle("forgiveFine", ({ payload }) => forgiveFine(payload))
        .handle("adjustFine", ({ payload }) => adjustFine(payload))
        .handle("listFineEvents", ({ payload }) => listFineEvents(payload))
        .handle("listAudit", ({ payload }) => listAudit(payload));
    }),
);
