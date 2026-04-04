import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  ValidationError,
} from "../error";

import {
  PracticeDefaultsSchema,
  UpsertPracticeDefaultsInput,
} from "./practice-defaults.schema";

export const PracticeDefaultsErrors = Schema.Union([
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const PracticeDefaultsContract = {
  get: {
    success: Schema.NullOr(PracticeDefaultsSchema),
    error: PracticeDefaultsErrors,
    payload: Schema.NullOr(Schema.Void),
  },
  upsert: {
    success: PracticeDefaultsSchema,
    error: PracticeDefaultsErrors,
    payload: UpsertPracticeDefaultsInput,
  },
} as const;
