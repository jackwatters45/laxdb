import { Schema } from "effect";

import {
  DateSchema,
  NanoidSchema,
  PublicIdSchema,
  TimestampsSchema,
} from "../schema";

// ---------------------------------------------------------------------------
// Enums — enforced at the Effect layer, stored as text in PG for flexibility
// ---------------------------------------------------------------------------

export const PracticeStatus = Schema.Literals([
  "draft",
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
]);

export const PracticeItemType = Schema.Literals([
  "warmup",
  "drill",
  "cooldown",
  "water-break",
  "activity",
]);

export const PracticeItemVariant = Schema.Literals(["default", "split"]);

export const PracticeItemPriority = Schema.Literals([
  "required",
  "optional",
  "if-time",
]);

// ---------------------------------------------------------------------------
// Domain schemas
// ---------------------------------------------------------------------------

export class Practice extends Schema.Class<Practice>("Practice")({
  ...PublicIdSchema,
  name: Schema.NullOr(Schema.String),
  date: Schema.NullOr(DateSchema),
  description: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
  status: PracticeStatus,
  ...TimestampsSchema,
}) {}

export class PracticeItem extends Schema.Class<PracticeItem>("PracticeItem")({
  ...PublicIdSchema,
  practicePublicId: NanoidSchema,
  type: PracticeItemType,
  variant: PracticeItemVariant,
  drillPublicId: Schema.NullOr(NanoidSchema),
  label: Schema.NullOr(Schema.String),
  durationMinutes: Schema.NullOr(Schema.Number),
  notes: Schema.NullOr(Schema.String),
  groups: Schema.Array(Schema.String),
  orderIndex: Schema.Number,
  positionX: Schema.NullOr(Schema.Number),
  positionY: Schema.NullOr(Schema.Number),
  priority: PracticeItemPriority,
  ...TimestampsSchema,
}) {}

export class PracticeReview extends Schema.Class<PracticeReview>(
  "PracticeReview",
)({
  ...PublicIdSchema,
  practicePublicId: NanoidSchema,
  wentWell: Schema.NullOr(Schema.String),
  needsImprovement: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

// ---------------------------------------------------------------------------
// Practice inputs
// ---------------------------------------------------------------------------

export class CreatePracticeInput extends Schema.Class<CreatePracticeInput>(
  "CreatePracticeInput",
)({
  name: Schema.NullOr(Schema.String),
  date: Schema.NullOr(DateSchema),
  description: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
  status: Schema.optional(PracticeStatus),
}) {}

export class GetPracticeInput extends Schema.Class<GetPracticeInput>(
  "GetPracticeInput",
)({
  publicId: NanoidSchema,
}) {}

export class UpdatePracticeInput extends Schema.Class<UpdatePracticeInput>(
  "UpdatePracticeInput",
)({
  publicId: NanoidSchema,
  name: Schema.optional(Schema.NullOr(Schema.String)),
  date: Schema.optional(Schema.NullOr(DateSchema)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  location: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.optional(PracticeStatus),
}) {}

export class DeletePracticeInput extends Schema.Class<DeletePracticeInput>(
  "DeletePracticeInput",
)({
  publicId: NanoidSchema,
}) {}

// ---------------------------------------------------------------------------
// Practice item inputs
// ---------------------------------------------------------------------------

export class AddItemInput extends Schema.Class<AddItemInput>("AddItemInput")({
  practicePublicId: NanoidSchema,
  type: PracticeItemType,
  variant: Schema.optional(PracticeItemVariant),
  drillPublicId: Schema.optional(Schema.NullOr(NanoidSchema)),
  label: Schema.optional(Schema.NullOr(Schema.String)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
  groups: Schema.optional(Schema.Array(Schema.String)),
  orderIndex: Schema.optional(Schema.Number),
  positionX: Schema.optional(Schema.NullOr(Schema.Number)),
  positionY: Schema.optional(Schema.NullOr(Schema.Number)),
  priority: Schema.optional(PracticeItemPriority),
}) {}

export class UpdateItemInput extends Schema.Class<UpdateItemInput>(
  "UpdateItemInput",
)({
  publicId: NanoidSchema,
  type: Schema.optional(PracticeItemType),
  variant: Schema.optional(PracticeItemVariant),
  drillPublicId: Schema.optional(Schema.NullOr(NanoidSchema)),
  label: Schema.optional(Schema.NullOr(Schema.String)),
  durationMinutes: Schema.optional(Schema.NullOr(Schema.Number)),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
  groups: Schema.optional(Schema.Array(Schema.String)),
  orderIndex: Schema.optional(Schema.Number),
  positionX: Schema.optional(Schema.NullOr(Schema.Number)),
  positionY: Schema.optional(Schema.NullOr(Schema.Number)),
  priority: Schema.optional(PracticeItemPriority),
}) {}

export class RemoveItemInput extends Schema.Class<RemoveItemInput>(
  "RemoveItemInput",
)({
  publicId: NanoidSchema,
}) {}

export class ListItemsInput extends Schema.Class<ListItemsInput>(
  "ListItemsInput",
)({
  practicePublicId: NanoidSchema,
}) {}

export class ReorderItemsInput extends Schema.Class<ReorderItemsInput>(
  "ReorderItemsInput",
)({
  practicePublicId: NanoidSchema,
  orderedIds: Schema.Array(NanoidSchema),
}) {}

// ---------------------------------------------------------------------------
// Practice review inputs
// ---------------------------------------------------------------------------

export class GetReviewInput extends Schema.Class<GetReviewInput>(
  "GetReviewInput",
)({
  practicePublicId: NanoidSchema,
}) {}

export class CreateReviewInput extends Schema.Class<CreateReviewInput>(
  "CreateReviewInput",
)({
  practicePublicId: NanoidSchema,
  wentWell: Schema.NullOr(Schema.String),
  needsImprovement: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
}) {}

export class UpdateReviewInput extends Schema.Class<UpdateReviewInput>(
  "UpdateReviewInput",
)({
  practicePublicId: NanoidSchema,
  wentWell: Schema.optional(Schema.NullOr(Schema.String)),
  needsImprovement: Schema.optional(Schema.NullOr(Schema.String)),
  notes: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

/** Wrap plain rows as Schema.Class instances */
export const asPractice = (row: typeof Practice.Type) => new Practice(row);
export const asPracticeItem = (row: typeof PracticeItem.Type) =>
  new PracticeItem(row);
export const asPracticeReview = (row: typeof PracticeReview.Type) =>
  new PracticeReview(row);
