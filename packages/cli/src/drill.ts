/**
 * Drill CLI
 *
 * Usage:
 *   infisical run --env=dev -- bun src/drill.ts list
 *   infisical run --env=dev -- bun src/drill.ts get <publicId>
 *   infisical run --env=dev -- bun src/drill.ts create --name "Box Passing" --category passing
 *   infisical run --env=dev -- bun src/drill.ts update <publicId> --name "New Name"
 *   infisical run --env=dev -- bun src/drill.ts delete <publicId>
 *
 * Add --pretty for formatted JSON output.
 */

import { Args, Command, Options } from "@effect/cli";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Option, Schema } from "effect";

import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import {
  Category,
  CreateDrillInput,
  PositionGroup,
  UpdateDrillInput,
} from "@laxdb/core-v2/drill/drill.schema";

// ---------------------------------------------------------------------------
// Shared options
// ---------------------------------------------------------------------------

const prettyOption = Options.boolean("pretty").pipe(
  Options.withDescription("Pretty-print JSON output"),
  Options.withDefault(false),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const output = (data: unknown, pretty: boolean) =>
  Effect.sync(() => {
    console.log(pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  });

/** Split comma-separated string and decode through a Schema.Literal array */
const decodeCsv = <A, I, R>(schema: Schema.Schema<A, I, R>) => {
  const arraySchema = Schema.Array(schema);
  return (csv: string) => {
    const values = csv.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    return Schema.decodeUnknown(arraySchema)(values);
  };
};

const decodeCategories = decodeCsv(Category);
const decodePositionGroups = decodeCsv(PositionGroup);

/** Decode an optional CSV option through a schema */
const optionalCsv = <A, _I, R>(
  opt: Option.Option<string>,
  decode: (csv: string) => Effect.Effect<ReadonlyArray<A>, unknown, R>,
) =>
  Option.match(opt, {
    onNone: () => Effect.succeed(),
    onSome: decode,
  });

// ---------------------------------------------------------------------------
// Shared field options
// ---------------------------------------------------------------------------

const subtitleOption = Options.text("subtitle").pipe(
  Options.withDescription("Drill subtitle"),
  Options.optional,
);
const descriptionOption = Options.text("description").pipe(
  Options.withDescription("Drill description"),
  Options.optional,
);
const difficultyOption = Options.choice("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
] as const).pipe(
  Options.withDescription("Difficulty level"),
  Options.optional,
);
const categoryOption = Options.text("category").pipe(
  Options.withDescription("Categories (comma-separated)"),
  Options.optional,
);
const positionGroupOption = Options.text("position-group").pipe(
  Options.withDescription("Position groups (comma-separated)"),
  Options.optional,
);
const intensityOption = Options.choice("intensity", [
  "low",
  "medium",
  "high",
] as const).pipe(
  Options.withDescription("Intensity level"),
  Options.optional,
);
const contactOption = Options.boolean("contact").pipe(
  Options.withDescription("Contact drill"),
  Options.optional,
);
const competitiveOption = Options.boolean("competitive").pipe(
  Options.withDescription("Competitive drill"),
  Options.optional,
);
const playerCountOption = Options.integer("player-count").pipe(
  Options.withDescription("Number of players"),
  Options.optional,
);
const durationOption = Options.integer("duration").pipe(
  Options.withDescription("Duration in minutes"),
  Options.optional,
);
const fieldSpaceOption = Options.choice("field-space", [
  "full-field",
  "half-field",
  "box",
] as const).pipe(
  Options.withDescription("Field space required"),
  Options.optional,
);
const equipmentOption = Options.text("equipment").pipe(
  Options.withDescription("Equipment (comma-separated)"),
  Options.optional,
);
const diagramUrlOption = Options.text("diagram-url").pipe(
  Options.withDescription("Diagram URL"),
  Options.optional,
);
const videoUrlOption = Options.text("video-url").pipe(
  Options.withDescription("Video URL"),
  Options.optional,
);
const coachNotesOption = Options.text("coach-notes").pipe(
  Options.withDescription("Coach notes"),
  Options.optional,
);
const tagsOption = Options.text("tags").pipe(
  Options.withDescription("Tags (comma-separated)"),
  Options.optional,
);

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const drills = yield* svc.list();
      yield* output(drills, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const drill = yield* svc.get({ publicId });
      yield* output(drill, pretty);
    }),
);

