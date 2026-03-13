/**
 * Player CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/player.ts list
 *   infisical run --env=dev -- bun src/player.ts get <publicId>
 *   infisical run --env=dev -- bun src/player.ts create --name "John Doe" --email john@example.com
 *   infisical run --env=dev -- bun src/player.ts update --name "Jane Doe" <publicId>
 *   infisical run --env=dev -- bun src/player.ts delete <publicId>
 *   echo '[...]' | infisical run --env=dev -- bun src/player.ts bulk-create
 *   echo '["id1","id2"]' | infisical run --env=dev -- bun src/player.ts bulk-delete
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import {
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@laxdb/core-v2/player/player.schema";
import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer, Option, Schema } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const prettyFlag = Flag.boolean("pretty").pipe(
  Flag.withDescription("Pretty-print JSON output"),
  Flag.withDefault(false),
);

const output = (data: unknown, pretty: boolean) =>
  Effect.sync(() => {
    console.log(pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  });

const readStdin = Effect.tryPromise({
  try: async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  },
  catch: (e: unknown) =>
    new Error(`Failed to read JSON from stdin: ${String(e)}`),
});

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const players = yield* svc.list();
      yield* output(players, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const player = yield* svc.getByPublicId({ publicId });
      yield* output(player, pretty);
    }),
);

const createCommand = Command.make(
  "create",
  {
    name: Flag.string("name").pipe(Flag.withDescription("Player name")),
    email: Flag.string("email").pipe(Flag.withDescription("Player email")),
    pretty: prettyFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const player = yield* svc.create({ name: opts.name, email: opts.email });
      yield* output(player, opts.pretty);
    }),
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
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const player = yield* svc.update({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        email: Option.getOrUndefined(opts.email),
      });
      yield* output(player, opts.pretty);
    }),
);

const deleteCommand = Command.make(
  "delete",
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const player = yield* svc.delete({ publicId });
      yield* output(player, pretty);
    }),
);

// ---------------------------------------------------------------------------
// Bulk subcommands
// ---------------------------------------------------------------------------

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(CreatePlayerInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const player = yield* svc.create(item);
        results.push(player);
      }
      yield* output(results, pretty);
    }),
);

const bulkUpdateCommand = Command.make(
  "bulk-update",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(UpdatePlayerInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const player = yield* svc.update(item);
        results.push(player);
      }
      yield* output(results, pretty);
    }),
);

const bulkDeleteCommand = Command.make(
  "bulk-delete",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const ids = (yield* readStdin) as ReadonlyArray<string>;
      const results = [];
      for (const publicId of ids) {
        const player = yield* svc.delete({ publicId });
        results.push(player);
      }
      yield* output(results, pretty);
    }),
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
  Effect.provide(Layer.mergeAll(PlayerService.layer, BunServices.layer)),
  BunRuntime.runMain,
);
