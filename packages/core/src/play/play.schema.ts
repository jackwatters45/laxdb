import { Schema } from "effect";

import { NanoidSchema, PublicIdSchema, TimestampsSchema } from "../schema";

// ---------------------------------------------------------------------------
// Enums — enforced at the Effect layer, stored as text in SQLite for flexibility
// ---------------------------------------------------------------------------

export const PlayCategory = Schema.Literals([
  "offense",
  "defense",
  "clear",
  "ride",
  "faceoff",
  "emo",
  "man-down",
  "transition",
]);

export const PlayDiagramDiscipline = Schema.Literals(["mens", "womens"]);
export const PlayDiagramView = Schema.Literals(["full", "half"]);
export const PlayDiagramTemplate = Schema.Literals([
  "mens-full",
  "mens-half",
  "womens-full",
  "womens-half",
]);
export const PlayDiagramOrientation = Schema.Literals([
  "attack-up",
  "attack-down",
]);
export const PlayDiagramPlayerLabelMode = Schema.Literals([
  "numbers",
  "initials",
  "names",
]);
export const PlayDiagramActorKind = Schema.Literals(["player", "ball"]);
export const PlayDiagramSide = Schema.Literals([
  "offense",
  "defense",
  "neutral",
]);
export const PlayDiagramActionType = Schema.Literals([
  "cut",
  "dodge-carry",
  "pass",
  "pick-screen",
  "shot",
  "slide",
  "recover",
]);

const NormalizedCoordinate = Schema.Number.check(
  Schema.isBetween({ minimum: 0, maximum: 1 }),
);
const DiagramId = Schema.String.check(Schema.isMinLength(1));

export const PlayDiagramPoint = Schema.Struct({
  x: NormalizedCoordinate,
  y: NormalizedCoordinate,
});

export const PlayDiagramField = Schema.Union([
  Schema.Struct({
    discipline: Schema.Literal("mens"),
    view: Schema.Literal("full"),
    template: Schema.Literal("mens-full"),
    orientation: PlayDiagramOrientation,
  }),
  Schema.Struct({
    discipline: Schema.Literal("mens"),
    view: Schema.Literal("half"),
    template: Schema.Literal("mens-half"),
    orientation: PlayDiagramOrientation,
  }),
  Schema.Struct({
    discipline: Schema.Literal("womens"),
    view: Schema.Literal("full"),
    template: Schema.Literal("womens-full"),
    orientation: PlayDiagramOrientation,
  }),
  Schema.Struct({
    discipline: Schema.Literal("womens"),
    view: Schema.Literal("half"),
    template: Schema.Literal("womens-half"),
    orientation: PlayDiagramOrientation,
  }),
]);

export const PlayDiagramActor = Schema.Struct({
  id: DiagramId,
  kind: PlayDiagramActorKind,
  side: PlayDiagramSide,
  label: Schema.NullOr(Schema.String),
  name: Schema.optional(Schema.String),
});

export const PlayDiagramActorState = Schema.Struct({
  actorId: DiagramId,
  position: PlayDiagramPoint,
});

export const PlayDiagramAction = Schema.Struct({
  id: DiagramId,
  type: PlayDiagramActionType,
  start: PlayDiagramPoint,
  end: PlayDiagramPoint,
  actorId: Schema.NullOr(DiagramId),
  targetActorId: Schema.NullOr(DiagramId),
});

export const PlayDiagramFrame = Schema.Struct({
  id: DiagramId,
  name: Schema.String.check(Schema.isMinLength(1)),
  durationMs: Schema.Number.check(
    Schema.isInt(),
    Schema.isBetween({ minimum: 250, maximum: 10_000 }),
  ),
  actorStates: Schema.Array(PlayDiagramActorState),
  actions: Schema.Array(PlayDiagramAction),
});

