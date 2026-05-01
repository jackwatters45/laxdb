// This file infers practice-planner bindings from Alchemy.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

import type { practicePlanner } from "../../../alchemy.run.ts";

export type PracticePlannerCloudflareEnv = typeof practicePlanner.Env;

declare global {
  type Env = PracticePlannerCloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends PracticePlannerCloudflareEnv {}
  }
}
