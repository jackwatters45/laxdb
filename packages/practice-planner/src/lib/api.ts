/**
 * Effect RPC client for the api-v2 worker.
 *
 * Uses the `API` service binding (Cloudflare Worker-to-Worker fetch)
 * when available, falls back to URL-based fetch for local dev.
 *
 * Server-only — import this only in server functions / loaders.
 */
import { RpcClientLive } from "@laxdb/api-v2/client";
import type { RpcDrillClient } from "@laxdb/api-v2/drill/drill.client";
import type { RpcPracticeClient } from "@laxdb/api-v2/practice/practice.client";
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

// ---------------------------------------------------------------------------
// Service binding access
// ---------------------------------------------------------------------------

interface CloudflareEnv {
  API?: { fetch: typeof fetch };
}

function getServiceBindingFetch(): typeof fetch | undefined {
  try {
    // oxlint-disable-next-line @typescript-eslint/no-require-imports
    const { env } = require("cloudflare:workers") as { env: CloudflareEnv };
    if (env.API) {
      return env.API.fetch.bind(env.API);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Protocol layer
// ---------------------------------------------------------------------------

function makeProtocol() {
  const bindingFetch = getServiceBindingFetch();

  if (bindingFetch) {
    // Service binding — use its fetch as the transport, URL is relative
    return RpcClient.layerProtocolHttp({ url: "http://api/rpc" }).pipe(
      Layer.provide([
        FetchHttpClient.layer.pipe(
          Layer.provide(Layer.succeed(FetchHttpClient.Fetch, bindingFetch)),
        ),
        RpcSerialization.layerNdjson,
      ]),
    );
  }

  // Fallback — direct fetch (local dev without bindings)
  const apiUrl = process.env.API_URL ?? "http://localhost:8787";
  return RpcClient.layerProtocolHttp({ url: `${apiUrl}/rpc` }).pipe(
    Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
  );
}

// ---------------------------------------------------------------------------
// Full client layer
// ---------------------------------------------------------------------------

export const ApiLive = RpcClientLive.pipe(Layer.provide(makeProtocol()));

// ---------------------------------------------------------------------------
// Convenience runner
// ---------------------------------------------------------------------------

export function runApi<A, E>(
  effect: Effect.Effect<A, E, RpcPracticeClient | RpcDrillClient>,
): Promise<A> {
  return Effect.runPromise(Effect.provide(effect, ApiLive));
}
