import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import type { Me } from "../core/auth/schema";

export type MeCtx = Me | null;

export const getMe = createServerFn({ method: "GET" }).handler(
  async (): Promise<MeCtx> => {
    const [{ getAuth }, { resolveMe }] = await Promise.all([
      import("./auth.server"),
      import("../core/auth/resolveMe"),
    ]);
    const headers = new Headers(getRequestHeaders());
    return resolveMe(getAuth(), headers);
  },
);
