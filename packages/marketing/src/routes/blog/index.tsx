import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { KnowledgeGraph } from "../../components/ui/knowledge-graph";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  const navigate = useNavigate();
  const sortedPosts = [...allPosts].toSorted(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );

  const handleNodeClick = (slug: string) => {
    navigate({ to: "/blog/$slug", params: { slug } });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-32">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Blog</h1>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">Knowledge Graph</h2>
        <KnowledgeGraph posts={allPosts} onNodeClick={handleNodeClick} />
      </section>
      <ul className="space-y-8">
        {sortedPosts.map((post) => (
          <li key={post.slug}>
            <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block">
              <article className="rounded-lg border border-gray-200 p-6 transition-colors hover:border-orange-300 hover:bg-orange-50/50">
                <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-orange-600">
                  {post.title}
                </h2>
                {post.excerpt && <p className="mt-2 text-gray-600">{post.excerpt}</p>}
                <span className="mt-4 block text-sm text-gray-500">
                  {new Date(post.published).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
