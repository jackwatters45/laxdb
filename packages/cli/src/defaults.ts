/**
 * Defaults CLI
 *
 * Usage:
 *   bun src/defaults.ts get --scope-type global --scope-id system --namespace practice --pretty
 *   bun src/defaults.ts patch --scope-type user --scope-id usr123 --namespace practice --values '{"duration": 90}'
 *   bun src/defaults.ts --base-url https://api.laxdb.io get --scope-type global --scope-id system --namespace practice
 *   LAXDB_API_URL=https://api.laxdb.io bun src/defaults.ts get --scope-type global --scope-id system --namespace practice
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { RpcApiClient } from "@laxdb/api/client";
import { Effect, Schema } from "effect";
import { Command, Flag } from "effect/unstable/cli";

import { apiLayer, baseUrlFlag, output, prettyFlag } from "./shared";

// ---------------------------------------------------------------------------
// Shared scope flags
// ---------------------------------------------------------------------------

const scopeTypeValues = ["global", "user", "team", "org"] as const;

const scopeTypeFlag = Flag.choice("scope-type", scopeTypeValues).pipe(
  Flag.withDescription("Scope type (global, user, team, org)"),
);

const scopeIdFlag = Flag.string("scope-id").pipe(
  Flag.withDescription("Scope ID"),
);

const namespaceFlag = Flag.string("namespace").pipe(
  Flag.withDescription("Settings namespace"),
);

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const getCommand = Command.make(
  "get",
  {
    scopeType: scopeTypeFlag,
    scopeId: scopeIdFlag,
    namespace: namespaceFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const defaults = yield* client.DefaultsGetNamespace({
        scopeType: opts.scopeType,
        scopeId: opts.scopeId,
        namespace: opts.namespace,
      });
      yield* output(defaults, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

const patchCommand = Command.make(
  "patch",
  {
    scopeType: scopeTypeFlag,
    scopeId: scopeIdFlag,
    namespace: namespaceFlag,
    values: Flag.string("values").pipe(
      Flag.withDescription("JSON string of key-value pairs to set"),
    ),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const raw = yield* Effect.try({
        try: () => JSON.parse(opts.values) as unknown,
        catch: () => new Error("--values must be valid JSON"),
      });
      const parsed = yield* Schema.decodeUnknownEffect(
        Schema.Record(Schema.String, Schema.Unknown),
      )(raw);
      const defaults = yield* client.DefaultsPatchNamespace({
        scopeType: opts.scopeType,
        scopeId: opts.scopeId,
        namespace: opts.namespace,
        values: parsed,
      });
      yield* output(defaults, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

// ---------------------------------------------------------------------------
// Root command + CLI runner
// ---------------------------------------------------------------------------

const defaultsCommand = Command.make("defaults").pipe(
  Command.withSubcommands([getCommand, patchCommand]),
);

Command.run(defaultsCommand, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
