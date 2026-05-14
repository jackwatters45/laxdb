import { DefaultsContract } from "@laxdb/core/defaults/defaults.contract";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

import { DefaultsErrors } from "../errors";

const getNamespace = HttpApiEndpoint.post("getNamespace", "/api/defaults/get", {
  success: DefaultsContract.getNamespace.success,
  error: DefaultsErrors,
  payload: Schema.toEncoded(DefaultsContract.getNamespace.payload),
});

const patchNamespace = HttpApiEndpoint.post(
  "patchNamespace",
  "/api/defaults/patch",
  {
    success: DefaultsContract.patchNamespace.success,
    error: DefaultsErrors,
    payload: Schema.toEncoded(DefaultsContract.patchNamespace.payload),
  },
);

export const DefaultsGroup = HttpApiGroup.make("Defaults")
  .add(getNamespace)
  .add(patchNamespace);
