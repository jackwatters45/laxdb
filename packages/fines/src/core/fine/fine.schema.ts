import { Schema } from "effect";

import { Role } from "../auth/schema";

export const FineStatus = Schema.Literals(["unpaid", "paid", "forgiven"]);
export type FineStatus = typeof FineStatus.Type;

export const FineEventKind = Schema.Literals([
  "issued",
  "paid",
  "doubled",
  "forgiven",
  "adjusted",
]);
export type FineEventKind = typeof FineEventKind.Type;

export const Id = Schema.String.check(Schema.isMinLength(1));
export const NullableId = Schema.NullOr(Id);

export const MoneyCents = Schema.Number.check(
  Schema.isInt({ message: "Amount must be a whole number of cents" }),
  Schema.isGreaterThanOrEqualTo(0, { message: "Amount cannot be negative" }),
);

export const PositiveLimit = Schema.Number.check(
  Schema.isInt({ message: "Limit must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(1, { message: "Limit must be at least 1" }),
  Schema.isLessThanOrEqualTo(500, { message: "Limit must be 500 or less" }),
);

export class Fine extends Schema.Class<Fine>("Fine")({
  id: Id,
  organizationId: Id,
  memberId: Id,
  templateId: NullableId,
  reason: Schema.String,
  originalAmountCents: MoneyCents,
  amountCents: MoneyCents,
  status: FineStatus,
  issuedAt: Schema.Date,
  dueAt: Schema.Date,
  paidAt: Schema.NullOr(Schema.Date),
  issuedByUserId: NullableId,
}) {}

export class FineTemplate extends Schema.Class<FineTemplate>("FineTemplate")({
  id: Id,
  organizationId: Id,
  label: Schema.String,
  amountCents: MoneyCents,
  createdAt: Schema.Date,
}) {}

export class FineEvent extends Schema.Class<FineEvent>("FineEvent")({
  id: Id,
  fineId: Id,
  kind: FineEventKind,
  amountCents: MoneyCents,
  deltaCents: Schema.Number.check(
    Schema.isInt({ message: "Delta must be a whole number of cents" }),
  ),
  actorUserId: NullableId,
  note: Schema.NullOr(Schema.String),
  at: Schema.Date,
}) {}

export class FineAuditEntry extends Schema.Class<FineAuditEntry>(
  "FineAuditEntry",
)({
  event: FineEvent,
  fine: Fine,
}) {}

export class FineMember extends Schema.Class<FineMember>("FineMember")({
  id: Id,
  userId: Id,
  role: Role,
  name: Schema.String,
  email: Schema.String,
}) {}

export class OrganizationScopedInput extends Schema.Class<OrganizationScopedInput>(
  "OrganizationScopedInput",
)({
  organizationId: Id,
}) {}

export class FineByIdInput extends Schema.Class<FineByIdInput>("FineByIdInput")(
  {
    organizationId: Id,
    id: Id,
  },
) {}

export class MemberFinesInput extends Schema.Class<MemberFinesInput>(
  "MemberFinesInput",
)({
  organizationId: Id,
  memberId: Id,
}) {}

export class CreateFineTemplateInput extends Schema.Class<CreateFineTemplateInput>(
  "CreateFineTemplateInput",
)({
  organizationId: Id,
  label: Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  amountCents: MoneyCents,
}) {}

export class UpdateFineTemplateInput extends Schema.Class<UpdateFineTemplateInput>(
  "UpdateFineTemplateInput",
)({
  organizationId: Id,
  id: Id,
  label: Schema.optional(
    Schema.String.check(Schema.isMinLength(1), Schema.isTrimmed()),
  ),
  amountCents: Schema.optional(MoneyCents),
}) {}

export class DeleteFineTemplateInput extends Schema.Class<DeleteFineTemplateInput>(
  "DeleteFineTemplateInput",
)({
  organizationId: Id,
  id: Id,
}) {}

export class IssueFineInput extends Schema.Class<IssueFineInput>(
  "IssueFineInput",
)({
  organizationId: Id,
  memberId: Id,
  issuedByUserId: Schema.optional(NullableId),
  templateId: Schema.optional(NullableId),
  reason: Schema.optional(
    Schema.NullOr(Schema.String.check(Schema.isMinLength(1))),
  ),
  amountCents: Schema.optional(MoneyCents),
  dueAt: Schema.optional(Schema.Date),
}) {}

export class FineActionInput extends Schema.Class<FineActionInput>(
  "FineActionInput",
)({
  organizationId: Id,
  id: Id,
  actorUserId: Schema.optional(NullableId),
  note: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class AdjustFineInput extends Schema.Class<AdjustFineInput>(
  "AdjustFineInput",
)({
  organizationId: Id,
  id: Id,
  actorUserId: Schema.optional(NullableId),
  amountCents: MoneyCents,
  note: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class ListAuditInput extends Schema.Class<ListAuditInput>(
  "ListAuditInput",
)({
  organizationId: Id,
  limit: Schema.optional(PositiveLimit),
}) {}

export class ApplyFineDoublingsInput extends Schema.Class<ApplyFineDoublingsInput>(
  "ApplyFineDoublingsInput",
)({
  now: Schema.optional(Schema.Date),
}) {}

export class ApplyFineDoublingsResult extends Schema.Class<ApplyFineDoublingsResult>(
  "ApplyFineDoublingsResult",
)({
  doubled: Schema.Number.check(Schema.isInt()),
}) {}
