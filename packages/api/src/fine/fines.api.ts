import {
  AuthenticationError,
  AuthorizationError,
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { FineApiPayload, FineContract } from "@laxdb/core/fine/fine.contract";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from "effect/unstable/httpapi";

import { EmptyPayload } from "../shared/payload";

const FinesErrors = [
  AuthenticationError.pipe(HttpApiSchema.status(401)),
  AuthorizationError.pipe(HttpApiSchema.status(403)),
  NotFoundError.pipe(HttpApiSchema.status(404)),
  ValidationError.pipe(HttpApiSchema.status(400)),
  DatabaseError.pipe(HttpApiSchema.status(500)),
  ConstraintViolationError.pipe(HttpApiSchema.status(409)),
] as const;

const listMembers = HttpApiEndpoint.post("listMembers", "/api/members", {
  success: FineContract.listMembers.success,
  error: FinesErrors,
  payload: EmptyPayload,
});

const listTemplates = HttpApiEndpoint.post(
  "listTemplates",
  "/api/fine-templates/list",
  {
    success: FineContract.listTemplates.success,
    error: FinesErrors,
    payload: EmptyPayload,
  },
);

const createTemplate = HttpApiEndpoint.post(
  "createTemplate",
  "/api/fine-templates/create",
  {
    success: FineContract.createTemplate.success,
    error: FinesErrors,
    payload: FineApiPayload.createTemplate,
  },
);

const updateTemplate = HttpApiEndpoint.post(
  "updateTemplate",
  "/api/fine-templates/update",
  {
    success: FineContract.updateTemplate.success,
    error: FinesErrors,
    payload: FineApiPayload.updateTemplate,
  },
);

const deleteTemplate = HttpApiEndpoint.post(
  "deleteTemplate",
  "/api/fine-templates/delete",
  {
    success: FineContract.deleteTemplate.success,
    error: FinesErrors,
    payload: FineApiPayload.fineById,
  },
);

const listFines = HttpApiEndpoint.post("listFines", "/api/fines/list", {
  success: FineContract.list.success,
  error: FinesErrors,
  payload: EmptyPayload,
});

const listMemberFines = HttpApiEndpoint.post(
  "listMemberFines",
  "/api/members/fines",
  {
    success: FineContract.listForMember.success,
    error: FinesErrors,
    payload: FineApiPayload.memberFines,
  },
);

const issueFine = HttpApiEndpoint.post("issueFine", "/api/fines/issue", {
  success: FineContract.issue.success,
  error: FinesErrors,
  payload: FineApiPayload.issueFine,
});

const payFine = HttpApiEndpoint.post("payFine", "/api/fines/pay", {
  success: FineContract.pay.success,
  error: FinesErrors,
  payload: FineApiPayload.fineAction,
});

const forgiveFine = HttpApiEndpoint.post("forgiveFine", "/api/fines/forgive", {
  success: FineContract.forgive.success,
  error: FinesErrors,
  payload: FineApiPayload.forgiveFine,
});

const adjustFine = HttpApiEndpoint.post("adjustFine", "/api/fines/adjust", {
  success: FineContract.adjust.success,
  error: FinesErrors,
  payload: FineApiPayload.adjustFine,
});

const listFineEvents = HttpApiEndpoint.post(
  "listFineEvents",
  "/api/fines/events",
  {
    success: FineContract.listEvents.success,
    error: FinesErrors,
    payload: FineApiPayload.fineById,
  },
);

const listAudit = HttpApiEndpoint.post("listAudit", "/api/audit", {
  success: FineContract.listAudit.success,
  error: FinesErrors,
  payload: FineApiPayload.listAudit,
});

export const FinesGroup = HttpApiGroup.make("Fines")
  .add(listMembers)
  .add(listTemplates)
  .add(createTemplate)
  .add(updateTemplate)
  .add(deleteTemplate)
  .add(listFines)
  .add(listMemberFines)
  .add(issueFine)
  .add(payFine)
  .add(forgiveFine)
  .add(adjustFine)
  .add(listFineEvents)
  .add(listAudit);
