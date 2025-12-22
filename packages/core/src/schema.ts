import { Schema } from 'effect';
import { NANOID_LENGTH } from './constant';

// Drizzle Schemas
export const SerialSchema = Schema.Number.pipe(
  Schema.int({ message: () => 'ID must be a whole number' }),
  Schema.greaterThanOrEqualTo(0, {
    message: () => 'ID must be 0 or greater',
  })
);
export const NanoidSchema = Schema.String.pipe(
  Schema.length(NANOID_LENGTH),
  Schema.pattern(/^[A-Za-z0-9_-]{12}$/, {
    message: () => 'Invalid nanoid format',
  })
);

export const PublicIdSchema = {
  publicId: NanoidSchema,
};

export const CreatedAtSchema = Schema.DateFromSelf;
export const UpdatedAtSchema = Schema.NullOr(Schema.DateFromSelf);
export const DeletedAtSchema = Schema.NullOr(Schema.DateFromSelf);

export const TimestampsSchema = {
  createdAt: CreatedAtSchema,
  updatedAt: UpdatedAtSchema,
  deletedAt: DeletedAtSchema,
};

const BASE_64_REGEX = /^[a-zA-Z0-9]{32}$/;

// Better Auth Schema
export const Base64IdSchema = (msg?: string) =>
  Schema.String.pipe(
    Schema.pattern(BASE_64_REGEX, {
      message: () => msg ?? 'Invalid Base64 ID format',
    })
  );

// Common Schemas
export const PublicPlayerIdSchema = {
  publicPlayerId: NanoidSchema,
};

export const OrganizationSlugSchema = {
  organizationSlug: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Organization slug is required' })
  ),
};

const TeamId = Base64IdSchema('Team ID is required');
export const TeamIdSchema = { teamId: TeamId };
export const NullableTeamIdSchema = { teamId: Schema.NullOr(TeamId) };

export const OrganizationIdSchema = {
  organizationId: Base64IdSchema('Organization ID is required'),
};

// Rando - not sure if i want these ones here...
export const JerseyNumberSchema = Schema.Number.pipe(
  Schema.int({ message: () => 'Jersey number must be a whole number' }),
  Schema.greaterThanOrEqualTo(0, {
    message: () => 'Jersey number must be 0 or greater',
  }),
  Schema.lessThanOrEqualTo(1000, {
    message: () => 'Jersey number must be 1000 or less',
  })
);
export const NullableJerseyNumberSchema = Schema.NullOr(JerseyNumberSchema);

export const EmailSchema = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: () => 'Please enter a valid email address',
  })
);
export const NullableEmailSchema = Schema.NullOr(Schema.String);

export const PlayerNameSchema = Schema.String.pipe(
  Schema.minLength(1, {
    message: () => 'Player name must be at least 1 character',
  }),
  Schema.maxLength(100, {
    message: () => 'Player name must be 100 characters or less',
  }),
  Schema.trimmed()
);
export const NullablePlayerNameSchema = Schema.NullOr(PlayerNameSchema);
