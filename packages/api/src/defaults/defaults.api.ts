import { DefaultsContract } from "@laxdb/core/defaults/defaults.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

export const DefaultsGroup = HttpApiGroup.make("Defaults")
  .add(
    HttpApiEndpoint.post("getNamespace", "/api/defaults/get", {
      success: DefaultsContract.getNamespace.success,
      error: DefaultsContract.getNamespace.error,
      payload: Schema.toEncoded(DefaultsContract.getNamespace.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("patchNamespace", "/api/defaults/patch", {
      success: DefaultsContract.patchNamespace.success,
      error: DefaultsContract.patchNamespace.error,
      payload: Schema.toEncoded(DefaultsContract.patchNamespace.payload),
    }),
  );
