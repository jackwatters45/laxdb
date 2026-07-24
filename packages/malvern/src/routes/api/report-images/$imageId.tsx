import { createFileRoute } from "@tanstack/react-router";

import { forwardApiRequest } from "../../../lib/server/auth-proxy";

export const Route = createFileRoute("/api/report-images/$imageId")({
  server: {
    handlers: {
      GET: ({ request }) => forwardApiRequest(request),
    },
  },
});
