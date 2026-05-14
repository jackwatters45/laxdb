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
