import { Schema } from "effect";

import { SharedClientConfigFields } from "./config.schema";

export class RestClientConfig extends Schema.Class<RestClientConfig>(
  "RestClientConfig",
)({
  baseUrl: Schema.String,
  ...SharedClientConfigFields,
}) {}

export class RestRequestOptions extends Schema.Class<RestRequestOptions>(
  "RestRequestOptions",
)({
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  timeoutMs: Schema.optional(Schema.Number),
  signal: Schema.optional(Schema.Unknown),
}) {}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
