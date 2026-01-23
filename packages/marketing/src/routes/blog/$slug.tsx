import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect old /blog/{slug} URLs to /content/{slug}
export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/content/$slug",
      params: { slug: params.slug },
      statusCode: 301,
    });
  },
});
