import { createFileRoute } from "@tanstack/react-router";

import { FadeContainer, FadeDiv } from "@/components/fade";
import { ChangelogEntryCard } from "@/components/changelog-entry";
import { publishedChangelogs } from "@/lib/changelog-posts";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
});

function ChangelogPage() {
  return (
    <FadeContainer>
      <main className="mx-auto max-w-4xl px-4 py-16 md:py-32">
        <FadeDiv>
          <header className="mb-10">
            <h1 className="font-serif text-2xl text-foreground italic">Changelog</h1>
          </header>
        </FadeDiv>

        <div className="mt-12">
          {publishedChangelogs.map((entry) => (
            <ChangelogEntryCard entry={entry} key={entry.slug} />
          ))}
        </div>
      </main>
    </FadeContainer>
  );
}
