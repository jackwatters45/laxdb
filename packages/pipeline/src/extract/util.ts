import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";

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
