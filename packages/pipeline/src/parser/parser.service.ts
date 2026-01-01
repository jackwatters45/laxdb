import * as cheerio from "cheerio";
import { Effect, Schema } from "effect";
import { ParserError, SelectorError } from "./parser.error";
import {
  type ExtractedImage,
  type ExtractedLink,
  type ExtractedMeta,
  ParseHtmlRequest,
  type ParsedHtml,
  SelectorQuery,
  type SelectorResult,
} from "./parser.schema";

export class ParserService extends Effect.Service<ParserService>()(
  "ParserService",
  {
    effect: Effect.gen(function* () {
      return {
        parse: (input: ParseHtmlRequest) =>
          Effect.gen(function* () {
            const request = yield* Schema.decode(ParseHtmlRequest)(input);

            const $ = yield* Effect.try({
              try: () => cheerio.load(request.html),
              catch: (error) =>
                new ParserError({
                  message: `Failed to parse HTML: ${String(error)}`,
                  cause: error,
                }),
            });

            const text = $("body").text().replaceAll(/\s+/g, " ").trim();

            const meta: ExtractedMeta = {
              title: $("title").text() || null,
              description:
                $('meta[name="description"]').attr("content") ?? null,
              keywords: $('meta[name="keywords"]').attr("content") ?? null,
              author: $('meta[name="author"]').attr("content") ?? null,
              ogTitle: $('meta[property="og:title"]').attr("content") ?? null,
              ogDescription:
                $('meta[property="og:description"]').attr("content") ?? null,
              ogImage: $('meta[property="og:image"]').attr("content") ?? null,
              ogUrl: $('meta[property="og:url"]').attr("content") ?? null,
            };

            const links: ExtractedLink[] = [];
            $("a[href]").each((_, el) => {
              const $el = $(el);
              const href = $el.attr("href");
              if (href) {
                links.push({
                  href: resolveUrl(href, request.baseUrl),
                  text: $el.text().trim(),
                  title: $el.attr("title") ?? null,
                });
              }
            });

            const images: ExtractedImage[] = [];
            $("img[src]").each((_, el) => {
              const $el = $(el);
              const src = $el.attr("src");
              if (src) {
                const width = $el.attr("width");
                const height = $el.attr("height");
                images.push({
                  src: resolveUrl(src, request.baseUrl),
                  alt: $el.attr("alt") ?? null,
                  width: width ? Number.parseInt(width, 10) : null,
                  height: height ? Number.parseInt(height, 10) : null,
                });
              }
            });

            return { text, meta, links, images } satisfies ParsedHtml;
          }).pipe(
            Effect.tap(() => Effect.log("Parsed HTML successfully")),
            Effect.tapError((error) =>
              Effect.logError(`Failed to parse HTML: ${String(error)}`),
            ),
          ),

        querySelector: (input: SelectorQuery) =>
          Effect.gen(function* () {
            const query = yield* Schema.decode(SelectorQuery)(input);

            const $ = yield* Effect.try({
              try: () => cheerio.load(query.html),
              catch: (error) =>
                new ParserError({
                  message: `Failed to parse HTML: ${String(error)}`,
                  cause: error,
                }),
            });

            const matches: string[] = [];

            yield* Effect.try({
              try: () => {
                $(query.selector).each((_, el) => {
                  const $el = $(el);
                  if (query.attribute) {
                    const attr = $el.attr(query.attribute);
                    if (attr) matches.push(attr);
                  } else {
                    matches.push($el.text().trim());
                  }
                });
              },
              catch: (error) =>
                new SelectorError({
                  message: `Invalid selector: ${String(error)}`,
                  selector: query.selector,
                  cause: error,
                }),
            });

            return { matches, count: matches.length } satisfies SelectorResult;
          }),

        extractText: (html: string) =>
          Effect.try({
            try: () => {
              const $ = cheerio.load(html);
              $("script, style, noscript").remove();
              return $("body").text().replaceAll(/\s+/g, " ").trim();
            },
            catch: (error) =>
              new ParserError({
                message: `Failed to extract text: ${String(error)}`,
                cause: error,
              }),
          }),

        extractLinks: (html: string, baseUrl?: string) =>
          Effect.try({
            try: () => {
              const $ = cheerio.load(html);
              const links: ExtractedLink[] = [];
              $("a[href]").each((_, el) => {
                const $el = $(el);
                const href = $el.attr("href");
                if (href) {
                  links.push({
                    href: resolveUrl(href, baseUrl),
                    text: $el.text().trim(),
                    title: $el.attr("title") ?? null,
                  });
                }
              });
              return links;
            },
            catch: (error) =>
              new ParserError({
                message: `Failed to extract links: ${String(error)}`,
                cause: error,
              }),
          }),
      } as const;
    }),
  },
) {}

function resolveUrl(url: string, baseUrl?: string): string {
  if (!baseUrl) return url;
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}
