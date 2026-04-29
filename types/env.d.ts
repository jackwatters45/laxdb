// API worker bindings. Keep this manual while Alchemy v2 beta exports source types
// that do not typecheck under this repo's strict package tsconfigs.

export interface ApiCloudflareEnv {
  ALCHEMY_STACK_NAME: string;
  ALCHEMY_STAGE: string;
  DB: D1Database;
  KV: KVNamespace;
  STORAGE: R2Bucket;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  POLAR_WEBHOOK_SECRET: string;
  AWS_REGION: string;
  EMAIL_SENDER: string;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends ApiCloudflareEnv {}
  }
}