const playDiagramReferencesAreValid = Schema.makeFilter<{
  readonly actors: ReadonlyArray<{ readonly id: string }>;
  readonly frames: ReadonlyArray<{
    readonly id: string;
    readonly actorStates: ReadonlyArray<{ readonly actorId: string }>;
    readonly actions: ReadonlyArray<{
      readonly id: string;
      readonly actorId: string | null;
      readonly targetActorId: string | null;
    }>;
  }>;
}>((diagram) => {
  const issues: Schema.FilterIssue[] = [];
  const actorIds = new Set<string>();
  const frameIds = new Set<string>();
  const actionIds = new Set<string>();

  diagram.actors.forEach((actor, actorIndex) => {
    if (actorIds.has(actor.id)) {
      issues.push({
        path: ["actors", actorIndex, "id"],
        issue: `duplicate actor id: ${actor.id}`,
      });
    }
    actorIds.add(actor.id);
  });

  diagram.frames.forEach((frame, frameIndex) => {
    if (frameIds.has(frame.id)) {
      issues.push({
        path: ["frames", frameIndex, "id"],
        issue: `duplicate frame id: ${frame.id}`,
      });
    }
    frameIds.add(frame.id);

    const stateActorIds = new Set<string>();
    frame.actorStates.forEach((state, stateIndex) => {
      if (stateActorIds.has(state.actorId)) {
        issues.push({
          path: ["frames", frameIndex, "actorStates", stateIndex, "actorId"],
          issue: `duplicate actor state: ${state.actorId}`,
        });
      }
      stateActorIds.add(state.actorId);
      if (!actorIds.has(state.actorId)) {
        issues.push({
          path: ["frames", frameIndex, "actorStates", stateIndex, "actorId"],
          issue: `unknown actor reference: ${state.actorId}`,
        });
      }
    });

    frame.actions.forEach((action, actionIndex) => {
      if (actionIds.has(action.id)) {
        issues.push({
          path: ["frames", frameIndex, "actions", actionIndex, "id"],
          issue: `duplicate action id: ${action.id}`,
        });
      }
      actionIds.add(action.id);

      if (action.actorId !== null && !actorIds.has(action.actorId)) {
        issues.push({
          path: ["frames", frameIndex, "actions", actionIndex, "actorId"],
          issue: `unknown actor reference: ${action.actorId}`,
        });
      }
      if (
        action.targetActorId !== null &&
        !actorIds.has(action.targetActorId)
      ) {
        issues.push({
          path: ["frames", frameIndex, "actions", actionIndex, "targetActorId"],
          issue: `unknown target actor reference: ${action.targetActorId}`,
        });
      }
    });
  });

  return issues;
});

export const PlayDiagram = Schema.Struct({
  version: Schema.Literal(1),
  playerLabelMode: Schema.optional(PlayDiagramPlayerLabelMode),
  field: PlayDiagramField,
  actors: Schema.Array(PlayDiagramActor),
  frames: Schema.Array(PlayDiagramFrame).check(Schema.isMinLength(1)),
}).check(playDiagramReferencesAreValid);

export type PlayDiagramValue = typeof PlayDiagram.Type;
export type PlayDiagramPointValue = typeof PlayDiagramPoint.Type;
export type PlayDiagramActorValue = typeof PlayDiagramActor.Type;
export type PlayDiagramFrameValue = typeof PlayDiagramFrame.Type;
export type PlayDiagramActionValue = typeof PlayDiagramAction.Type;
export type PlayDiagramActionTypeValue = typeof PlayDiagramActionType.Type;
export type PlayDiagramTemplateValue = typeof PlayDiagramTemplate.Type;
export type PlayDiagramPlayerLabelModeValue =
  typeof PlayDiagramPlayerLabelMode.Type;

// ---------------------------------------------------------------------------
// Domain schemas
// ---------------------------------------------------------------------------

export class Play extends Schema.Class<Play>("Play")({
  ...PublicIdSchema,
  name: Schema.String,
  category: PlayCategory,
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.Array(Schema.String),
  diagram: Schema.NullOr(PlayDiagram),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class PlaySummary extends Schema.Class<PlaySummary>("PlaySummary")({
  ...PublicIdSchema,
  name: Schema.String,
  category: PlayCategory,
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.Array(Schema.String),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
  ...TimestampsSchema,
}) {}

export class CreatePlayInput extends Schema.Class<CreatePlayInput>(
  "CreatePlayInput",
)({
  name: Schema.String.check(Schema.isMinLength(1)),
  category: PlayCategory,
  formation: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  personnelNotes: Schema.NullOr(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagram: Schema.optional(Schema.NullOr(PlayDiagram)),
  diagramUrl: Schema.NullOr(Schema.String),
  videoUrl: Schema.NullOr(Schema.String),
}) {}

export class GetPlayInput extends Schema.Class<GetPlayInput>("GetPlayInput")({
  publicId: NanoidSchema,
}) {}

export class UpdatePlayInput extends Schema.Class<UpdatePlayInput>(
  "UpdatePlayInput",
)({
  publicId: NanoidSchema,
  name: Schema.optional(Schema.String.check(Schema.isMinLength(1))),
  category: Schema.optional(PlayCategory),
  formation: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  personnelNotes: Schema.optional(Schema.NullOr(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
  diagram: Schema.optional(Schema.NullOr(PlayDiagram)),
  diagramUrl: Schema.optional(Schema.NullOr(Schema.String)),
  videoUrl: Schema.optional(Schema.NullOr(Schema.String)),
}) {}

export class DeletePlayInput extends Schema.Class<DeletePlayInput>(
  "DeletePlayInput",
)({
  publicId: NanoidSchema,
}) {}
