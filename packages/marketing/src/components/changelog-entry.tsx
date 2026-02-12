import type { Changelog } from "content-collections";

import { FadeDiv } from "@/components/fade";
import { MDXContent } from "@/components/mdx-content";
import { formatPublishedDate } from "@/lib/date";
import { CATEGORY_LABELS } from "@/lib/changelog";

export function ChangelogEntryCard({ entry }: { entry: Changelog }) {
  return (
    <FadeDiv className="flex gap-6 md:gap-10">
      {/* Date column — desktop only */}
      <div className="hidden w-[140px] shrink-0 pt-0.5 text-right md:block">
        <time className="text-xs whitespace-nowrap text-subtle" dateTime={entry.published}>
          {formatPublishedDate(entry.published)}
        </time>
      </div>

      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className="size-2.5 shrink-0 rounded-full bg-orange ring-4 ring-background" />
        <div
          className="w-px flex-1"
          style={{
            maskImage: "linear-gradient(white, white 80%, transparent)",
          }}
        >
          <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none">
            <line
              className="stroke-border"
              strokeDasharray="3 3"
              strokeWidth="2"
              x1="0"
              x2="0"
              y1="0"
              y2="100%"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-16">
        {/* Mobile date */}
        <time className="mb-2 block text-xs text-subtle md:hidden" dateTime={entry.published}>
          {formatPublishedDate(entry.published)}
        </time>

        <h2 className="font-serif text-xl text-foreground italic md:text-2xl">{entry.title}</h2>
        <span className="text-label mt-1 inline-block text-xs">
          {CATEGORY_LABELS[entry.category]}
        </span>

        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{entry.summary}</p>

        <MDXContent
          code={entry.mdx}
          className="prose-blog prose mt-4 max-w-none text-[15px] leading-relaxed"
        />
      </div>
    </FadeDiv>
  );
}
