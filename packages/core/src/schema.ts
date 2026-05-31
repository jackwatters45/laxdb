import {
  Effect,
  Option,
  Schema,
  SchemaIssue,
  SchemaTransformation,
} from "effect";

import { NANOID_LENGTH } from "./constant";

// Drizzle Schemas
export const SerialSchema = Schema.Number.check(
  Schema.isInt({ message: "ID must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(0, { message: "ID must be 0 or greater" }),
).pipe(Schema.brand("SerialId"));
export type SerialId = typeof SerialSchema.Type;

export const NanoidSchema = Schema.String.check(
  Schema.isLengthBetween(NANOID_LENGTH, NANOID_LENGTH),
  Schema.isPattern(/^[A-Za-z0-9_-]{12}$/, {
    message: "Invalid nanoid format",
  }),
).pipe(Schema.brand("Nanoid"));
export type Nanoid = typeof NanoidSchema.Type;

export const PublicIdSchema = {
  publicId: NanoidSchema,
};

/** Date that serializes as an ISO string over the wire (JSON/NDJSON) */
export const DateFromString = Schema.String.pipe(
  Schema.decodeTo(
    Schema.Date,
    SchemaTransformation.transformOrFail({
      decode: (value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? Effect.fail(
              new SchemaIssue.InvalidValue(Option.some(value), {
                message: "Invalid date",
              }),
            )
          : Effect.succeed(date);
      },
      encode: (date) => Effect.succeed(date.toISOString()),
    }),
  ),
);

/** Date schema — string ↔ Date, annotated for OpenAPI */
export const DateSchema = DateFromString.annotate({
  jsonSchema: { type: "string", format: "date-time" },
});

export const DisplayCurrencyFromCents = Schema.Number.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (cents) => `$${(cents / 100).toFixed(2).replace(/\.00$/u, "")}`,
      encode: (value) => Number(value.replaceAll(/[^0-9.-]/gu, "")) * 100,
    }),
  ),
);

export const DisplayDateFromDate = Schema.Date.pipe(
  Schema.decodeTo(
    Schema.String,
    SchemaTransformation.transform({
      decode: (date) =>
        date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      encode: (value) => new Date(value),
    }),
  ),
);

export const CreatedAtSchema = DateFromString;
export const UpdatedAtSchema = Schema.UndefinedOr(
  Schema.NullOr(DateFromString),
);

export const TimestampsSchema = {
  createdAt: CreatedAtSchema,
  updatedAt: UpdatedAtSchema,
};

const BASE_64_REGEX = /^[a-zA-Z0-9]{32}$/;

// Better Auth Schema
export const Base64IdSchema = (msg?: string) =>
  Schema.String.check(
    Schema.isPattern(BASE_64_REGEX, {
      message: msg ?? "Invalid Base64 ID format",
    }),
  ).pipe(Schema.brand("Base64Id"));
export type Base64Id = ReturnType<typeof Base64IdSchema>["Type"];

// Common Schemas
export const PublicPlayerIdSchema = {
  publicPlayerId: NanoidSchema,
};

export const OrganizationSlugSchema = {
  organizationSlug: Schema.String.check(
    Schema.isMinLength(1, { message: "Organization slug is required" }),
  ),
};

export const TeamId = Schema.String.check(
  Schema.isPattern(BASE_64_REGEX, { message: "Team ID is required" }),
).pipe(Schema.brand("TeamId"));
export type TeamId = typeof TeamId.Type;
export const TeamIdSchema = { teamId: TeamId };
export const NullableTeamIdSchema = { teamId: Schema.NullOr(TeamId) };

export const OrganizationId = Schema.String.check(
  Schema.isPattern(BASE_64_REGEX, { message: "Organization ID is required" }),
).pipe(Schema.brand("OrganizationId"));
export type OrganizationId = typeof OrganizationId.Type;
export const OrganizationIdSchema = {
  organizationId: OrganizationId,
};

// Rando - not sure if i want these ones here...
export const JerseyNumberSchema = Schema.Number.check(
  Schema.isInt({ message: "Jersey number must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(0, {
    message: "Jersey number must be 0 or greater",
  }),
  Schema.isLessThanOrEqualTo(1000, {
    message: "Jersey number must be 1000 or less",
  }),
).pipe(Schema.brand("JerseyNumber"));
export type JerseyNumber = typeof JerseyNumberSchema.Type;
export const NullableJerseyNumberSchema = Schema.NullOr(JerseyNumberSchema);

export const EmailSchema = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: "Please enter a valid email address",
  }),
).pipe(Schema.brand("Email"));
export type Email = typeof EmailSchema.Type;
export const NullableEmailSchema = Schema.NullOr(EmailSchema);

export const PlayerNameSchema = Schema.String.check(
  Schema.isMinLength(1, {
    message: "Player name must be at least 1 character",
  }),
  Schema.isMaxLength(100, {
    message: "Player name must be 100 characters or less",
  }),
  Schema.isTrimmed(),
).pipe(Schema.brand("PlayerName"));
export type PlayerName = typeof PlayerNameSchema.Type;
export const NullablePlayerNameSchema = Schema.NullOr(PlayerNameSchema);
