import type { SqlError } from "@effect/sql/SqlError";
import { Effect, Schema } from "effect";
import {
  ConstraintViolationError,
  DatabaseError,
  ValidationError,
} from "./error";

export const decodeArguments = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  input: I,
) =>
  Schema.decode(schema)(input).pipe(
    Effect.tapError(Effect.logError),
    Effect.mapError((error) => new ValidationError({ cause: error })),
  );

type Cause = {
  constraint?: string;
  code?: string;
  detail?: string;
  message?: string;
};

export const parsePostgresError = (error: SqlError) => {
  // oxlint-disable-next-line no-unsafe-type-assertion
  const pgError = error.cause as Cause;
  const pgCode = pgError?.code;

  // oxlint-disable-next-line switch-exhaustiveness-check -- code is string|undefined, default handles unknown
  switch (pgCode) {
    case "23505":
    case "23503":
      return new ConstraintViolationError({
        constraint: pgError.constraint ?? "unknown",
        pgCode,
        detail: pgError.detail,
        cause: error,
      });

    case "23502":
      return new ConstraintViolationError({
        constraint: pgError.constraint ?? "unknown",
        pgCode,
        detail: pgError.detail ?? "Not null constraint violation",
        cause: error,
      });

    case "23514":
      return new ConstraintViolationError({
        constraint: pgError.constraint ?? "unknown",
        pgCode,
        detail: pgError.detail ?? "Check constraint violation",
        cause: error,
      });

    case "42501":
      return new DatabaseError({
        pgCode,
        message: "Insufficient database privileges",
        cause: error,
      });

    case "08000":
    case "08003":
    case "08006":
    case "53300":
      return new DatabaseError({
        pgCode,
        message: "Database connection error",
        cause: error,
      });

    case "40001":
    case "40P01":
      return new DatabaseError({
        pgCode,
        message: "Transaction conflict - please retry",
        cause: error,
      });

    default:
      return new DatabaseError({
        ...(typeof pgCode === "string" && pgCode !== "" && { pgCode }),
        message: pgError?.message ?? "Unknown database error",
        cause: error,
      });
  }
};
