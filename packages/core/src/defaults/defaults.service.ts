import { Effect, Layer, ServiceMap } from "effect";

import { decodeArguments, parsePostgresError } from "../util";

import { DefaultsRepo } from "./defaults.repo";
import {
  GetDefaultsNamespaceInput,
  PatchDefaultsNamespaceInput,
} from "./defaults.schema";

export class DefaultsService extends ServiceMap.Service<DefaultsService>()(
  "DefaultsService",
  {
    make: Effect.gen(function* () {
      const repo = yield* DefaultsRepo;

      return {
        getNamespace: (input: GetDefaultsNamespaceInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              GetDefaultsNamespaceInput,
              input,
            );
            const row = yield* repo.getNamespace(decoded);
            return row?.valuesJson ?? {};
          }).pipe(
            Effect.catchTag("SqlError", (e) =>
              Effect.fail(parsePostgresError(e)),
            ),
            Effect.tapError(Effect.logError),
          ),

        patchNamespace: (input: PatchDefaultsNamespaceInput) =>
          Effect.gen(function* () {
            const decoded = yield* decodeArguments(
              PatchDefaultsNamespaceInput,
              input,
            );
            const row = yield* repo.patchNamespace(decoded);
            return row.valuesJson;
          }).pipe(
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
    Layer.provide(DefaultsRepo.layer),
  );
}
