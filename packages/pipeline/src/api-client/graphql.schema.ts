import { Schema } from "effect";

import { SharedClientConfigFields } from "./config.schema";

export class GraphQLClientConfig extends Schema.Class<GraphQLClientConfig>(
  "GraphQLClientConfig",
)({
  endpoint: Schema.String,
  ...SharedClientConfigFields,
}) {}

export class GraphQLRequest extends Schema.Class<GraphQLRequest>(
  "GraphQLRequest",
)({
  query: Schema.String,
  variables: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  operationName: Schema.optional(Schema.String),
}) {}

export class GraphQLErrorLocation extends Schema.Class<GraphQLErrorLocation>(
  "GraphQLErrorLocation",
)({
  line: Schema.Number,
  column: Schema.Number,
}) {}

export class GraphQLErrorItem extends Schema.Class<GraphQLErrorItem>(
  "GraphQLErrorItem",
)({
  message: Schema.String,
  locations: Schema.optional(Schema.Array(GraphQLErrorLocation)),
  path: Schema.optional(
    Schema.Array(Schema.Union([Schema.String, Schema.Number])),
  ),
  extensions: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export const GraphQLResponse = <T extends Schema.Top>(dataSchema: T) =>
  Schema.Struct({
    data: Schema.NullOr(dataSchema),
    errors: Schema.optional(Schema.Array(GraphQLErrorItem)),
  });
