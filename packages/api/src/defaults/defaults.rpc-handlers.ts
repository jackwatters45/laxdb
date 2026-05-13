import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DefaultsRpcs } from "./defaults.rpc";

export const DefaultsRpcHandlers = DefaultsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DefaultsService;

    return withRpcLogging({
      DefaultsGetNamespace: service.getNamespace,
      DefaultsPatchNamespace: service.patchNamespace,
    });
  }),
).pipe(Layer.provide(DefaultsService.layer));
