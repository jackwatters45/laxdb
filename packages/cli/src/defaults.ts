/**
 * Defaults CLI
 *
 * Usage:
 *   bun src/defaults.ts get --scope-type global --scope-id global --namespace practice
 *   bun src/defaults.ts patch --scope-type global --scope-id global --namespace practice --values '{"durationMinutes":120}'
 *   echo '{"durationMinutes":120}' | bun src/defaults.ts patch --scope-type global --scope-id global --namespace practice
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { RpcApiClient } from "@laxdb/api/client";
import { DefaultsValues } from "@laxdb/core/defaults/defaults.schema";
import { Effect, Option, Schema } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import { apiLayer, baseUrlFlag, output, prettyFlag, readStdin } from "./shared";

const scopeTypeFlag = Flag.choice("scope-type", [
  "global",
  "user",
  "team",
  "org",
] as const).pipe(Flag.withDescription("Defaults scope type"));
const scopeIdFlag = Flag.string("scope-id").pipe(
  Flag.withDescription("Defaults scope identifier"),
);
const namespaceFlag = Flag.string("namespace").pipe(
  Flag.withDescription("Defaults namespace"),
);
const valuesFlag = Flag.string("values").pipe(
  Flag.withDescription(
    "JSON object of values; falls back to stdin when omitted",
  ),
  Flag.optional,
);

const decodeDefaultsValues = Schema.decodeUnknownEffect(DefaultsValues);

const parseJsonValue = (value: string, flagName: string) =>
  Effect.try({
    try: (): unknown => JSON.parse(value),
    catch: (error: unknown) =>
      new Error(`Failed to parse ${flagName} JSON: ${String(error)}`),
  });

const getCommand = Command.make(
  "get",
  {
    scopeType: scopeTypeFlag,
    scopeId: scopeIdFlag,
    namespace: namespaceFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ scopeType, scopeId, namespace, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const values = yield* client.DefaultsGetNamespace({
        scopeType,
        scopeId,
        namespace,
      });
      yield* output(values, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const patchCommand = Command.make(
  "patch",
  {
    scopeType: scopeTypeFlag,
    scopeId: scopeIdFlag,
    namespace: namespaceFlag,
    values: valuesFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const rawValues = yield* Option.match(opts.values, {
        onNone: () => readStdin,
        onSome: (value) => parseJsonValue(value, "--values"),
      });
      const values = yield* decodeDefaultsValues(rawValues);
      const updated = yield* client.DefaultsPatchNamespace({
        scopeType: opts.scopeType,
        scopeId: opts.scopeId,
        namespace: opts.namespace,
        values,
      });
      yield* output(updated, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

const defaultsCommand = Command.make("defaults").pipe(
  Command.withSubcommands([getCommand, patchCommand]),
);

Command.run(defaultsCommand, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
