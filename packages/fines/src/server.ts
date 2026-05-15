import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

const startHandler = createStartHandler(defaultStreamHandler);

// TanStack Start server entry. API calls should be modeled as route handlers or
// createServerFn calls; avoid adding broad API proxying here.
export default {
  fetch(req: Request) {
    return startHandler(req);
  },
};
