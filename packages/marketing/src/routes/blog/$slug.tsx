import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts, type Post } from "content-collections";
import { MDXContent } from "@/components/mdx-content";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }: { params: { slug: string } }): Post => {
    const post = allPosts.find((p) => p.slug === params.slug);
    if (!post) {
      throw notFound();
    }
    return post;
  },
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();

  if (!post) {
    throw notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-32">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
          <p className="mt-4 text-gray-600">
            By {post.authors.join(", ")} on{" "}
            {new Date(post.published).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>
        <MDXContent code={post.mdx} className="prose prose-gray max-w-none" />
      </article>
    </main>
  );
}
