import * as cf from "cloudflare:workers";

type MalvernEnv = {
  readonly API: Fetcher;
  readonly IS_LOCAL?: string;
};

// TanStack Start dev can evaluate route modules before `cloudflare:workers`
// exposes env. Read through a proxy so server handlers always see the current
// worker env at request time.
export const env = new Proxy({} as MalvernEnv, {
  get(_, prop) {
    return cf.env[prop as keyof typeof cf.env];
  },
});
