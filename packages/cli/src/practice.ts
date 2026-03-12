/**
 * Practice CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/practice.ts list
 *   infisical run --env=dev -- bun src/practice.ts get <publicId>
 *   infisical run --env=dev -- bun src/practice.ts create --duration 120 --location "Main Field"
 *   infisical run --env=dev -- bun src/practice.ts add-item <practiceId> --type drill --drill <drillId>
 *   infisical run --env=dev -- bun src/practice.ts list-items <practiceId>
 *   infisical run --env=dev -- bun src/practice.ts review <practiceId> --went-well "Good energy"
 *
 * Add --pretty for formatted JSON output.
 */

import { Args, Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Option, Schema } from "effect";

import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
import {
  CreatePracticeInput,
  UpdatePracticeInput,
} from "@laxdb/core-v2/practice/practice.schema";

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
  catch: (e) => new Error(`Failed to read JSON from stdin: ${e}`),
});

// ---------------------------------------------------------------------------
// Practice CRUD
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practices = yield* svc.list();
      yield* output(practices, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.get({ publicId });
      yield* output(practice, pretty);
    }),
);

const nameOption = Options.text("name").pipe(
  Options.withDescription("Practice name"),
  Options.optional,
);
const dateOption = Options.text("date").pipe(
  Options.withDescription("Practice date (ISO 8601)"),
  Options.optional,
);
const durationOption = Options.integer("duration").pipe(
  Options.withDescription("Duration in minutes"),
  Options.optional,
);
const locationOption = Options.text("location").pipe(
  Options.withDescription("Field/facility name"),
  Options.optional,
);
const statusOption = Options.choice("status", [
  "draft",
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
] as const).pipe(
  Options.withDescription("Practice status"),
  Options.optional,
);
const descriptionOption = Options.text("description").pipe(
  Options.withDescription("Practice description"),
  Options.optional,
);
const notesOption = Options.text("notes").pipe(
  Options.withDescription("Coach notes"),
  Options.optional,
);

const createCommand = Command.make(
  "create",
  {
    name: nameOption,
    date: dateOption,
    duration: durationOption,
    location: locationOption,
    status: statusOption,
    description: descriptionOption,
    notes: notesOption,
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.create({
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
    }),
);

const updateCommand = Command.make(
  "update",
  {
    publicId: Args.text({ name: "publicId" }),
    name: nameOption,
    date: dateOption,
    duration: durationOption,
    location: locationOption,
    status: statusOption,
    description: descriptionOption,
    notes: notesOption,
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.update({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        date: Option.match(opts.date, {
          onNone: () => {},
          onSome: (d) => new Date(d),
        }),
        description: Option.getOrUndefined(opts.description),
        notes: Option.getOrUndefined(opts.notes),
        durationMinutes: Option.getOrUndefined(opts.duration),
        location: Option.getOrUndefined(opts.location),
        status: Option.getOrUndefined(opts.status),
      });
      yield* output(practice, opts.pretty);
    }),
);

const deleteCommand = Command.make(
  "delete",
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.delete({ publicId });
      yield* output(practice, pretty);
    }),
);

// ---------------------------------------------------------------------------
// Practice items
// ---------------------------------------------------------------------------

