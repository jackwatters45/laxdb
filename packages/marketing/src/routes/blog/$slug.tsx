import { createFileRoute, redirect } from "@tanstack/react-router";

import { throwRouterError } from "@/lib/router-throws";

// Redirect old /blog/{slug} URLs to /content/{slug}
export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) =>
    throwRouterError(
      redirect({
        to: "/content/$slug",
        params: { slug: params.slug },
        statusCode: 301,
      }),
    ),
});
