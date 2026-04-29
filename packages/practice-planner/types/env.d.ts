// Practice-planner worker bindings. Keep this manual while Alchemy v2 beta
// exports source types that do not typecheck under this repo's strict package
// tsconfigs.

export interface PracticePlannerCloudflareEnv {
  ALCHEMY_STACK_NAME: string;
  ALCHEMY_STAGE: string;
  API: Fetcher;
  IS_LOCAL: string;
}

declare global {
  type Env = PracticePlannerCloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends PracticePlannerCloudflareEnv {}
  }
}
