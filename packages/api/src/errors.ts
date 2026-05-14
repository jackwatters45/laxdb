import {
  ConstraintViolationError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "@laxdb/core/error";
import { HttpApiSchema } from "effect/unstable/httpapi";

export const ApiNotFoundError = NotFoundError.pipe(HttpApiSchema.status(404));
export const ApiValidationError = ValidationError.pipe(
  HttpApiSchema.status(400),
);
export const ApiConstraintViolationError = ConstraintViolationError.pipe(
  HttpApiSchema.status(409),
);
export const ApiDatabaseError = DatabaseError.pipe(HttpApiSchema.status(500));

export const DomainErrors = [
  ApiNotFoundError,
  ApiValidationError,
  ApiDatabaseError,
  ApiConstraintViolationError,
] as const;

export const DefaultsErrors = [
  ApiValidationError,
  ApiDatabaseError,
  ApiConstraintViolationError,
] as const;
