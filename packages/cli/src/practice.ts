/**
 * Practice CLI
 *
 * Usage:
 *   bun src/practice.ts list --pretty
 *   bun src/practice.ts get <publicId>
 *   bun src/practice.ts create --duration 120 --location "Main Field"
 *   bun src/practice.ts add-item <practiceId> --type drill --drill <drillId>
 *   bun src/practice.ts list-items <practiceId>
 *   bun src/practice.ts review <practiceId> --went-well "Good energy"
 *   bun src/practice.ts --base-url https://api.laxdb.io list
 *   LAXDB_API_URL=https://api.laxdb.io bun src/practice.ts list
 *
 * Add --pretty for formatted JSON output.
 */

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { RpcPracticeClient } from "@laxdb/api-v2/practice/practice.client";
import { makeRpcProtocol } from "@laxdb/api-v2/protocol";
import {
  CreatePracticeInput,
  UpdatePracticeInput,
} from "@laxdb/core-v2/practice/practice.schema";
import { Effect, Layer, Option, Schema } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

import { baseUrlFlag, output, prettyFlag, readStdin } from "./shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const practiceLayer = (baseUrl: string) =>
  RpcPracticeClient.layer.pipe(Layer.provide(makeRpcProtocol(baseUrl)));

// ---------------------------------------------------------------------------
// Practice CRUD
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const practices = yield* client.PracticeList();
      yield* output(practices, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
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
      const client = yield* RpcPracticeClient;
      const practice = yield* client.PracticeGet({ publicId });
      yield* output(practice, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

const nameFlag = Flag.string("name").pipe(
  Flag.withDescription("Practice name"),
  Flag.optional,
);
const dateFlag = Flag.string("date").pipe(
  Flag.withDescription("Practice date (ISO 8601)"),
  Flag.optional,
);
const durationFlag = Flag.integer("duration").pipe(
  Flag.withDescription("Duration in minutes"),
  Flag.optional,
);
const locationFlag = Flag.string("location").pipe(
  Flag.withDescription("Field/facility name"),
  Flag.optional,
);
const statusFlag = Flag.choice("status", [
  "draft",
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
] as const).pipe(Flag.withDescription("Practice status"), Flag.optional);
const descriptionFlag = Flag.string("description").pipe(
  Flag.withDescription("Practice description"),
  Flag.optional,
);
const notesFlag = Flag.string("notes").pipe(
  Flag.withDescription("Coach notes"),
  Flag.optional,
);

const createCommand = Command.make(
  "create",
  {
    name: nameFlag,
    date: dateFlag,
    duration: durationFlag,
    location: locationFlag,
    status: statusFlag,
    description: descriptionFlag,
    notes: notesFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const practice = yield* client.PracticeCreate({
        name: Option.getOrNull(opts.name),
        date: Option.match(opts.date, {
          onNone: () => null,
          onSome: (d) => new Date(d),
        }),
        description: Option.getOrNull(opts.description),
        notes: Option.getOrNull(opts.notes),
        durationMinutes: Option.getOrNull(opts.duration),
        location: Option.getOrNull(opts.location),
        status: Option.getOrUndefined(opts.status),
      });
      yield* output(practice, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
);

const updateCommand = Command.make(
  "update",
  {
    publicId: Argument.string("publicId"),
    name: nameFlag,
    date: dateFlag,
    duration: durationFlag,
    location: locationFlag,
    status: statusFlag,
    description: descriptionFlag,
    notes: notesFlag,
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const practice = yield* client.PracticeUpdate({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        date: Option.match(opts.date, {
          onNone: (): Date | undefined => undefined,
          onSome: (d) => new Date(d),
        }),
        description: Option.getOrUndefined(opts.description),
        notes: Option.getOrUndefined(opts.notes),
        durationMinutes: Option.getOrUndefined(opts.duration),
        location: Option.getOrUndefined(opts.location),
        status: Option.getOrUndefined(opts.status),
      });
      yield* output(practice, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
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
      const client = yield* RpcPracticeClient;
      const practice = yield* client.PracticeDelete({ publicId });
      yield* output(practice, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Practice items
// ---------------------------------------------------------------------------

const addItemCommand = Command.make(
  "add-item",
  {
    practiceId: Argument.string("practiceId"),
    type: Flag.choice("type", [
      "warmup",
      "drill",
      "cooldown",
      "water-break",
      "activity",
    ] as const).pipe(Flag.withDescription("Item type")),
    drill: Flag.string("drill").pipe(
      Flag.withDescription("Drill publicId (for type=drill)"),
      Flag.optional,
    ),
    label: Flag.string("label").pipe(
      Flag.withDescription("Label for non-drill items"),
      Flag.optional,
    ),
    duration: Flag.integer("duration").pipe(
      Flag.withDescription("Duration in minutes"),
      Flag.optional,
    ),
    itemNotes: Flag.string("notes").pipe(
      Flag.withDescription("Item notes"),
      Flag.optional,
    ),
    groups: Flag.string("groups").pipe(
      Flag.withDescription("Groups (comma-separated, e.g. attack,midfield)"),
      Flag.optional,
    ),
    order: Flag.integer("order").pipe(
      Flag.withDescription("Order index"),
      Flag.optional,
    ),
    priority: Flag.choice("priority", [
      "required",
      "optional",
      "if-time",
    ] as const).pipe(Flag.withDescription("Item priority"), Flag.optional),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const groupValues = Option.map(opts.groups, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );

      const item = yield* client.PracticeAddItem({
        practicePublicId: opts.practiceId,
        type: opts.type,
        drillPublicId: Option.getOrUndefined(opts.drill),
        label: Option.getOrUndefined(opts.label),
        durationMinutes: Option.getOrUndefined(opts.duration),
        notes: Option.getOrUndefined(opts.itemNotes),
        groups: Option.getOrUndefined(groupValues),
        orderIndex: Option.getOrUndefined(opts.order),
        priority: Option.getOrUndefined(opts.priority),
      });
      yield* output(item, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
);

const updateItemCommand = Command.make(
  "update-item",
  {
    itemId: Argument.string("itemId"),
    type: Flag.choice("type", [
      "warmup",
      "drill",
      "cooldown",
      "water-break",
      "activity",
    ] as const).pipe(Flag.withDescription("Item type"), Flag.optional),
    drill: Flag.string("drill").pipe(
      Flag.withDescription("Drill publicId"),
      Flag.optional,
    ),
    label: Flag.string("label").pipe(
      Flag.withDescription("Item label"),
      Flag.optional,
    ),
    duration: Flag.integer("duration").pipe(
      Flag.withDescription("Duration in minutes"),
      Flag.optional,
    ),
    itemNotes: Flag.string("notes").pipe(
      Flag.withDescription("Item notes"),
      Flag.optional,
    ),
    groups: Flag.string("groups").pipe(
      Flag.withDescription("Groups (comma-separated)"),
      Flag.optional,
    ),
    order: Flag.integer("order").pipe(
      Flag.withDescription("Order index"),
      Flag.optional,
    ),
    priority: Flag.choice("priority", [
      "required",
      "optional",
      "if-time",
    ] as const).pipe(Flag.withDescription("Item priority"), Flag.optional),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const groupValues = Option.map(opts.groups, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );

      const item = yield* client.PracticeUpdateItem({
        publicId: opts.itemId,
        type: Option.getOrUndefined(opts.type),
        drillPublicId: Option.getOrUndefined(opts.drill),
        label: Option.getOrUndefined(opts.label),
        durationMinutes: Option.getOrUndefined(opts.duration),
        notes: Option.getOrUndefined(opts.itemNotes),
        groups: Option.getOrUndefined(groupValues),
        orderIndex: Option.getOrUndefined(opts.order),
        priority: Option.getOrUndefined(opts.priority),
      });
      yield* output(item, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
);

const removeItemCommand = Command.make(
  "remove-item",
  {
    itemId: Argument.string("itemId"),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ itemId, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const item = yield* client.PracticeRemoveItem({ publicId: itemId });
      yield* output(item, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

const listItemsCommand = Command.make(
  "list-items",
  {
    practiceId: Argument.string("practiceId"),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ practiceId, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const items = yield* client.PracticeListItems({
        practicePublicId: practiceId,
      });
      yield* output(items, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

const reorderItemsCommand = Command.make(
  "reorder-items",
  {
    practiceId: Argument.string("practiceId"),
    order: Flag.string("order").pipe(
      Flag.withDescription("Comma-separated item publicIds in new order"),
    ),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const orderedIds = opts.order
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const items = yield* client.PracticeReorderItems({
        practicePublicId: opts.practiceId,
        orderedIds,
      });
      yield* output(items, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
);

// ---------------------------------------------------------------------------
// Practice review
// ---------------------------------------------------------------------------

const reviewCommand = Command.make(
  "review",
  {
    practiceId: Argument.string("practiceId"),
    wentWell: Flag.string("went-well").pipe(
      Flag.withDescription("What went well"),
      Flag.optional,
    ),
    needsImprovement: Flag.string("needs-improvement").pipe(
      Flag.withDescription("What needs improvement"),
      Flag.optional,
    ),
    reviewNotes: Flag.string("notes").pipe(
      Flag.withDescription("Review notes"),
      Flag.optional,
    ),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;

      // Try to get existing review first; create if not found
      const existing = yield* client
        .PracticeGetReview({ practicePublicId: opts.practiceId })
        .pipe(Effect.option);

      const review = yield* Option.match(existing, {
        onNone: () =>
          client.PracticeCreateReview({
            practicePublicId: opts.practiceId,
            wentWell: Option.getOrNull(opts.wentWell),
            needsImprovement: Option.getOrNull(opts.needsImprovement),
            notes: Option.getOrNull(opts.reviewNotes),
          }),
        onSome: () =>
          client.PracticeUpdateReview({
            practicePublicId: opts.practiceId,
            wentWell: Option.getOrUndefined(opts.wentWell),
            needsImprovement: Option.getOrUndefined(opts.needsImprovement),
            notes: Option.getOrUndefined(opts.reviewNotes),
          }),
      });

      yield* output(review, opts.pretty);
    }).pipe(Effect.provide(practiceLayer(opts.baseUrl))),
);

const getReviewCommand = Command.make(
  "get-review",
  {
    practiceId: Argument.string("practiceId"),
    pretty: prettyFlag,
    baseUrl: baseUrlFlag,
  },
  ({ practiceId, pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const review = yield* client.PracticeGetReview({
        practicePublicId: practiceId,
      });
      yield* output(review, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Bulk subcommands
// ---------------------------------------------------------------------------

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(CreatePracticeInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const practice = yield* client.PracticeCreate(item);
        results.push(practice);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

const bulkUpdateCommand = Command.make(
  "bulk-update",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
        Schema.Array(UpdatePracticeInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const practice = yield* client.PracticeUpdate(item);
        results.push(practice);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

const bulkDeleteCommand = Command.make(
  "bulk-delete",
  { pretty: prettyFlag, baseUrl: baseUrlFlag },
  ({ pretty, baseUrl }) =>
    Effect.gen(function* () {
      const client = yield* RpcPracticeClient;
      const raw = yield* readStdin;
      const ids = yield* Schema.decodeUnknownEffect(
        Schema.Array(Schema.String),
      )(raw);
      const results = [];
      for (const publicId of ids) {
        const practice = yield* client.PracticeDelete({ publicId });
        results.push(practice);
      }
      yield* output(results, pretty);
    }).pipe(Effect.provide(practiceLayer(baseUrl))),
);

// ---------------------------------------------------------------------------
// Root command + CLI runner
// ---------------------------------------------------------------------------

const practiceCommand = Command.make("practice").pipe(
  Command.withSubcommands([
    listCommand,
    getCommand,
    createCommand,
    updateCommand,
    deleteCommand,
    addItemCommand,
    updateItemCommand,
    removeItemCommand,
    listItemsCommand,
    reorderItemsCommand,
    reviewCommand,
    getReviewCommand,
    bulkCreateCommand,
    bulkUpdateCommand,
    bulkDeleteCommand,
  ]),
);

Command.run(practiceCommand, { version: "0.1.0" }).pipe(
  Effect.provide(BunServices.layer),
  BunRuntime.runMain,
);