const createCommand = Command.make(
  "create",
  {
    name: Options.text("name").pipe(Options.withDescription("Drill name")),
    subtitle: subtitleOption,
    description: descriptionOption,
    difficulty: difficultyOption,
    category: categoryOption,
    positionGroup: positionGroupOption,
    intensity: intensityOption,
    contact: contactOption,
    competitive: competitiveOption,
    playerCount: playerCountOption,
    duration: durationOption,
    fieldSpace: fieldSpaceOption,
    equipment: equipmentOption,
    diagramUrl: diagramUrlOption,
    videoUrl: videoUrlOption,
    coachNotes: coachNotesOption,
    tags: tagsOption,
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const category = yield* optionalCsv(opts.category, decodeCategories);
      const positionGroup = yield* optionalCsv(opts.positionGroup, decodePositionGroups);
      const equipmentValues = Option.map(opts.equipment, (csv) =>
        csv.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
      );
      const tagValues = Option.map(opts.tags, (csv) =>
        csv.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
      );

      const drill = yield* svc.create({
        name: opts.name,
        subtitle: Option.getOrNull(opts.subtitle),
        description: Option.getOrNull(opts.description),
        difficulty: Option.getOrUndefined(opts.difficulty),
        category,
        positionGroup,
        intensity: Option.getOrNull(opts.intensity),
        contact: Option.getOrNull(opts.contact),
        competitive: Option.getOrNull(opts.competitive),
        playerCount: Option.getOrNull(opts.playerCount),
        durationMinutes: Option.getOrNull(opts.duration),
        fieldSpace: Option.getOrNull(opts.fieldSpace),
        equipment: Option.getOrNull(equipmentValues),
        diagramUrl: Option.getOrNull(opts.diagramUrl),
        videoUrl: Option.getOrNull(opts.videoUrl),
        coachNotes: Option.getOrNull(opts.coachNotes),
        tags: Option.getOrUndefined(tagValues),
      });
      yield* output(drill, opts.pretty);
    }),
);

const updateCommand = Command.make(
  "update",
  {
    publicId: Args.text({ name: "publicId" }),
    name: Options.text("name").pipe(
      Options.withDescription("Drill name"),
      Options.optional,
    ),
    subtitle: subtitleOption,
    description: descriptionOption,
    difficulty: difficultyOption,
    category: categoryOption,
    positionGroup: positionGroupOption,
    intensity: intensityOption,
    contact: contactOption,
    competitive: competitiveOption,
    playerCount: playerCountOption,
    duration: durationOption,
    fieldSpace: fieldSpaceOption,
    equipment: equipmentOption,
    diagramUrl: diagramUrlOption,
    videoUrl: videoUrlOption,
    coachNotes: coachNotesOption,
    tags: tagsOption,
    pretty: prettyOption,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const category = yield* optionalCsv(opts.category, decodeCategories);
      const positionGroup = yield* optionalCsv(opts.positionGroup, decodePositionGroups);
      const equipmentValues = Option.map(opts.equipment, (csv) =>
        csv.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
      );
      const tagValues = Option.map(opts.tags, (csv) =>
        csv.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
      );

      const drill = yield* svc.update({
        publicId: opts.publicId,
        name: Option.getOrUndefined(opts.name),
        subtitle: Option.getOrUndefined(opts.subtitle),
        description: Option.getOrUndefined(opts.description),
        difficulty: Option.getOrUndefined(opts.difficulty),
        category,
        positionGroup,
        intensity: Option.getOrUndefined(opts.intensity),
        contact: Option.getOrUndefined(opts.contact),
        competitive: Option.getOrUndefined(opts.competitive),
        playerCount: Option.getOrUndefined(opts.playerCount),
        durationMinutes: Option.getOrUndefined(opts.duration),
        fieldSpace: Option.getOrUndefined(opts.fieldSpace),
        equipment: Option.getOrUndefined(equipmentValues),
        diagramUrl: Option.getOrUndefined(opts.diagramUrl),
        videoUrl: Option.getOrUndefined(opts.videoUrl),
        coachNotes: Option.getOrUndefined(opts.coachNotes),
        tags: Option.getOrUndefined(tagValues),
      });
      yield* output(drill, opts.pretty);
    }),
);

const deleteCommand = Command.make(
  "delete",
  { publicId: Args.text({ name: "publicId" }), pretty: prettyOption },
  ({ publicId, pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const drill = yield* svc.delete({ publicId });
      yield* output(drill, pretty);
    }),
);

// ---------------------------------------------------------------------------
// Bulk subcommands (read JSON from stdin)
// ---------------------------------------------------------------------------

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

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknown(Schema.Array(CreateDrillInput))(raw);
      const results = [];
      for (const item of items) {
        const drill = yield* svc.create(item);
        results.push(drill);
      }
      yield* output(results, pretty);
    }),
);

const bulkDeleteCommand = Command.make(
  "bulk-delete",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const ids = (yield* readStdin) as ReadonlyArray<string>;
      const results = [];
      for (const publicId of ids) {
        const drill = yield* svc.delete({ publicId });
        results.push(drill);
      }
      yield* output(results, pretty);
    }),
);

const bulkUpdateCommand = Command.make(
  "bulk-update",
  { pretty: prettyOption },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknown(Schema.Array(UpdateDrillInput))(raw);
      const results = [];
      for (const item of items) {
        const drill = yield* svc.update(item);
        results.push(drill);
      }
      yield* output(results, pretty);
    }),
);

// ---------------------------------------------------------------------------
// Root command + CLI runner
// ---------------------------------------------------------------------------

const drillCommand = Command.make("drill").pipe(
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

const cli = Command.run(drillCommand, {
  name: "drill",
  version: "0.1.0",
});

cli(process.argv).pipe(
  Effect.provide(Layer.mergeAll(DrillService.Default, BunContext.layer)),
  BunRuntime.runMain,
);
