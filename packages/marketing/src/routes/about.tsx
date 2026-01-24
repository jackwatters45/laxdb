import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPages } from "content-collections";

import { MDXContent } from "@/components/mdx-content";

export const Route = createFileRoute("/about")({
  loader: () => {
    const page = allPages.find((p) => p.slug === "about");
    if (!page) throw notFound();
    return page;
  },
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About | LaxDB" },
      {
        name: "description",
        content:
          "LaxDB is the comprehensive lacrosse data platform, unifying statistics from PLL, NLL, MLL, MSL, and WLA.",
      },
    ],
  }),
});

function AboutPage() {
  const page = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-screen-sm px-4 py-16 md:py-32">
      <article>
        <h1 className="font-serif text-2xl text-blog-fg italic">{page.title}</h1>
        <MDXContent code={page.mdx} className="prose-blog prose mt-8 max-w-none" />
      </article>
    </main>
  );
}
