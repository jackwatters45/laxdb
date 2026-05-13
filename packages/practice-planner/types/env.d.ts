// Practice-planner worker bindings. Alchemy v2 provisions these bindings;
// this file only augments Cloudflare's worker runtime types for package-local TS.

export interface PracticePlannerCloudflareEnv {
  ALCHEMY_STACK_NAME: string;
  ALCHEMY_STAGE: string;
  API: Fetcher;
  IS_LOCAL: string;
}

declare global {
  namespace Cloudflare {
    interface Env extends PracticePlannerCloudflareEnv {}
  }

  type Env = Cloudflare.Env;
}
