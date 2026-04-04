import { Schema } from "effect";

import { NanoidSchema, TimestampsSchema } from "../schema";

export const DefaultsScopeType = Schema.Literals([
  "global",
  "user",
  "team",
  "org",
]);

export const DefaultsValues = Schema.Record(Schema.String, Schema.Unknown);

export class DefaultsEntry extends Schema.Class<DefaultsEntry>("DefaultsEntry")(
  {
    publicId: NanoidSchema,
    scopeType: DefaultsScopeType,
    scopeId: Schema.String,
    namespace: Schema.String,
    valuesJson: DefaultsValues,
    ...TimestampsSchema,
  },
) {}

export class GetDefaultsNamespaceInput extends Schema.Class<GetDefaultsNamespaceInput>(
  "GetDefaultsNamespaceInput",
)({
  scopeType: DefaultsScopeType,
  scopeId: Schema.String,
  namespace: Schema.String,
}) {}

export class PatchDefaultsNamespaceInput extends Schema.Class<PatchDefaultsNamespaceInput>(
  "PatchDefaultsNamespaceInput",
)({
  scopeType: DefaultsScopeType,
  scopeId: Schema.String,
  namespace: Schema.String,
  values: DefaultsValues,
}) {}
