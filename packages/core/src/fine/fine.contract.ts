import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { Schema } from "effect";

import {
  AdjustFineInput,
  ApplyFineDoublingsInput,
  ApplyFineDoublingsResult,
  CreateFineTemplateInput,
  DeleteFineTemplateInput,
  Fine,
  FineActionInput,
  FineAuditEntry,
  FineByIdInput,
  FineEvent,
  FineMember,
  FineTemplate,
  IssueFineInput,
  ListAuditInput,
  MemberFinesInput,
  OrganizationScopedInput,
  UpdateFineTemplateInput,
} from "./fine.schema";

export const FineErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const FineApiPayload = {
  createTemplate: Schema.Struct({
    label: Schema.String,
    amountCents: Schema.Number,
  }),
  updateTemplate: Schema.Struct({
    id: Schema.String,
    label: Schema.optional(Schema.String),
    amountCents: Schema.optional(Schema.Number),
  }),
  fineAction: Schema.Struct({ id: Schema.String }),
  forgiveFine: Schema.Struct({
    id: Schema.String,
    note: Schema.NullOr(Schema.String),
  }),
  adjustFine: Schema.Struct({
    id: Schema.String,
    amountCents: Schema.Number,
    note: Schema.NullOr(Schema.String),
  }),
  listAudit: Schema.Struct({
    limit: Schema.optional(Schema.Number),
  }),
  memberFines: Schema.Struct({ memberId: Schema.String }),
  issueFine: Schema.Struct({
    memberId: Schema.String,
    templateId: Schema.optional(Schema.NullOr(Schema.String)),
    reason: Schema.optional(Schema.NullOr(Schema.String)),
    amountCents: Schema.optional(Schema.Number),
    dueAt: Schema.optional(Schema.DateFromString),
  }),
  fineById: Schema.Struct({ id: Schema.String }),
} as const;

export const FineContract = {
  list: {
    success: Schema.Array(Fine),
    error: FineErrors,
    payload: OrganizationScopedInput,
  },
  listForMember: {
    success: Schema.Array(Fine),
    error: FineErrors,
    payload: MemberFinesInput,
  },
  get: {
    success: Fine,
    error: FineErrors,
    payload: FineByIdInput,
  },
  listTemplates: {
    success: Schema.Array(FineTemplate),
    error: FineErrors,
    payload: OrganizationScopedInput,
  },
  createTemplate: {
    success: FineTemplate,
    error: FineErrors,
    payload: CreateFineTemplateInput,
  },
  updateTemplate: {
    success: FineTemplate,
    error: FineErrors,
    payload: UpdateFineTemplateInput,
  },
  deleteTemplate: {
    success: FineTemplate,
    error: FineErrors,
    payload: DeleteFineTemplateInput,
  },
  listMembers: {
    success: Schema.Array(FineMember),
    error: FineErrors,
    payload: OrganizationScopedInput,
  },
  issue: {
    success: Fine,
    error: FineErrors,
    payload: IssueFineInput,
  },
  pay: {
    success: Fine,
    error: FineErrors,
    payload: FineActionInput,
  },
  forgive: {
    success: Fine,
    error: FineErrors,
    payload: FineActionInput,
  },
  adjust: {
    success: Fine,
    error: FineErrors,
    payload: AdjustFineInput,
  },
  listEvents: {
    success: Schema.Array(FineEvent),
    error: FineErrors,
    payload: FineByIdInput,
  },
  listAudit: {
    success: Schema.Array(FineAuditEntry),
    error: FineErrors,
    payload: ListAuditInput,
  },
  applyDoublings: {
    success: ApplyFineDoublingsResult,
    error: FineErrors,
    payload: ApplyFineDoublingsInput,
  },
} as const;
