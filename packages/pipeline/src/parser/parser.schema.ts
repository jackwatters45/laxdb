import { Schema } from "effect";

export class ParseHtmlRequest extends Schema.Class<ParseHtmlRequest>(
  "ParseHtmlRequest",
)({
  html: Schema.String,
  baseUrl: Schema.optional(Schema.String),
}) {}

export class ExtractedLink extends Schema.Class<ExtractedLink>("ExtractedLink")(
  {
    href: Schema.String,
    text: Schema.String,
    title: Schema.NullOr(Schema.String),
  },
) {}

export class ExtractedImage extends Schema.Class<ExtractedImage>(
  "ExtractedImage",
)({
  src: Schema.String,
  alt: Schema.NullOr(Schema.String),
  width: Schema.NullOr(Schema.Number),
  height: Schema.NullOr(Schema.Number),
}) {}

export class ExtractedMeta extends Schema.Class<ExtractedMeta>("ExtractedMeta")(
  {
    title: Schema.NullOr(Schema.String),
    description: Schema.NullOr(Schema.String),
    keywords: Schema.NullOr(Schema.String),
    author: Schema.NullOr(Schema.String),
    ogTitle: Schema.NullOr(Schema.String),
    ogDescription: Schema.NullOr(Schema.String),
    ogImage: Schema.NullOr(Schema.String),
    ogUrl: Schema.NullOr(Schema.String),
  },
) {}

export class ParsedHtml extends Schema.Class<ParsedHtml>("ParsedHtml")({
  text: Schema.String,
  meta: ExtractedMeta,
  links: Schema.Array(ExtractedLink),
  images: Schema.Array(ExtractedImage),
}) {}

export class SelectorQuery extends Schema.Class<SelectorQuery>("SelectorQuery")(
  {
    html: Schema.String,
    selector: Schema.String,
    attribute: Schema.optional(Schema.String),
  },
) {}

export class SelectorResult extends Schema.Class<SelectorResult>(
  "SelectorResult",
)({
  matches: Schema.Array(Schema.String),
  count: Schema.Number,
}) {}
