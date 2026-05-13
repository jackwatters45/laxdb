import { DefaultsService } from "@laxdb/core/defaults/defaults.service";
import { Effect, Layer } from "effect";

import { withRpcLogging } from "../rpc-logging";

import { DefaultsOperations } from "./defaults.operations";
import { DefaultsRpcs } from "./defaults.rpc";

export const DefaultsRpcHandlers = DefaultsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* DefaultsService;

    return withRpcLogging({
      [DefaultsOperations.getNamespace.rpcName]: service.getNamespace,
      [DefaultsOperations.patchNamespace.rpcName]: service.patchNamespace,
    });
  }),
).pipe(Layer.provide(DefaultsService.layer));
