import { Effect, Layer, ServiceMap } from "effect";

import { decodeArguments, parsePostgresError } from "../util";

import { PracticeDefaultsRepo } from "./practice-defaults.repo";
import {
  PracticeDefaultsSchema,
  UpsertPracticeDefaultsInput,
} from "./practice-defaults.schema";

const asDefaults = (row: typeof PracticeDefaultsSchema.Type) =>
  new PracticeDefaultsSchema(row);

export class PracticeDefaultsService extends ServiceMap.Service<PracticeDefaultsService>()(
  "PracticeDefaultsService",
  {
    make: Effect.gen(function* () {
      const repo = yield* PracticeDefaultsRepo;

      return {
        get: () =>
          repo.get().pipe(
            Effect.map((row) => (row ? asDefaults(row) : null)),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        upsert: (input: UpsertPracticeDefaultsInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              UpsertPracticeDefaultsInput,
              input,
            );
            return yield* repo.upsert(decoded);
          }).pipe(
            Effect.map(asDefaults),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PracticeDefaultsRepo.layer),
  );
}
