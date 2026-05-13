import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodedRowOperation, listOperation } from "../service-operations";

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
        list: () => listOperation(repo.list(), asPlay),

        get: (input: GetPlayInput) =>
          decodedRowOperation(GetPlayInput, input, repo.get, asPlay, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Play", id: publicId }),
          }),

        create: (input: CreatePlayInput) =>
          decodedRowOperation(CreatePlayInput, input, repo.create, asPlay, {
            notFound: () => new NotFoundError({ domain: "Play", id: "new" }),
          }),

        update: (input: UpdatePlayInput) =>
          decodedRowOperation(UpdatePlayInput, input, repo.update, asPlay, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Play", id: publicId }),
          }),

        delete: (input: DeletePlayInput) =>
          decodedRowOperation(DeletePlayInput, input, repo.delete, asPlay, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Play", id: publicId }),
          }),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(PlayRepo.layer),
  );
}
