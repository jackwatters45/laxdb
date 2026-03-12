import { Effect, Schema } from "effect";

import { NotFoundError } from "../error";
import { parsePostgresError } from "../util";

import { DrillRepo } from "./drill.repo";
import {
  CreateDrillInput,
  DeleteDrillInput,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";

export class DrillService extends Effect.Service<DrillService>()(
  "DrillService",
  {
    effect: Effect.gen(function* () {
      const repo = yield* DrillRepo;

      return {
        list: () =>
          repo.list().pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((drills) =>
              Effect.log(`Listed ${drills.length} drills`),
            ),
            Effect.tapError((e) => Effect.logError("Failed to list drills", e)),
          ),

        get: (input: GetDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(GetDrillInput)(input);
            return yield* repo.get(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError((e) => Effect.logError("Failed to get drill", e)),
          ),

        create: (input: CreateDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(CreateDrillInput)(input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((drill) =>
              Effect.log(`Created drill: ${drill.publicId}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to create drill", e),
            ),
          ),

        update: (input: UpdateDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(UpdateDrillInput)(input);
            return yield* repo.update(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((drill) =>
              Effect.log(`Updated drill: ${drill.publicId}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to update drill", e),
            ),
          ),

        delete: (input: DeleteDrillInput) =>
          Effect.gen(function* () {
            const decoded = yield* Schema.decode(DeleteDrillInput)(input);
            return yield* repo.delete(decoded);
          }).pipe(
            Effect.catchTag("NoSuchElementException", () =>
              Effect.fail(
                new NotFoundError({ domain: "Drill", id: input.publicId }),
              ),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tap((drill) =>
              Effect.log(`Deleted drill: ${drill.publicId}`),
            ),
            Effect.tapError((e) =>
              Effect.logError("Failed to delete drill", e),
            ),
          ),
      } as const;
    }),
    dependencies: [DrillRepo.Default],
  },
) {}
