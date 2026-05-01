import { Effect, Schema } from "effect";

import {
  ConstraintViolationError,
  DatabaseError,
  ValidationError,
} from "./error";

export const decodeArguments = <S extends Schema.Top>(
  schema: S,
  input: unknown,
) =>
  Schema.decodeUnknownEffect(schema)(input).pipe(
    Effect.tapError(Effect.logError),
    Effect.mapError((error) => new ValidationError({ cause: error })),
  );

const getCauseString = (cause: unknown, key: PropertyKey) => {
  if (typeof cause !== "object" || cause === null) return;
  const descriptor = Object.getOwnPropertyDescriptor(cause, key);
  const value: unknown = descriptor?.value;
  if (typeof value === "string") return value;
};

const getErrorMessage = (error: {
  readonly cause?: unknown;
  readonly message?: string;
}) => {
  const causeMessage = getCauseString(error.cause, "message");
  if (causeMessage !== undefined && causeMessage !== "") return causeMessage;
  if (error.cause instanceof Error) return error.cause.message;
  if (
    error.message !== undefined &&
    error.message !== "" &&
    error.message !== "SqlError" &&
    error.message !== "Query failed"
  ) {
    return error.message;
  }
  return "Unknown database error";
};

const isConstraintMessage = (message: string) =>
  message.includes("UNIQUE constraint failed") ||
  message.includes("FOREIGN KEY constraint failed") ||
  message.includes("NOT NULL constraint failed") ||
  message.includes("CHECK constraint failed");

const constraintPrefixes = [
  "UNIQUE constraint failed",
  "FOREIGN KEY constraint failed",
  "NOT NULL constraint failed",
  "CHECK constraint failed",
] as const;

const constraintFromMessage = (message: string) => {
  for (const prefix of constraintPrefixes) {
    const prefixIndex = message.indexOf(prefix);
    if (prefixIndex >= 0) {
      const detail = message
        .slice(prefixIndex + prefix.length)
        .replace(/^:\s*/, "")
        .trim();
      if (detail !== "") return detail.split(": ")[0] ?? detail;
      return prefix;
    }
  }

  const [, ...detail] = message.split(": ");
  return detail.join(": ") || "unknown";
};

export const parseSqlError = (error: {
  readonly cause?: unknown;
  readonly message?: string;
}) => {
  const sqlCode = getCauseString(error.cause, "code");
  const detail = getCauseString(error.cause, "detail");
  const constraint = getCauseString(error.cause, "constraint");
  const message = getErrorMessage(error);

  if (isConstraintMessage(message)) {
    return new ConstraintViolationError({
      constraint: constraint ?? constraintFromMessage(message),
      detail: detail ?? message,
      cause: error,
      ...(sqlCode !== undefined && { sqlCode }),
    });
  }

  // oxlint-disable-next-line switch-exhaustiveness-check -- code is string|undefined, default handles unknown
  switch (sqlCode) {
    case "23505":
    case "23503":
      return new ConstraintViolationError({
        constraint: constraint ?? "unknown",
        sqlCode,
        detail,
        cause: error,
      });

    case "23502":
      return new ConstraintViolationError({
        constraint: constraint ?? "unknown",
        sqlCode,
        detail: detail ?? "Not null constraint violation",
        cause: error,
      });

    case "23514":
      return new ConstraintViolationError({
        constraint: constraint ?? "unknown",
        sqlCode,
        detail: detail ?? "Check constraint violation",
        cause: error,
      });

    case "42501":
      return new DatabaseError({
        sqlCode,
        message: "Insufficient database privileges",
        cause: error,
      });

    case "08000":
    case "08003":
    case "08006":
    case "53300":
      return new DatabaseError({
        sqlCode,
        message: "Database connection error",
        cause: error,
      });

    case "40001":
    case "40P01":
      return new DatabaseError({
        sqlCode,
        message: "Transaction conflict - please retry",
        cause: error,
      });

    default:
      return new DatabaseError({
        ...(typeof sqlCode === "string" && sqlCode !== "" && { sqlCode }),
        message,
        cause: error,
      });
  }
};
