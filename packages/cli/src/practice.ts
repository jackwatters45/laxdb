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

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { CreatePracticeInput } from "@laxdb/core-v2/practice/practice.schema";
import { PracticeService } from "@laxdb/core-v2/practice/practice.service";
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
// Practice CRUD
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practices = yield* svc.list();
      yield* output(practices, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.get({ publicId });
      yield* output(practice, pretty);
    }),
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
    publicId: Argument.string("publicId"),
    name: nameFlag,
    date: dateFlag,
    duration: durationFlag,
    location: locationFlag,
    status: statusFlag,
    description: descriptionFlag,
    notes: notesFlag,
    pretty: prettyFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const practice = yield* svc.update({
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
    }),
);

const deleteCommand = Command.make(
  "delete",
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
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
    ] as const).pipe(
      Flag.withDescription("Item priority"),
      Flag.optional,
    ),
    pretty: prettyFlag,
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
    ] as const).pipe(
      Flag.withDescription("Item priority"),
      Flag.optional,
    ),
    pretty: prettyFlag,
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
  { itemId: Argument.string("itemId"), pretty: prettyFlag },
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
    practiceId: Argument.string("practiceId"),
    pretty: prettyFlag,
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
    practiceId: Argument.string("practiceId"),
    order: Flag.string("order").pipe(
      Flag.withDescription("Comma-separated item publicIds in new order"),
    ),
    pretty: prettyFlag,
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
    practiceId: Argument.string("practiceId"),
    pretty: prettyFlag,
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
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* PracticeService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(
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
  { pretty: prettyFlag },
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

Command.run(practiceCommand, { version: "0.1.0" }).pipe(
  Effect.provide(Layer.mergeAll(PracticeService.layer, BunServices.layer)),
  BunRuntime.runMain,
);
