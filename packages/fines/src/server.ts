import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import api from "./api/index";

const startHandler = createStartHandler(defaultStreamHandler);

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS?: string;
};

type Ctx = { waitUntil: (promise: Promise<unknown>) => void };

export default {
  fetch(req: Request, env: Bindings, _ctx: Ctx) {
    const url = new URL(req.url);
    if (
      url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/api/auth/")
    ) {
      return api.fetch(req, env);
    }
    return startHandler(req);
  },
};
