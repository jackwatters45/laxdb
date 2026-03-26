// Cloudflare Workers env bindings for practice-planner
// Matches bindings declared in alchemy.run.ts for practicePlanner



declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env {
      API: Fetcher;
    }
  }
}
