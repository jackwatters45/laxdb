import { Context, Effect, Layer, Schema } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parseSqlError, type SchemaInput } from "../util";

import { PlayRepo } from "./play.repo";
import {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  Play,
  UpdatePlayInput,
} from "./play.schema";

const asPlay = Schema.decodeUnknownSync(Play);

export class PlayService extends Context.Service<PlayService>()("PlayService", {
  make: Effect.gen(function* () {
    const repo = yield* PlayRepo;

    return {
      list: () =>
        repo.list().pipe(
          Effect.map((rows) => rows.map((row) => asPlay(row))),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError(Effect.logError),
        ),

      get: (input: SchemaInput<typeof GetPlayInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(GetPlayInput, input);
          return yield* repo.get(decoded);
        }).pipe(
          Effect.map(asPlay),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new NotFoundError({ domain: "Play", id: input.publicId }),
            ),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError(Effect.logError),
        ),

      create: (input: SchemaInput<typeof CreatePlayInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(CreatePlayInput, input);
          return yield* repo.create(decoded);
        }).pipe(
          Effect.map(asPlay),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(new NotFoundError({ domain: "Play", id: "new" })),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError(Effect.logError),
        ),

      update: (input: SchemaInput<typeof UpdatePlayInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(UpdatePlayInput, input);
          return yield* repo.update(decoded);
        }).pipe(
          Effect.map(asPlay),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new NotFoundError({ domain: "Play", id: input.publicId }),
            ),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError(Effect.logError),
        ),

      delete: (input: SchemaInput<typeof DeletePlayInput>) =>
        Effect.gen(function* () {
          const decoded = yield* decodeArguments(DeletePlayInput, input);
          return yield* repo.delete(decoded);
        }).pipe(
          Effect.map(asPlay),
          Effect.catchTag("NoSuchElementError", () =>
            Effect.fail(
              new NotFoundError({ domain: "Play", id: input.publicId }),
            ),
          ),
          Effect.catchTag("SqlError", (e) => Effect.fail(parseSqlError(e))),
          Effect.tapError(Effect.logError),
        ),
    } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PlayRepo.layer),
  );
}
