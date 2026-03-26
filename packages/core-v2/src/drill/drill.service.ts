import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parsePostgresError } from "../util";

import { DrillRepo } from "./drill.repo";
import {
  CreateDrillInput,
  DeleteDrillInput,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";

export class DrillService extends ServiceMap.Service<DrillService>()(
  "DrillService",
  {
    make: Effect.gen(function* () {
      const repo = yield* DrillRepo;

      return {
        list: () =>
          repo.list().pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        get: (input: GetDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetDrillInput, input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        create: (input: CreateDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateDrillInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(new NotFoundError({ domain: "Drill", id: "new" })),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        update: (input: UpdateDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateDrillInput, input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        delete: (input: DeleteDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeleteDrillInput, input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
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
    Layer.provide(DrillRepo.layer),
  );
}
