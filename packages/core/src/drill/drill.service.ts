import { Effect, Layer, ServiceMap } from "effect";

import { NotFoundError } from "../error";
import { decodedRowOperation, listOperation } from "../service-operations";

import { DrillRepo } from "./drill.repo";
import {
  CreateDrillInput,
  DeleteDrillInput,
  Drill,
  GetDrillInput,
  UpdateDrillInput,
} from "./drill.schema";

const asDrill = (row: typeof Drill.Type) => new Drill(row);

export class DrillService extends ServiceMap.Service<DrillService>()(
  "DrillService",
  {
    make: Effect.gen(function* () {
      const repo = yield* DrillRepo;

      return {
        list: () => listOperation(repo.list(), asDrill),

        get: (input: GetDrillInput) =>
          decodedRowOperation(GetDrillInput, input, repo.get, asDrill, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Drill", id: publicId }),
          }),

        create: (input: CreateDrillInput) =>
          decodedRowOperation(CreateDrillInput, input, repo.create, asDrill, {
            notFound: () => new NotFoundError({ domain: "Drill", id: "new" }),
          }),

        update: (input: UpdateDrillInput) =>
          decodedRowOperation(UpdateDrillInput, input, repo.update, asDrill, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Drill", id: publicId }),
          }),

        delete: (input: DeleteDrillInput) =>
          decodedRowOperation(DeleteDrillInput, input, repo.delete, asDrill, {
            notFound: ({ publicId }) =>
              new NotFoundError({ domain: "Drill", id: publicId }),
          }),
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(DrillRepo.layer),
  );
}
