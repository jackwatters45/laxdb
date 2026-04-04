import { Schema, SchemaGetter } from "effect";

import { NANOID_LENGTH } from "./constant";

// Drizzle Schemas
export const SerialSchema = Schema.Number.check(
  Schema.isInt({ message: "ID must be a whole number" }),
  Schema.isGreaterThanOrEqualTo(0, { message: "ID must be 0 or greater" }),
);
export const NanoidSchema = Schema.String.check(
  Schema.isLengthBetween(NANOID_LENGTH, NANOID_LENGTH),
  Schema.isPattern(/^[A-Za-z0-9_-]{12}$/, {
    message: "Invalid nanoid format",
  }),
);

export const PublicIdSchema = {
  publicId: NanoidSchema,
};

/** Date that serializes as an ISO string over the wire (JSON/NDJSON) */
// Interface declaration matches Effect's own NumberFromString pattern.
// TypeScript evaluates interface extends lazily, avoiding the `unknown`
// pollution from declareConstructor's empty TypeParameters.
interface DateFromString extends Schema.decodeTo<Schema.Date, Schema.String> {}

export const DateFromString: DateFromString = Schema.decodeTo(Schema.Date, {
  decode: SchemaGetter.transform((s) => new Date(s as string)),
  encode: SchemaGetter.transform((d) => d.toISOString()),
})(Schema.String) as DateFromString;

/** Date schema — string ↔ Date, annotated for OpenAPI */
export const DateSchema = DateFromString.annotate({
  jsonSchema: { type: "string", format: "date-time" },
});

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
  );

// Common Schemas
export const PublicPlayerIdSchema = {
  publicPlayerId: NanoidSchema,
};

export const OrganizationSlugSchema = {
  organizationSlug: Schema.String.check(
    Schema.isMinLength(1, { message: "Organization slug is required" }),
  ),
};

const TeamId = Base64IdSchema("Team ID is required");
export const TeamIdSchema = { teamId: TeamId };
export const NullableTeamIdSchema = { teamId: Schema.NullOr(TeamId) };

export const OrganizationIdSchema = {
  organizationId: Base64IdSchema("Organization ID is required"),
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
);
export const NullableJerseyNumberSchema = Schema.NullOr(JerseyNumberSchema);

export const EmailSchema = Schema.String.check(
  Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: "Please enter a valid email address",
  }),
);
export const NullableEmailSchema = Schema.NullOr(Schema.String);

export const PlayerNameSchema = Schema.String.check(
  Schema.isMinLength(1, {
    message: "Player name must be at least 1 character",
  }),
  Schema.isMaxLength(100, {
    message: "Player name must be 100 characters or less",
  }),
  Schema.isTrimmed(),
);
export const NullablePlayerNameSchema = Schema.NullOr(PlayerNameSchema);
