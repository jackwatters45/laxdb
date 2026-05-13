import { Effect, type Schema } from "effect";

import { ParseError } from "./error";

/**
 * Maps a Schema.SchemaError to a ParseError.
 * Used by clients to convert schema validation errors to typed ParseError.
 */
export const mapParseError = (error: Schema.SchemaError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
  });

/**
 * Formats unknown errors without relying on Object's default stringification.
 */
export const formatUnknownError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  )
    return String(error);
  if (typeof error === "symbol") return error.description ?? error.toString();
  return "Unknown error";
};

/**
 * Parses third-party JSON into an expected shape and maps failures to ParseError.
 */
export const safeParseJson = <T>(
  raw: string,
  message: string,
): Effect.Effect<T, ParseError> =>
  Effect.try({
    try: () => {
      const parsed: unknown = JSON.parse(raw);
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- third-party pipeline sources are validated lazily at their usage sites
      return parsed as T;
    },
    catch: () =>
      new ParseError({
        message,
        cause: raw.slice(0, 200),
      }),
  });

/**
 * Safely converts an unknown value to a string.
 * Only converts primitives (string, number, boolean); returns empty string for objects/null/undefined.
 */
export const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
};

/**
 * Safely converts an unknown value to a string or null.
 * Only converts primitives; returns null for objects/null/undefined.
 */
export const safeStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return null;
};
