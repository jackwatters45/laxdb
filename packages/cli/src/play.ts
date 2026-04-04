/**
 * Play CLI
 *
 * Usage:
 *   bun src/play.ts list --pretty
 *   bun src/play.ts get <publicId>
 *   bun src/play.ts create --name "Zone Offense" --category offense
 *   bun src/play.ts update <publicId> --name "Updated Play"
 *   bun src/play.ts delete <publicId>
 *   echo '[...]' | bun src/play.ts bulk-create
 *   echo '["id1","id2"]' | bun src/play.ts bulk-delete
 *   bun src/play.ts --base-url https://api.laxdb.io list
 *   LAXDB_API_URL=https://api.laxdb.io bun src/play.ts list
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { RpcApiClient } from "@laxdb/api/client";
import { CreatePlayInput, UpdatePlayInput } from "@laxdb/core/play/play.schema";
import { Effect, Option, Schema } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

import { apiLayer, baseUrlFlag, output, prettyFlag, readStdin } from "./shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseCsv = (csv: string) =>
  csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const playCategoryValues = [
  "offense",
  "defense",
  "clear",
  "ride",
  "faceoff",
  "emo",
  "man-down",
  "transition",
] as const;

// ---------------------------------------------------------------------------
// Shared field flags
// ---------------------------------------------------------------------------

const formationFlag = Flag.string("formation").pipe(
  Flag.withDescription("Play formation"),
  Flag.optional,
);
const descriptionFlag = Flag.string("description").pipe(
  Flag.withDescription("Play description"),
  Flag.optional,
);
const personnelNotesFlag = Flag.string("personnel-notes").pipe(
  Flag.withDescription("Personnel notes"),
  Flag.optional,
);
const tagsFlag = Flag.string("tags").pipe(
  Flag.withDescription("Tags (comma-separated)"),
  Flag.optional,
);
const diagramUrlFlag = Flag.string("diagram-url").pipe(
  Flag.withDescription("Diagram URL"),
  Flag.optional,
);
const videoUrlFlag = Flag.string("video-url").pipe(
  Flag.withDescription("Video URL"),
  Flag.optional,
);

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const plays = yield* client.PlayList();
      yield* output(plays, pretty);
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
      const play = yield* client.PlayGet({ publicId });
      yield* output(play, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

const createCommand = Command.make(
  "create",
  {
    name: Flag.string("name").pipe(Flag.withDescription("Play name")),
    category: Flag.choice("category", playCategoryValues).pipe(
      Flag.withDescription("Play category"),
    ),
    formation: formationFlag,
    description: descriptionFlag,
    personnelNotes: personnelNotesFlag,
    tags: tagsFlag,
    diagramUrl: diagramUrlFlag,
    videoUrl: videoUrlFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const tagValues = Option.map(opts.tags, (csv) => parseCsv(csv));

      const play = yield* client.PlayCreate({
        name: opts.name,
        category: opts.category,
        formation: Option.getOrNull(opts.formation),
        description: Option.getOrNull(opts.description),
        personnelNotes: Option.getOrNull(opts.personnelNotes),
        tags: Option.getOrUndefined(tagValues),
        diagramUrl: Option.getOrNull(opts.diagramUrl),
        videoUrl: Option.getOrNull(opts.videoUrl),
      });
      yield* output(play, opts.pretty);
    }).pipe(Effect.provide(apiLayer(opts.baseUrl))),
);

const updateCommand = Command.make(
  "update",
  {
    publicId: Argument.string("publicId"),
    name: Flag.string("name").pipe(
      Flag.withDescription("Play name"),
      Flag.optional,
    ),
    category: Flag.choice("category", playCategoryValues).pipe(
      Flag.withDescription("Play category"),
      Flag.optional,
    ),
    formation: formationFlag,
    description: descriptionFlag,
    personnelNotes: personnelNotesFlag,
    tags: tagsFlag,
    diagramUrl: diagramUrlFlag,
    videoUrl: videoUrlFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const tagValues = Option.map(opts.tags, (csv) => parseCsv(csv));

      const play = yield* client.PlayUpdate({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        category: Option.getOrUndefined(opts.category),
        formation: Option.getOrUndefined(opts.formation),
        description: Option.getOrUndefined(opts.description),
        personnelNotes: Option.getOrUndefined(opts.personnelNotes),
        tags: Option.getOrUndefined(tagValues),
        diagramUrl: Option.getOrUndefined(opts.diagramUrl),
        videoUrl: Option.getOrUndefined(opts.videoUrl),
      });
      yield* output(play, opts.pretty);
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
      const play = yield* client.PlayDelete({ publicId });
      yield* output(play, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Bulk subcommands (read JSON from stdin)
// ---------------------------------------------------------------------------

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(CreatePlayInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const play = yield* client.PlayCreate(item);
        results.push(play);
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
        const play = yield* client.PlayDelete({ publicId });
        results.push(play);
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
        Schema.Array(UpdatePlayInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const play = yield* client.PlayUpdate(item);
        results.push(play);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(apiLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Root command + CLI runner
// ---------------------------------------------------------------------------

const playCommand = Command.make("play").pipe(
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

Command.run(playCommand, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
