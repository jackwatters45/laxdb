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

import { Args, Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import {
  CreatePlayerInput,
  UpdatePlayerInput,
} from "@laxdb/core-v2/player/player.schema";
import { PlayerService } from "@laxdb/core-v2/player/player.service";
import { Effect, Layer, Option, Schema } from "effect";

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const prettyOption = Options.boolean("pretty").pipe(
  Options.withDescription("Pretty-print JSON output"),
  Options.withDefault(false),
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
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const players = yield* svc.list();
      yield* output(players, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
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
    name: Options.text("name").pipe(Options.withDescription("Player name")),
    email: Options.text("email").pipe(Options.withDescription("Player email")),
    pretty: prettyOption,
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
    publicId: Args.text({ name: "publicId" }),
    name: Options.text("name").pipe(
      Options.withDescription("Player name"),
      Options.optional,
    ),
    email: Options.text("email").pipe(
      Options.withDescription("Player email"),
      Options.optional,
    ),
    pretty: prettyOption,
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
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
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
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknown(
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
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PlayerService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknown(
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
  { pretty: prettyOption },
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

const cli = Command.run(playerCommand, {
  name: "player",
  version: "0.1.0",
});

cli(process.argv).pipe(
  Effect.provide(Layer.mergeAll(PlayerService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
