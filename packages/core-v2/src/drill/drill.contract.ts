import { Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../error";

import {
  CreateDrillInput,
  DeleteDrillInput,
  Drill,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";

export const DrillErrors = Schema.Union([
  NotFoundError,
  ValidationError,
  DatabaseError,
  ConstraintViolationError,
]);

export const DrillContract = {
  list: {
    success: Schema.Array(Drill),
    error: DrillErrors,
    payload: Schema.Void,
  },
  get: {
    success: Drill,
    error: DrillErrors,
    payload: GetDrillInput,
  },
  create: {
    success: Drill,
    error: DrillErrors,
    payload: CreateDrillInput,
  },
  update: {
    success: Drill,
    error: DrillErrors,
    payload: UpdateDrillInput,
  },
  delete: {
    success: Drill,
    error: DrillErrors,
    payload: DeleteDrillInput,
  },
} as const;
