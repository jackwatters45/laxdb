/**
 * Player CLI
 *
 * Usage:
 *   bun src/player.ts list --pretty
 *   bun src/player.ts get <publicId>
 *   bun src/player.ts create --name "John Doe" --email john@example.com
 *   bun src/player.ts update --name "Jane Doe" <publicId>
 *   bun src/player.ts delete <publicId>
 *   echo '[...]' | bun src/player.ts bulk-create
 *   echo '["id1","id2"]' | bun src/player.ts bulk-delete
 *   bun src/player.ts --base-url https://api.laxdb.io list
 *   LAXDB_API_URL=https://api.laxdb.io bun src/player.ts list
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { RpcApiClient } from "@laxdb/api/client";
import {
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@laxdb/core/player/player.schema";
import { Effect, Option, Schema } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

import { apiLayer, baseUrlFlag, output, prettyFlag, readStdin } from "./shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const players = yield* client.PlayerList();
      yield* output(players, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const getCommand = Command.make(
  "get",
  {
    publicId: Argument.string("publicId"),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ publicId, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const player = yield* client.PlayerGet({ publicId });
      yield* output(player, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const createCommand = Command.make(
  "create",
  {
    name: Flag.string("name").pipe(Flag.withDescription("Player name")),
    email: Flag.string("email").pipe(Flag.withDescription("Player email")),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const player = yield* client.PlayerCreate({
        name: opts.name,
        email: opts.email,
      });
      yield* output(player, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

const updateCommand = Command.make(
  "update",
  {
    publicId: Argument.string("publicId"),
    name: Flag.string("name").pipe(
      Flag.withDescription("Player name"),
      Flag.optional,
    ),
    email: Flag.string("email").pipe(
      Flag.withDescription("Player email"),
      Flag.optional,
    ),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const player = yield* client.PlayerUpdate({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        email: Option.getOrUndefined(opts.email),
      });
      yield* output(player, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

const deleteCommand = Command.make(
  "delete",
  {
    publicId: Argument.string("publicId"),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ publicId, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const player = yield* client.PlayerDelete({ publicId });
      yield* output(player, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Bulk subcommands
// ---------------------------------------------------------------------------

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(CreatePlayerInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const player = yield* client.PlayerCreate(item);
        results.push(player);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const bulkUpdateCommand = Command.make(
  "bulk-update",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(UpdatePlayerInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const player = yield* client.PlayerUpdate(item);
        results.push(player);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const bulkDeleteCommand = Command.make(
  "bulk-delete",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const raw = yield* readStdin;
      const ids = yield* Schema.decodeUnknownEffect(
        Schema.Array(Schema.String),
      )(raw);
      const results = [];
      for (const publicId of ids) {
        const player = yield* client.PlayerDelete({ publicId });
        results.push(player);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Root command + CLI runner
// ---------------------------------------------------------------------------

const playerCommand = Command.make("player").pipe(
  Command.withSubcommands([
    listCommand,
    getCommand,
    createCommand,
    updateCommand,
    deleteCommand,
    bulkCreateCommand,
    bulkUpdateCommand,
    bulkDeleteCommand,
  ]),
);

Command.run(playerCommand, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
