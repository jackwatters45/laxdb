import { DefaultsService } from "@laxdb/core-v2/defaults/defaults.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DefaultsRpcs } from "./defaults.rpc";

export const DefaultsRpcHandlers = DefaultsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DefaultsService;

    return withRpcLogging({
      DefaultsGetNamespace: (payload) => service.getNamespace(payload),
      DefaultsPatchNamespace: (payload) => service.patchNamespace(payload),
    });
  }),
).pipe(Layer.provide(DefaultsService.layer));
