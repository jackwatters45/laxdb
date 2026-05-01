// This file infers API worker bindings from Alchemy.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

import type { api } from "../alchemy.run.ts";

export type ApiCloudflareEnv = typeof api.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends ApiCloudflareEnv {}
  }
}
