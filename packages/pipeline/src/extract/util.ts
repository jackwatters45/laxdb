import { relative } from "node:path";

import { FileSystem, Path } from "@effect/platform";
import type { PlatformError } from "@effect/platform/Error";
import { Duration, Effect, Either, Schema } from "effect";

import { type PipelineError, type RateLimitError } from "../error";

/**
 * Error for file write failures.
 * Preserves the original platform error as cause for debugging.
 */
export class FileWriteError extends Schema.TaggedError<FileWriteError>(
  "FileWriteError",
)("FileWriteError", {
  message: Schema.String,
  filePath: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

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
    Effect.catchTag("SystemError", (e: PlatformError) =>
      Effect.fail(
        new FileWriteError({
          message: `Failed to write ${relative(process.cwd(), filePath)}: ${e.message}`,
          filePath: relative(process.cwd(), filePath),
          cause: e,
        }),
      ),
    ),
  );

/**
 * Determines if an error is critical (transient) and should fail-fast,
 * vs non-critical (permanent) where returning empty and continuing is appropriate.
 *
 * Critical errors: Network issues, timeouts, server errors (5xx)
 * Non-critical errors: Client errors (4xx), parse/schema errors, GraphQL errors
 * Retryable errors: Rate limits (handled separately by withRateLimitRetry)
 *
 * @example
 * if (Either.isLeft(result)) {
 *   if (isCriticalError(result.left)) {
 *     return yield* Effect.fail(result.left);
 *   }
 *   return emptyExtractResult([]);
 * }
 */
export const isCriticalError = (error: PipelineError): boolean => {
  switch (error._tag) {
    case "NetworkError":
    case "TimeoutError":
      return true;
    case "HttpError":
      // 5xx = server error (transient), 4xx = client error (permanent)
      return error.statusCode !== undefined && error.statusCode >= 500;
    case "RateLimitError":
      // Handled by withRateLimitRetry - if we get here, retries exhausted
      return true;
    case "ParseError":
    case "GraphQLError":
      // Non-critical: client errors, parse failures
      return false;
  }
  // Exhaustiveness check - TypeScript will error if PipelineError union changes
  const _exhaustive: never = error;
  return _exhaustive;
};

const DEFAULT_RATE_LIMIT_WAIT_MS = 60_000; // 1 minute default
const MAX_RETRY_WAIT_MS = 300_000; // 5 minutes max to prevent DoS via large retry-after

/**
 * Type guard to check if an error is a RateLimitError.
 * Used to safely narrow error types in withRateLimitRetry.
 */
const isRateLimitError = (error: { _tag: string }): error is RateLimitError =>
  error._tag === "RateLimitError";

/**
 * Pipeable operator that retries on RateLimitError.
 * Uses the `retryAfterMs` from the error, or a default of 60 seconds.
 * Wait time is capped at 5 minutes to prevent DoS via malicious retry-after headers.
 *
 * Note: Uses manual retry loop because Effect.retry's Schedule doesn't
 * have access to error content for dynamic delay calculation.
 *
 * @example
 * client.getTeams(...).pipe(
 *   withTiming(),
 *   withRateLimitRetry(),
 *   Effect.either
 * )
 */
export const withRateLimitRetry =
  (maxRetries = 2) =>
  <A, E extends { _tag: string }, R>(
    effect: Effect.Effect<A, E, R>,
  ): Effect.Effect<A, E, R> =>
    Effect.gen(function* () {
      // First attempt (attempt 0)
      const firstResult = yield* Effect.either(effect);
      if (Either.isRight(firstResult)) {
        return firstResult.right;
      }
      if (!isRateLimitError(firstResult.left)) {
        return yield* Effect.fail(firstResult.left);
      }

      // Retry loop for rate limit errors
      let lastRateLimitError = firstResult.left;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const waitMs = Math.min(
          lastRateLimitError.retryAfterMs ?? DEFAULT_RATE_LIMIT_WAIT_MS,
          MAX_RETRY_WAIT_MS,
        );
        yield* Effect.log(
          `     ⏳ Rate limited, waiting ${Math.round(waitMs / 1000)}s before retry ${attempt}/${maxRetries}...`,
        );
        yield* Effect.sleep(Duration.millis(waitMs));

        const result = yield* Effect.either(effect);
        if (Either.isRight(result)) {
          return result.right;
        }
        if (!isRateLimitError(result.left)) {
          return yield* Effect.fail(result.left);
        }
        lastRateLimitError = result.left;
      }

      // All retries exhausted - fail with the last rate limit error
      // Safety: lastRateLimitError came from the input effect's error channel,
      // so RateLimitError is assignable to E (the input effect's error type)
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return yield* Effect.fail(lastRateLimitError as E);
    });
