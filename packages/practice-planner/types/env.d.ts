// Practice-planner worker bindings. Alchemy v2 provisions these bindings;
// Cloudflare.InferEnv derives the service binding shape from alchemy.run.ts.

import type { PracticePlannerWorkerEnv } from "../../../alchemy.run.ts";

declare global {
  namespace Cloudflare {
    interface Env extends PracticePlannerWorkerEnv {}
  }

  type Env = Cloudflare.Env;
}
