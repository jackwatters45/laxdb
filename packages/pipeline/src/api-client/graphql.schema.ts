import { Schema } from "effect";

export class GraphQLClientConfig extends Schema.Class<GraphQLClientConfig>(
  "GraphQLClientConfig",
)({
  endpoint: Schema.String,
  defaultHeaders: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String }),
  ),
  authHeader: Schema.optional(Schema.String),
  timeoutMs: Schema.optional(Schema.Number.pipe(Schema.positive())),
  maxRetries: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  ),
  retryDelayMs: Schema.optional(Schema.Number.pipe(Schema.positive())),
}) {}

export class GraphQLRequest extends Schema.Class<GraphQLRequest>(
  "GraphQLRequest",
)({
  query: Schema.String,
  variables: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
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
    Schema.Array(Schema.Union(Schema.String, Schema.Number)),
  ),
  extensions: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
}) {}

export const GraphQLResponse = <T extends Schema.Schema.Any>(dataSchema: T) =>
  Schema.Struct({
    data: Schema.NullOr(dataSchema),
    errors: Schema.optional(Schema.Array(GraphQLErrorItem)),
  });
