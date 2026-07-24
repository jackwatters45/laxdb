import type { R2Bucket } from "@cloudflare/workers-types";
import { DatabaseError } from "@laxdb/core/error";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isR2Bucket = (value: unknown): value is R2Bucket =>
  isRecord(value) &&
  typeof value.put === "function" &&
  typeof value.get === "function" &&
  typeof value.delete === "function";

export const matchImagesBucket = Effect.gen(function* () {
  const env = yield* Cloudflare.WorkerEnvironment;
  if (!isRecord(env) || !isR2Bucket(env.STORAGE)) {
    return yield* new DatabaseError({
      domain: "MatchImage",
      message: "R2 binding STORAGE is missing from api worker env",
    });
  }
  return env.STORAGE;
});

export const deleteMatchImageObjects = (objectKeys: readonly string[]) =>
  Effect.gen(function* () {
    if (objectKeys.length === 0) return;
    const bucket = yield* matchImagesBucket;
    yield* Effect.tryPromise({
      try: () => bucket.delete([...objectKeys]),
      catch: (cause) =>
        new DatabaseError({
          domain: "MatchImage",
          message: "Failed to delete images from R2",
          cause,
        }),
    });
  });
