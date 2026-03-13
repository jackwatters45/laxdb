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

import { BunRuntime, BunServices } from "@effect/platform-bun";
import {
  Category,
  CreateDrillInput,
  PositionGroup,
  UpdateDrillInput,
} from "@laxdb/core-v2/drill/drill.schema";
import { DrillService } from "@laxdb/core-v2/drill/drill.service";
import { Effect, Layer, Option, Schema } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

// ---------------------------------------------------------------------------
// Shared options
// ---------------------------------------------------------------------------

const prettyFlag = Flag.boolean("pretty").pipe(
  Flag.withDescription("Pretty-print JSON output"),
  Flag.withDefault(false),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const output = (data: unknown, pretty: boolean) =>
  Effect.sync(() => {
    console.log(pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  });

const parseCsv = (csv: string) =>
  csv
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const decodeCategories = Schema.decodeUnknownSync(Schema.Array(Category));
const decodePositionGroups = Schema.decodeUnknownSync(
  Schema.Array(PositionGroup),
);

// ---------------------------------------------------------------------------
// Shared field flags
// ---------------------------------------------------------------------------

const subtitleFlag = Flag.string("subtitle").pipe(
  Flag.withDescription("Drill subtitle"),
  Flag.optional,
);
const descriptionFlag = Flag.string("description").pipe(
  Flag.withDescription("Drill description"),
  Flag.optional,
);
const difficultyFlag = Flag.choice("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
] as const).pipe(Flag.withDescription("Difficulty level"), Flag.optional);
const categoryFlag = Flag.string("category").pipe(
  Flag.withDescription("Categories (comma-separated)"),
  Flag.optional,
);
const positionGroupFlag = Flag.string("position-group").pipe(
  Flag.withDescription("Position groups (comma-separated)"),
  Flag.optional,
);
const intensityFlag = Flag.choice("intensity", [
  "low",
  "medium",
  "high",
] as const).pipe(Flag.withDescription("Intensity level"), Flag.optional);
const contactFlag = Flag.boolean("contact").pipe(
  Flag.withDescription("Contact drill"),
  Flag.optional,
);
const competitiveFlag = Flag.boolean("competitive").pipe(
  Flag.withDescription("Competitive drill"),
  Flag.optional,
);
const playerCountFlag = Flag.integer("player-count").pipe(
  Flag.withDescription("Number of players"),
  Flag.optional,
);
const durationFlag = Flag.integer("duration").pipe(
  Flag.withDescription("Duration in minutes"),
  Flag.optional,
);
const fieldSpaceFlag = Flag.choice("field-space", [
  "full-field",
  "half-field",
  "box",
] as const).pipe(
  Flag.withDescription("Field space required"),
  Flag.optional,
);
const equipmentFlag = Flag.string("equipment").pipe(
  Flag.withDescription("Equipment (comma-separated)"),
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
const coachNotesFlag = Flag.string("coach-notes").pipe(
  Flag.withDescription("Coach notes"),
  Flag.optional,
);
const tagsFlag = Flag.string("tags").pipe(
  Flag.withDescription("Tags (comma-separated)"),
  Flag.optional,
);

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const listCommand = Command.make(
  "list",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const drills = yield* svc.list();
      yield* output(drills, pretty);
    }),
);

const getCommand = Command.make(
  "get",
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
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
    name: Flag.string("name").pipe(Flag.withDescription("Drill name")),
    subtitle: subtitleFlag,
    description: descriptionFlag,
    difficulty: difficultyFlag,
    category: categoryFlag,
    positionGroup: positionGroupFlag,
    intensity: intensityFlag,
    contact: contactFlag,
    competitive: competitiveFlag,
    playerCount: playerCountFlag,
    duration: durationFlag,
    fieldSpace: fieldSpaceFlag,
    equipment: equipmentFlag,
    diagramUrl: diagramUrlFlag,
    videoUrl: videoUrlFlag,
    coachNotes: coachNotesFlag,
    tags: tagsFlag,
    pretty: prettyFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const category = Option.isSome(opts.category)
        ? decodeCategories(parseCsv(opts.category.value))
        : undefined;
      const positionGroup = Option.isSome(opts.positionGroup)
        ? decodePositionGroups(parseCsv(opts.positionGroup.value))
        : undefined;
      const equipmentValues = Option.map(opts.equipment, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );
      const tagValues = Option.map(opts.tags, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
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
    publicId: Argument.string("publicId"),
    name: Flag.string("name").pipe(
      Flag.withDescription("Drill name"),
      Flag.optional,
    ),
    subtitle: subtitleFlag,
    description: descriptionFlag,
    difficulty: difficultyFlag,
    category: categoryFlag,
    positionGroup: positionGroupFlag,
    intensity: intensityFlag,
    contact: contactFlag,
    competitive: competitiveFlag,
    playerCount: playerCountFlag,
    duration: durationFlag,
    fieldSpace: fieldSpaceFlag,
    equipment: equipmentFlag,
    diagramUrl: diagramUrlFlag,
    videoUrl: videoUrlFlag,
    coachNotes: coachNotesFlag,
    tags: tagsFlag,
    pretty: prettyFlag,
  },
  (opts) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const category = Option.isSome(opts.category)
        ? decodeCategories(parseCsv(opts.category.value))
        : undefined;
      const positionGroup = Option.isSome(opts.positionGroup)
        ? decodePositionGroups(parseCsv(opts.positionGroup.value))
        : undefined;
      const equipmentValues = Option.map(opts.equipment, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      );
      const tagValues = Option.map(opts.tags, (csv) =>
        csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
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
  { publicId: Argument.string("publicId"), pretty: prettyFlag },
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
  catch: (e: unknown) =>
    new Error(`Failed to read JSON from stdin: ${String(e)}`),
});

const bulkCreateCommand = Command.make(
  "bulk-create",
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(Schema.Array(CreateDrillInput))(
        raw,
      );
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
  { pretty: prettyFlag },
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
  { pretty: prettyFlag },
  ({ pretty }) =>
    Effect.gen(function* () {
      const svc = yield* DrillService;
      const raw = yield* readStdin;
      const items = yield* Schema.decodeUnknownEffect(Schema.Array(UpdateDrillInput))(
        raw,
      );
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

Command.run(drillCommand, { version: "0.1.0" }).pipe(
  Effect.provide(Layer.mergeAll(DrillService.layer, BunServices.layer)),
  BunRuntime.runMain,
);
