import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";

import type { GraphQLError } from "../api-client/graphql.service";
import type { PipelineError } from "../error";

/**
 * Saves data as JSON to a file path.
 * Creates parent directories if they don't exist.
 *
 * CRITICAL: This function propagates errors via Effect.fail().
 * File write failures should stop extraction, not continue silently.
 * A failed write with manifest marked complete = permanent data loss.
 */
export const saveJson = <T>(filePath: string, data: T) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const dir = path.dirname(filePath);
    yield* fs.makeDirectory(dir, { recursive: true });
    yield* fs.writeFileString(filePath, JSON.stringify(data, null, 2));
  }).pipe(
    Effect.catchAll((e) =>
      Effect.fail(new Error(`Failed to write ${filePath}: ${String(e)}`)),
    ),
  );

/**
 * Determines if an error is critical (transient) and should fail-fast,
 * vs non-critical (permanent) where returning empty and continuing is appropriate.
 *
 * Critical errors: Network issues, timeouts, rate limits, server errors (5xx)
 * Non-critical errors: Client errors (4xx), parse/schema errors, GraphQL errors
 *
 * @example
 * if (Either.isLeft(result)) {
 *   if (isCriticalError(result.left)) {
 *     return yield* Effect.fail(result.left);
 *   }
 *   return emptyExtractResult([]);
 * }
 */
export const isCriticalError = (
  error: PipelineError | GraphQLError,
): boolean => {
  switch (error._tag) {
    case "NetworkError":
    case "TimeoutError":
    case "RateLimitError":
      return true;
    case "HttpError":
      // 5xx = server error (transient), 4xx = client error (permanent)
      return error.statusCode !== undefined && error.statusCode >= 500;
    case "ParseError":
    case "GraphQLError":
      return false;
    default:
      return false;
  }
};
