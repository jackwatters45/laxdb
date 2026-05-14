import { DefaultsContract } from "@laxdb/core/defaults/defaults.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DefaultsErrors } from "../errors";

export const DefaultsGroup = HttpApiGroup.make("Defaults")
  .add(
    HttpApiEndpoint.post("getNamespace", "/api/defaults/get", {
      success: DefaultsContract.getNamespace.success,
      error: DefaultsErrors,
      payload: Schema.toEncoded(DefaultsContract.getNamespace.payload),
    }),
  )
  .add(
    HttpApiEndpoint.post("patchNamespace", "/api/defaults/patch", {
      success: DefaultsContract.patchNamespace.success,
      error: DefaultsErrors,
      payload: Schema.toEncoded(DefaultsContract.patchNamespace.payload),
    }),
  );
