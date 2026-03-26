/**
 * Shared CLI utilities
 *
 * Common flags and helpers used across all CLI subcommands.
 */

import { RpcApiClient } from "@laxdb/api-v2/client";
import { makeRpcProtocol } from "@laxdb/api-v2/protocol";
import { Effect, Layer } from "effect";
import { Flag } from "effect/unstable/cli";

export const prettyFlag = Flag.boolean("pretty").pipe(
  Flag.withDescription("Pretty-print JSON output"),
  Flag.withDefault(false),
);

export const baseUrlFlag = Flag.string("base-url").pipe(
  Flag.withDescription("API base URL"),
  Flag.withDefault(process.env.LAXDB_API_URL ?? "http://localhost:1337"),
);

export const output = (data: unknown, pretty: boolean) =>
  Effect.sync(() => {
    console.log(pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  });

export const readStdin: Effect.Effect<unknown, Error> = Effect.tryPromise({
  try: () => Bun.stdin.text().then((text): unknown => JSON.parse(text)),
  catch: (e: unknown) =>
    new Error(`Failed to read JSON from stdin: ${String(e)}`),
});

export const apiLayer = (baseUrl: string) =>
  RpcApiClient.layer.pipe(Layer.provide(makeRpcProtocol(baseUrl)));
