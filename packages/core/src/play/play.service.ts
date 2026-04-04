import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodeArguments, parsePostgresError } from "../util";

import { PlayRepo } from "./play.repo";
import {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  Play,
  UpdatePlayInput,
} from "./play.schema";

const asPlay = (row: typeof Play.Type) => new Play(row);

export class PlayService extends ServiceMap.Service<PlayService>()(
  "PlayService",
  {
    make: Effect.gen(function* () {
      const repo = yield* PlayRepo;

      return {
        list: () =>
          repo.list().pipe(
            Effect.map((rows) => rows.map(asPlay)),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        get: (input: GetPlayInput) =>
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
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        create: (input: CreatePlayInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(CreatePlayInput, input);
            return yield* repo.create(decoded);
          }).pipe(
            Effect.map(asPlay),
            Effect.catchTag("NoSuchElementError", () =>
              Effect.fail(new NotFoundError({ domain: "Play", id: "new" })),
            ),
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        update: (input: UpdatePlayInput) =>
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
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        delete: (input: DeletePlayInput) =>
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
    Layer.provide(PlayRepo.layer),
  );
}
