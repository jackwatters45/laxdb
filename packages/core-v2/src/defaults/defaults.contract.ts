import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  ValidationError,
} from "../error";

import {
  DefaultsValues,
  GetDefaultsNamespaceInput,
  PatchDefaultsNamespaceInput,
} from "./defaults.schema";

export const DefaultsErrors = Schema.Union([
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const DefaultsContract = {
  getNamespace: {
    success: DefaultsValues,
    error: DefaultsErrors,
    payload: GetDefaultsNamespaceInput,
  },
  patchNamespace: {
    success: DefaultsValues,
    error: DefaultsErrors,
    payload: PatchDefaultsNamespaceInput,
  },
} as const;
