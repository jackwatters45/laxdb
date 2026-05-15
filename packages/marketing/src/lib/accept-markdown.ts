import { publishedPosts } from "@/lib/posts";

interface AcceptPreference {
  mediaType: string;
  quality: number;
  order: number;
}

const markdownMediaType = "text/markdown";
const htmlMediaType = "text/html";
const wildcardMediaType = "*/*";

function parseQuality(value: string | undefined): number {
  if (value === undefined) return 1;

  const quality = Number.parseFloat(value.trim());
  if (!Number.isFinite(quality)) return 0;
  if (quality < 0) return 0;
  if (quality > 1) return 1;
  return quality;
}

function parseAcceptHeader(header: string | null): AcceptPreference[] {
  if (header === null || header.trim().length === 0) {
    return [{ mediaType: wildcardMediaType, quality: 1, order: 0 }];
  }

  return header
    .split(",")
    .map((part, order): AcceptPreference | undefined => {
      const [rawMediaType, ...rawParameters] = part.split(";");
      const mediaType = rawMediaType?.trim().toLowerCase();
      if (!mediaType) return undefined;

      const qualityParameter = rawParameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));
      const quality = parseQuality(qualityParameter?.slice(2));

      return { mediaType, quality, order };
    })
    .filter((preference) => preference !== undefined);
}

function mediaTypeMatches(preference: string, offered: string): boolean {
  if (preference === wildcardMediaType) return true;
  if (preference === offered) return true;

  const [preferenceType, preferenceSubtype] = preference.split("/");
  const [offeredType] = offered.split("/");
  return preferenceSubtype === "*" && preferenceType === offeredType;
}

function qualityFor(preferences: readonly AcceptPreference[], offered: string): number {
  return (
    preferences
      .filter((preference) => mediaTypeMatches(preference.mediaType, offered))
      .toSorted(
        (left, right) => right.mediaType.length - left.mediaType.length || left.order - right.order,
      )
      .at(0)?.quality ?? 0
  );
}

export type NegotiatedContent = "markdown" | "html" | "not-acceptable";

export function negotiateAcceptHeader(header: string | null): NegotiatedContent {
  const preferences = parseAcceptHeader(header);
  const markdownQuality = qualityFor(preferences, markdownMediaType);
  const htmlQuality = qualityFor(preferences, htmlMediaType);

  if (markdownQuality === 0 && htmlQuality === 0) return "not-acceptable";
  if (markdownQuality > htmlQuality) return "markdown";
  return "html";
}

function mergeVary(existing: string | null, value: string): string {
  if (existing === null || existing.trim().length === 0) return value;

  const values = new Set(
    existing
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
  values.add(value);
  return [...values].join(", ");
}

export function setAcceptVary(headers: Headers): void {
  headers.set("Vary", mergeVary(headers.get("Vary"), "Accept"));
}

function postToMarkdown(slug: string): string | undefined {
  const post = publishedPosts.find((candidate) => candidate.slug === slug);
  if (!post) return undefined;

  const metadata = [
    `# ${post.title}`,
    "",
    `Published: ${post.published}`,
    post.updated ? `Updated: ${post.updated}` : undefined,
    post.authors && post.authors.length > 0 ? `Authors: ${post.authors.join(", ")}` : undefined,
    post.description ? `Description: ${post.description}` : undefined,
  ].filter((line) => line !== undefined);

  return `${metadata.join("\n")}\n\n${post.markdown.trim()}\n`;
}

export function markdownResponseForContentSlug(slug: string): Response {
  const markdown = postToMarkdown(slug);
  if (markdown === undefined) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}

export function notAcceptableResponse(): Response {
  return new Response("Not acceptable", {
    status: 406,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Vary: "Accept",
    },
  });
}
