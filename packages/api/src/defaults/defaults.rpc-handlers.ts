import type {
  GetDefaultsNamespaceInput,
  PatchDefaultsNamespaceInput,
} from "@laxdb/core/defaults/defaults.schema";
import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DefaultsRpcs } from "./defaults.rpc";

export const DefaultsRpcHandlers = DefaultsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DefaultsService;

    return withRpcLogging({
      DefaultsGetNamespace: (payload: GetDefaultsNamespaceInput) =>
        service.getNamespace(payload),
      DefaultsPatchNamespace: (payload: PatchDefaultsNamespaceInput) =>
        service.patchNamespace(payload),
    });
  }),
).pipe(Layer.provide(DefaultsService.layer));