const addItemCommand = Command.make(
  "add-item",
  {
    practiceId: Args.text({ name: "practiceId" }),
    type: Options.choice("type", [
      "warmup",
      "drill",
      "cooldown",
      "water-break",
      "activity",
    ] as const).pipe(Options.withDescription("Item type")),
    drill: Options.text("drill").pipe(
      Options.withDescription("Drill publicId (for type=drill)"),
      Options.optional,
    ),
    label: Options.text("label").pipe(
      Options.withDescription("Label for non-drill items"),
      Options.optional,
    ),
    duration: Options.integer("duration").pipe(
      Options.withDescription("Duration in minutes"),
      Options.optional,
    ),
    itemNotes: Options.text("notes").pipe(
      Options.withDescription("Item notes"),
      Options.optional,
    ),
    groups: Options.text("groups").pipe(
      Options.withDescription("Groups (comma-separated, e.g. attack,midfield)"),
      Options.optional,
    ),
    order: Options.integer("order").pipe(
      Options.withDescription("Order index"),
      Options.optional,
    ),
    priority: Options.choice("priority", [
      "required",
      "optional",
      "if-time",
    ] as const).pipe(
      Options.withDescription("Item priority"),
      Options.optional,
    ),
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const groupValues = Option.map(opts.groups, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );

      const item = yield* svc.addItem({
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
    }),
);

const updateItemCommand = Command.make(
  "update-item",
  {
    itemId: Args.text({ name: "itemId" }),
    type: Options.choice("type", [
      "warmup",
      "drill",
      "cooldown",
      "water-break",
      "activity",
    ] as const).pipe(
      Options.withDescription("Item type"),
      Options.optional,
    ),
    drill: Options.text("drill").pipe(
      Options.withDescription("Drill publicId"),
      Options.optional,
    ),
    label: Options.text("label").pipe(
      Options.withDescription("Item label"),
      Options.optional,
    ),
    duration: Options.integer("duration").pipe(
      Options.withDescription("Duration in minutes"),
      Options.optional,
    ),
    itemNotes: Options.text("notes").pipe(
      Options.withDescription("Item notes"),
      Options.optional,
    ),
    groups: Options.text("groups").pipe(
      Options.withDescription("Groups (comma-separated)"),
      Options.optional,
    ),
    order: Options.integer("order").pipe(
      Options.withDescription("Order index"),
      Options.optional,
    ),
    priority: Options.choice("priority", [
      "required",
      "optional",
      "if-time",
    ] as const).pipe(
      Options.withDescription("Item priority"),
      Options.optional,
    ),
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const groupValues = Option.map(opts.groups, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );

      const item = yield* svc.updateItem({
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
    }),
);

const removeItemCommand = Command.make(
  "remove-item",
  { itemId: Args.text({ name: "itemId" }), pretty: prettyOption },
  ({ itemId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const item = yield* svc.removeItem({ publicId: itemId });
      yield* output(item, pretty);
    }),
);

const listItemsCommand = Command.make(
  "list-items",
  {
    practiceId: Args.text({ name: "practiceId" }),
    pretty: prettyOption,
  },
  ({ practiceId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const items = yield* svc.listItems({ practicePublicId: practiceId });
      yield* output(items, pretty);
    }),
);

const reorderItemsCommand = Command.make(
  "reorder-items",
  {
    practiceId: Args.text({ name: "practiceId" }),
    order: Options.text("order").pipe(
      Options.withDescription("Comma-separated item publicIds in new order"),
    ),
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const orderedIds = opts.order
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const items = yield* svc.reorderItems({
        practicePublicId: opts.practiceId,
        orderedIds,
      });
      yield* output(items, opts.pretty);
    }),
);

// ---------------------------------------------------------------------------
// Practice review
// ---------------------------------------------------------------------------

const reviewCommand = Command.make(
  "review",
  {
    practiceId: Args.text({ name: "practiceId" }),
    wentWell: Options.text("went-well").pipe(
      Options.withDescription("What went well"),
      Options.optional,
    ),
    needsImprovement: Options.text("needs-improvement").pipe(
      Options.withDescription("What needs improvement"),
      Options.optional,
    ),
    reviewNotes: Options.text("notes").pipe(
      Options.withDescription("Review notes"),
      Options.optional,
    ),
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;

      // Try to get existing review first; create if not found
      const existing = yield* svc
        .getReview({ practicePublicId: opts.practiceId })
        .pipe(Effect.option);

      const review = yield* Option.match(existing, {
        onNone: () =>
          svc.createReview({
            practicePublicId: opts.practiceId,
            wentWell: Option.getOrNull(opts.wentWell),
            needsImprovement: Option.getOrNull(opts.needsImprovement),
            notes: Option.getOrNull(opts.reviewNotes),
          }),
        onSome: () =>
          svc.updateReview({
            practicePublicId: opts.practiceId,
            wentWell: Option.getOrUndefined(opts.wentWell),
            needsImprovement: Option.getOrUndefined(opts.needsImprovement),
            notes: Option.getOrUndefined(opts.reviewNotes),
          }),
      });

      yield* output(review, opts.pretty);
    }),
);

const getReviewCommand = Command.make(
  "get-review",
  {
    practiceId: Args.text({ name: "practiceId" }),
    pretty: prettyOption,
  },
  ({ practiceId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const review = yield* svc.getReview({
        practicePublicId: practiceId,
      });
      yield* output(review, pretty);
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
      const svc = yield* PracticeService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknown(
        Schema.Array(CreatePracticeInput),
      )(raw);
      const results = [];
      for (const item of items) {
        const practice = yield* svc.create(item);
        results.push(practice);
      }
      yield* output(results, pretty);
    }),
);

const bulkDeleteCommand = Command.make(
  "bulk-delete",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const ids = (yield* readStdin) as ReadonlyArray<string>;
      const results = [];
      for (const publicId of ids) {
        const practice = yield* svc.delete({ publicId });
        results.push(practice);
      }
      yield* output(results, pretty);
    }),
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
    bulkDeleteCommand,
  ]),
);

const cli = Command.run(practiceCommand, {
  name: "practice",
  version: "0.1.0",
});

cli(process.argv).pipe(
  Effect.provide(Layer.mergeAll(PracticeService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
