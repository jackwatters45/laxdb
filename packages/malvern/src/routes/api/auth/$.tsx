import { createFileRoute } from "@tanstack/react-router";

import { forwardAuthRequest } from "../../../lib/server/auth-proxy";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => forwardAuthRequest(request),
      POST: ({ request }) => forwardAuthRequest(request),
    },
  },
});
