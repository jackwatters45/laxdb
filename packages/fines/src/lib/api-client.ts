import { makeApiClientLayer, type ApiClient } from "@laxdb/api/client";
import { env } from "cloudflare:workers";
import { type Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

type ApiServiceBinding = {
  readonly fetch: typeof fetch;
};

type ApiEnv = {
  readonly API: ApiServiceBinding;
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isApiEnv = (value: unknown): value is ApiEnv =>
  isRecord(value) && isRecord(value.API) && "fetch" in value.API;

const getApiFetch = (): typeof globalThis.fetch => {
  const workerEnv: unknown = env;
  if (!isApiEnv(workerEnv)) {
    throw new Error("Fines worker API binding is invalid");
  }
  const apiFetch: typeof globalThis.fetch = (input, init) =>
    workerEnv.API.fetch(input, init);
  return apiFetch;
};

const buildRuntime = () =>
  ManagedRuntime.make(
    makeApiClientLayer("http://api").pipe(
      Layer.provide(
        FetchHttpClient.layer.pipe(
          Layer.provide(Layer.succeed(FetchHttpClient.Fetch, getApiFetch())),
        ),
      ),
    ),
  );

let runtime: ReturnType<typeof buildRuntime> | undefined;

export async function runApi<A, E>(
  effect: Effect.Effect<A, E, ApiClient>,
): Promise<A> {
  const result = await (runtime ??= buildRuntime()).runPromise(effect);
  return structuredClone(result);
}
