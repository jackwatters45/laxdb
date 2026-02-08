import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPages } from "content-collections";

import { MDXContent } from "@/components/mdx-content";

export const Route = createFileRoute("/brand")({
  loader: () => {
    const page = allPages.find((p) => p.slug === "brand");
    if (!page) throw notFound();
    return page;
  },
  component: BrandPage,
  head: () => ({
    meta: [
      { title: "Brand Guidelines | LaxDB" },
      {
        name: "description",
        content: "Guidelines for using the LaxDB name and logo.",
      },
    ],
  }),
});

function BrandPage() {
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
