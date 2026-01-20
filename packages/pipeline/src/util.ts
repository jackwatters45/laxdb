import type { ParseResult } from "effect";

import { ParseError } from "./error";

/**
 * Maps a ParseResult.ParseError to a ParseError.
 * Used by clients to convert schema validation errors to typed ParseError.
 */
export const mapParseError = (error: ParseResult.ParseError): ParseError =>
  new ParseError({
    message: `Invalid request: ${String(error)}`,
    cause: error,
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
