import { Context, Effect, Layer, Schema } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parseSqlError, type SchemaInput } from "../util";

import { DrillRepo } from "./drill.repo";
import {
  CreateDrillInput,
  DeleteDrillInput,
  Drill,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";

const asDrill = Schema.decodeUnknownSync(Drill);

export class DrillService extends Context.Service<DrillService>()(
  "DrillService",
  {
    make: Effect.gen(function* () {
      const repo = yield* DrillRepo;

      return {
        list: () =>
          repo.list().pipe(
            Effect.map((rows) => rows.map((row) => asDrill(row))),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        get: (input: SchemaInput<typeof GetDrillInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(GetDrillInput, input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.map(asDrill),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        create: (input: SchemaInput<typeof CreateDrillInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreateDrillInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.map(asDrill),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(new NotFoundError({ domain: "Drill", id: "new" })),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        update: (input: SchemaInput<typeof UpdateDrillInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(UpdateDrillInput, input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.map(asDrill),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
            Effect.tapError(Effect.logError),
          ),

        delete: (input: SchemaInput<typeof DeleteDrillInput>) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(DeleteDrillInput, input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.map(asDrill),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
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
