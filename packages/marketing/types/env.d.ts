declare module "cloudflare:workers" {
  export const env: Cloudflare.Env;

  namespace Cloudflare {
    interface Env {
      STORAGE: R2Bucket;
    }
  }
}
