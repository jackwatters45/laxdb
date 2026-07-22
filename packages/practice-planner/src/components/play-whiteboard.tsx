import type {
  PlayDiagramActionTypeValue,
  PlayDiagramActionValue,
  PlayDiagramActorValue,
  PlayDiagramFrameValue,
  PlayDiagramPointValue,
  PlayDiagramTemplateValue,
  PlayDiagramValue,
} from "@laxdb/core/play/play.schema";
import { Button } from "@laxdb/ui/components/ui/button";
import { cn } from "@laxdb/ui/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FlipVertical2,
  Pause,
  Play,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

type BoardMode =
  | "select"
  | "offense"
  | "defense"
  | "ball"
  | PlayDiagramActionTypeValue;

type Selection =
  | { kind: "actor"; id: string }
  | { kind: "action"; id: string }
  | null;

interface HistoryState {
  past: PlayDiagramValue[];
  present: PlayDiagramValue;
  future: PlayDiagramValue[];
}

interface PlayWhiteboardProps {
  diagram: PlayDiagramValue;
  onChange?: (diagram: PlayDiagramValue) => void;
  readOnly?: boolean;
  className?: string;
}

const ACTION_TOOLS: ReadonlyArray<{
  value: PlayDiagramActionTypeValue;
  label: string;
}> = [
  { value: "cut", label: "Cut" },
  { value: "dodge-carry", label: "Dodge / carry" },
  { value: "pass", label: "Pass" },
  { value: "pick-screen", label: "Pick / screen" },
  { value: "shot", label: "Shot" },
  { value: "slide", label: "Slide" },
  { value: "recover", label: "Recover" },
];

const TEMPLATE_OPTIONS: ReadonlyArray<{
  value: PlayDiagramTemplateValue;
  label: string;
}> = [
  { value: "mens-full", label: "Men’s full" },
  { value: "mens-half", label: "Men’s half" },
  { value: "womens-full", label: "Women’s full" },
  { value: "womens-half", label: "Women’s half" },
];

type FieldTemplateConfiguration =
  | { discipline: "mens"; view: "full"; template: "mens-full" }
  | { discipline: "mens"; view: "half"; template: "mens-half" }
  | { discipline: "womens"; view: "full"; template: "womens-full" }
  | { discipline: "womens"; view: "half"; template: "womens-half" };

const isActionMode = (mode: BoardMode): mode is PlayDiagramActionTypeValue =>
  ACTION_TOOLS.some((tool) => tool.value === mode);

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ACTION_DRAG_THRESHOLD_PX = 8;
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const createEmptyPlayDiagram = (): PlayDiagramValue => ({
  version: 1,
  field: {
    discipline: "mens",
    view: "half",
    template: "mens-half",
    orientation: "attack-up",
  },
  actors: [],
  frames: [
    {
      id: newId("frame"),
      name: "Set",
      durationMs: 1_000,
      actorStates: [],
      actions: [],
    },
  ],
});

const fieldFromTemplate = (
  template: PlayDiagramTemplateValue,
): FieldTemplateConfiguration => {
  switch (template) {
    case "mens-full":
      return { discipline: "mens", view: "full", template };
    case "mens-half":
      return { discipline: "mens", view: "half", template };
    case "womens-full":
      return { discipline: "womens", view: "full", template };
    case "womens-half":
      return { discipline: "womens", view: "half", template };
  }
  throw new Error("Unknown field template");
};

const replaceFrame = (
  diagram: PlayDiagramValue,
  frameId: string,
  update: (frame: PlayDiagramFrameValue) => PlayDiagramFrameValue,
): PlayDiagramValue => ({
  ...diagram,
  frames: diagram.frames.map((frame) =>
    frame.id === frameId ? update(frame) : frame,
  ),
});

const actionAppearance = (type: PlayDiagramActionTypeValue) => {
  switch (type) {
    case "cut":
      return { stroke: "var(--color-primary)", dash: undefined, width: 4 };
    case "dodge-carry":
      return { stroke: "var(--color-accent)", dash: undefined, width: 6 };
    case "pass":
      return { stroke: "var(--color-primary)", dash: "12 9", width: 4 };
    case "pick-screen":
      return { stroke: "var(--color-muted-foreground)", dash: "3 8", width: 6 };
    case "shot":
      return { stroke: "var(--color-destructive)", dash: undefined, width: 6 };
    case "slide":
      return { stroke: "var(--color-destructive)", dash: "14 6", width: 5 };
    case "recover":
      return { stroke: "var(--color-muted-foreground)", dash: "8 8", width: 4 };
  }
  throw new Error("Unknown action type");
};

function ToolButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="xl"
      className="min-h-11 shrink-0 px-3"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function MensField({ full }: { full: boolean }) {
  const height = full ? 900 : 540;
  const goals = full ? [135, 765] : [135];
  return (
    <>
      <rect x="6" y="6" width="588" height={height - 12} rx="8" />
      {full ? (
        <>
          <line x1="6" y1="450" x2="594" y2="450" />
          <line x1="6" y1="300" x2="594" y2="300" />
          <line x1="6" y1="600" x2="594" y2="600" />
          <line x1="210" y1="420" x2="210" y2="480" />
          <line x1="390" y1="420" x2="390" y2="480" />
        </>
      ) : (
        <line x1="6" y1="360" x2="594" y2="360" />
      )}
      {goals.map((goalY) => (
        <g key={goalY}>
          <circle cx="300" cy={goalY} r="30" />
          <line x1="270" y1={goalY} x2="330" y2={goalY} />
          <path d={`M 276 ${goalY} Q 300 ${goalY + 34} 324 ${goalY}`} />
        </g>
      ))}
    </>
  );
}

function WomensEnd({ goalY }: { goalY: number }) {
  return (
    <g>
      <circle cx="300" cy={goalY} r="28" />
      <line x1="274" y1={goalY} x2="326" y2={goalY} />
      <path d={`M 274 ${goalY} Q 300 ${goalY + 32} 326 ${goalY}`} />
      <path d={`M 195 ${goalY + 22} A 108 108 0 0 0 405 ${goalY + 22}`} />
      <path d={`M 160 ${goalY + 42} A 146 146 0 0 0 440 ${goalY + 42}`} />
      {[-70, -35, 0, 35, 70].map((offset) => (
        <line
          key={offset}
          x1={300 + offset}
          y1={goalY + 102 - Math.abs(offset) * 0.25}
          x2={300 + offset}
          y2={goalY + 116 - Math.abs(offset) * 0.25}
        />
      ))}
      <circle cx="235" cy={goalY + 18} r="3" fill="currentColor" />
      <circle cx="365" cy={goalY + 18} r="3" fill="currentColor" />
      <text x="300" y={goalY + 155} textAnchor="middle">
        8M ARC · 12M FAN
      </text>
    </g>
  );
}

function WomensField({ full }: { full: boolean }) {
  const height = full ? 900 : 540;
  return (
    <>
      <rect x="6" y="6" width="588" height={height - 12} rx="8" />
      {full ? (
        <>
          <line x1="6" y1="305" x2="594" y2="305" />
          <line x1="6" y1="595" x2="594" y2="595" />
          <circle cx="300" cy="450" r="74" />
          <WomensEnd goalY={105} />
          <g transform="translate(0 900) scale(1 -1)">
            <WomensEnd goalY={105} />
          </g>
        </>
      ) : (
        <>
          <line x1="6" y1="380" x2="594" y2="380" />
          <WomensEnd goalY={105} />
        </>
      )}
    </>
  );
}

export function PlayWhiteboard({
  diagram,
  onChange,
  readOnly = false,
  className,
}: PlayWhiteboardProps) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: diagram,
    future: [],
  });
  const [mode, setMode] = useState<BoardMode>("select");
  const [selection, setSelection] = useState<Selection>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [drag, setDrag] = useState<{
    actorId: string;
    pointerId: number;
  } | null>(null);
  const [dragPoint, setDragPoint] = useState<PlayDiagramPointValue | null>(
    null,
  );
  const [actionGesture, setActionGesture] = useState<{
    start: PlayDiagramPointValue;
    actorId: string | null;
    pointerId: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const markerPrefix = useId().replaceAll(":", "");
  const currentDiagram = history.present;
  const full = currentDiagram.field.view === "full";
  const boardHeight = full ? 900 : 540;
  const lastFrameIndex = currentDiagram.frames.length - 1;
  const activeFrameIndex = Math.min(Math.max(frameIndex, 0), lastFrameIndex);
  const currentFrame = currentDiagram.frames[activeFrameIndex];

  const clearPointerGesture = useCallback(() => {
    setDrag(null);
    setDragPoint(null);
    setActionGesture(null);
  }, []);

  const navigateToFrame = useCallback(
    (
      nextIndex: number,
      continuePlayback = false,
      frameCount = currentDiagram.frames.length,
    ) => {
      const maximum = frameCount - 1;
      setFrameIndex(Math.min(Math.max(nextIndex, 0), maximum));
      if (!continuePlayback) setPlaying(false);
      setSelection(null);
      clearPointerGesture();
    },
    [clearPointerGesture, currentDiagram.frames.length],
  );

  useEffect(() => {
    onChange?.(history.present);
  }, [history.present, onChange]);

  useEffect(() => {
    if (frameIndex !== activeFrameIndex) {
      navigateToFrame(activeFrameIndex);
    }
  }, [activeFrameIndex, frameIndex, navigateToFrame]);

  useEffect(() => {
    let timer: number | undefined;
    if (playing && currentFrame !== undefined) {
      timer = window.setTimeout(() => {
        if (activeFrameIndex >= lastFrameIndex) {
          setPlaying(false);
          navigateToFrame(0, true);
          return;
        }
        navigateToFrame(activeFrameIndex + 1, true);
      }, currentFrame.durationMs);
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [
    activeFrameIndex,
    currentFrame,
    lastFrameIndex,
    navigateToFrame,
    playing,
  ]);

  const actorStates = useMemo(
    () =>
      new Map(currentFrame?.actorStates.map((state) => [state.actorId, state])),
    [currentFrame?.actorStates],
  );

  if (currentFrame === undefined) return null;

  const commit = (next: PlayDiagramValue) => {
    setPlaying(false);
    clearPointerGesture();
    setHistory((state) => ({
      past: [...state.past, state.present].slice(-50),
      present: next,
      future: [],
    }));
  };

  const pointFromEvent = (
    event: PointerEvent<SVGElement>,
  ): PlayDiagramPointValue | null => {
    const svg = svgRef.current;
    if (svg === null) return null;
    const screenMatrix = svg.getScreenCTM();
    if (screenMatrix === null) return null;
    const svgPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      screenMatrix.inverse(),
    );
    const x = clamp(svgPoint.x / 600);
    const displayY = clamp(svgPoint.y / boardHeight);
    return {
      x,
      y:
        currentDiagram.field.orientation === "attack-down"
          ? 1 - displayY
          : displayY,
    };
  };

  const toSvg = (point: PlayDiagramPointValue) => ({
    x: point.x * 600,
    y:
      (currentDiagram.field.orientation === "attack-down"
        ? 1 - point.y
        : point.y) * boardHeight,
  });

  const handleBoardPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (readOnly || event.button !== 0) return;
    const point = pointFromEvent(event);
    if (point === null) return;
    setPlaying(false);

    if (mode === "offense" || mode === "defense" || mode === "ball") {
      if (mode === "ball") {
        const existingBall = currentDiagram.actors.find(
          (actor) => actor.kind === "ball",
        );
        if (existingBall !== undefined) {
          commit(
            replaceFrame(currentDiagram, currentFrame.id, (frame) => ({
              ...frame,
              actorStates: frame.actorStates.map((state) =>
                state.actorId === existingBall.id
                  ? { ...state, position: point }
                  : state,
              ),
            })),
          );
          setSelection({ kind: "actor", id: existingBall.id });
          setMode("select");
          return;
        }
      }
      const actorId = newId(mode === "ball" ? "ball" : "player");
      const side = mode === "ball" ? "neutral" : mode;
      const sideCount = currentDiagram.actors.filter(
        (actor) => actor.side === side,
      ).length;
      const actor: PlayDiagramActorValue = {
        id: actorId,
        kind: mode === "ball" ? "ball" : "player",
        side,
        label:
          mode === "ball"
            ? null
            : `${mode === "offense" ? "O" : "D"}${sideCount + 1}`,
      };
      commit({
        ...currentDiagram,
        actors: [...currentDiagram.actors, actor],
        frames: currentDiagram.frames.map((frame) => ({
          ...frame,
          actorStates: [...frame.actorStates, { actorId, position: point }],
        })),
      });
      setSelection({ kind: "actor", id: actorId });
      setMode("select");
      return;
    }

    if (isActionMode(mode)) {
      setActionGesture({
        start: point,
        actorId: selection?.kind === "actor" ? selection.id : null,
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    setSelection(null);
  };

  const handleBoardPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (drag === null || drag.pointerId !== event.pointerId) return;
    const point = pointFromEvent(event);
    if (point !== null) setDragPoint(point);
  };

  const handleBoardPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const draggingActor = drag?.pointerId === event.pointerId;
    const drawingAction = actionGesture?.pointerId === event.pointerId;
    if (!draggingActor && !drawingAction) return;

    const point = pointFromEvent(event);
    if (draggingActor && drag !== null && point !== null) {
      commit(
        replaceFrame(currentDiagram, currentFrame.id, (frame) => ({
          ...frame,
          actorStates: frame.actorStates.map((state) =>
            state.actorId === drag.actorId
              ? { ...state, position: point }
              : state,
          ),
        })),
      );
    } else if (
      drawingAction &&
      actionGesture !== null &&
      point !== null &&
      isActionMode(mode) &&
      Math.hypot(
        event.clientX - actionGesture.clientX,
        event.clientY - actionGesture.clientY,
      ) >= ACTION_DRAG_THRESHOLD_PX
    ) {
      const action: PlayDiagramActionValue = {
        id: newId("action"),
        type: mode,
        start: actionGesture.start,
        end: point,
        actorId: actionGesture.actorId,
        targetActorId: null,
      };
      commit(
        replaceFrame(currentDiagram, currentFrame.id, (frame) => ({
          ...frame,
          actions: [...frame.actions, action],
        })),
      );
      setSelection({ kind: "action", id: action.id });
      setMode("select");
    }
    clearPointerGesture();
  };

  const handleBoardPointerCancel = (event: PointerEvent<SVGSVGElement>) => {
    if (
      drag?.pointerId === event.pointerId ||
      actionGesture?.pointerId === event.pointerId
    ) {
      clearPointerGesture();
    }
  };

  const startActorDrag = (
    event: PointerEvent<SVGGElement>,
    actorId: string,
  ) => {
    event.stopPropagation();
    if (readOnly || event.button !== 0) return;
    setPlaying(false);
    setSelection({ kind: "actor", id: actorId });
    if (isActionMode(mode)) {
      const point = pointFromEvent(event);
      if (point === null) return;
      setActionGesture({
        start: point,
        actorId,
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (mode !== "select") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ actorId, pointerId: event.pointerId });
    setDragPoint(pointFromEvent(event));
  };

  const selectWithKeyboard = (
    event: KeyboardEvent<SVGGElement>,
    nextSelection: Exclude<Selection, null>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPlaying(false);
    setSelection(nextSelection);
  };

  const chooseMode = (nextMode: BoardMode) => {
    setPlaying(false);
    clearPointerGesture();
    setMode(nextMode);
  };

  const deleteSelection = () => {
    if (selection === null) return;
    if (selection.kind === "actor") {
      commit({
        ...currentDiagram,
        actors: currentDiagram.actors.filter(
          (actor) => actor.id !== selection.id,
        ),
        frames: currentDiagram.frames.map((frame) => ({
          ...frame,
          actorStates: frame.actorStates.filter(
            (state) => state.actorId !== selection.id,
          ),
          actions: frame.actions.filter(
            (action) =>
              action.actorId !== selection.id &&
              action.targetActorId !== selection.id,
          ),
        })),
      });
    } else {
      commit(
        replaceFrame(currentDiagram, currentFrame.id, (frame) => ({
          ...frame,
          actions: frame.actions.filter((action) => action.id !== selection.id),
        })),
      );
    }
    setSelection(null);
  };

  const undo = () => {
    const previous = history.past.at(-1);
    if (previous === undefined) return;
    setHistory((state) => ({
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    }));
    navigateToFrame(activeFrameIndex, false, previous.frames.length);
  };

  const redo = () => {
    const next = history.future[0];
    if (next === undefined) return;
    setHistory((state) => ({
      past: [...state.past, state.present],
      present: next,
      future: state.future.slice(1),
    }));
    navigateToFrame(activeFrameIndex, false, next.frames.length);
  };

  const duplicateFrame = () => {
    const duplicate: PlayDiagramFrameValue = {
      ...currentFrame,
      id: newId("frame"),
      name: `Phase ${currentDiagram.frames.length + 1}`,
      actions: currentFrame.actions.map((action) => ({
        ...action,
        id: newId("action"),
      })),
    };
    const frames = [...currentDiagram.frames];
    frames.splice(activeFrameIndex + 1, 0, duplicate);
    commit({ ...currentDiagram, frames });
    navigateToFrame(activeFrameIndex + 1, false, frames.length);
  };

  const deleteFrame = () => {
    if (currentDiagram.frames.length <= 1) return;
    commit({
      ...currentDiagram,
      frames: currentDiagram.frames.filter(
        (frame) => frame.id !== currentFrame.id,
      ),
    });
    navigateToFrame(
      Math.max(0, activeFrameIndex - 1),
      false,
      currentDiagram.frames.length - 1,
    );
  };

  const fieldTransform =
    currentDiagram.field.orientation === "attack-down"
      ? `translate(0 ${boardHeight}) scale(1 -1)`
      : undefined;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      aria-label={readOnly ? "Play board preview" : "Play board editor"}
    >
      {!readOnly && (
        <>
          <div className="border-b border-border bg-muted/40 p-3">
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label="Board setup"
            >
              {TEMPLATE_OPTIONS.map((option) => (
                <ToolButton
                  key={option.value}
                  active={currentDiagram.field.template === option.value}
                  label={`Use ${option.label} field`}
                  onClick={() => {
                    const field = fieldFromTemplate(option.value);
                    commit({
                      ...currentDiagram,
                      field: { ...currentDiagram.field, ...field },
                    });
                  }}
                >
                  {option.label}
                </ToolButton>
              ))}
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="min-h-11 shrink-0 px-3"
                onClick={() => {
                  commit({
                    ...currentDiagram,
                    field: {
                      ...currentDiagram.field,
                      orientation:
                        currentDiagram.field.orientation === "attack-up"
                          ? "attack-down"
                          : "attack-up",
                    },
                  });
                }}
              >
                <FlipVertical2 /> Flip attack
              </Button>
            </div>
          </div>
          <div className="border-b border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Active mode:{" "}
              {mode === "select" ? "Select / move" : mode.replace("-", " ")}
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label="Whiteboard tools"
            >
              <ToolButton
                active={mode === "select"}
                label="Select or move an item"
                onClick={() => {
                  chooseMode("select");
                }}
              >
                Select / move
              </ToolButton>
              <ToolButton
                active={mode === "offense"}
                label="Add an offense player"
                onClick={() => {
                  chooseMode("offense");
                }}
              >
                + Offense
              </ToolButton>
              <ToolButton
                active={mode === "defense"}
                label="Add a defense player"
                onClick={() => {
                  chooseMode("defense");
                }}
              >
                + Defense
              </ToolButton>
              <ToolButton
                active={mode === "ball"}
                label="Add or move the ball"
                onClick={() => {
                  chooseMode("ball");
                }}
              >
                + Ball
              </ToolButton>
              {ACTION_TOOLS.map((tool) => (
                <ToolButton
                  key={tool.value}
                  active={mode === tool.value}
                  label={`Draw ${tool.label}`}
                  onClick={() => {
                    chooseMode(tool.value);
                  }}
                >
                  {tool.label}
                </ToolButton>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Place players with one tap. Select and drag to move. Choose a
              lacrosse action, then drag across the field.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-border bg-card p-2">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xl"
                className="size-11"
                aria-label="Undo board change"
                disabled={history.past.length === 0}
                onClick={undo}
              >
                <Undo2 />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xl"
                className="size-11"
                aria-label="Redo board change"
                disabled={history.future.length === 0}
                onClick={redo}
              >
                <Redo2 />
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="xl"
              className="min-h-11"
              disabled={selection === null}
              onClick={deleteSelection}
            >
              <Trash2 /> Delete selected
            </Button>
          </div>
        </>
      )}

      <div className="bg-[#2f684d] p-2 sm:p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 600 ${boardHeight}`}
          role={readOnly ? "img" : undefined}
          aria-label={`${currentDiagram.field.discipline === "mens" ? "Men’s" : "Women’s"} ${full ? "full" : "half"} lacrosse field, frame ${activeFrameIndex + 1}`}
          className={cn(
            "mx-auto block max-h-[70dvh] w-full select-none bg-[#397b59]",
            readOnly ? "cursor-default" : "touch-none cursor-crosshair",
          )}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={handleBoardPointerUp}
          onPointerCancel={handleBoardPointerCancel}
        >
          <defs>
            {ACTION_TOOLS.map((tool) => (
              <marker
                key={tool.value}
                id={`${markerPrefix}-${tool.value}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={actionAppearance(tool.value).stroke}
                />
              </marker>
            ))}
          </defs>
          <g
            transform={fieldTransform}
            fill="none"
            stroke="var(--color-background)"
            strokeWidth="3"
            opacity="0.88"
            className="pointer-events-none"
          >
            {currentDiagram.field.discipline === "mens" ? (
              <MensField full={full} />
            ) : (
              <WomensField full={full} />
            )}
          </g>

          {currentFrame.actions.map((action) => {
            const start = toSvg(action.start);
            const end = toSvg(action.end);
            const appearance = actionAppearance(action.type);
            const selected =
              selection?.kind === "action" && selection.id === action.id;
            return (
              <g
                key={action.id}
                role={readOnly ? undefined : "button"}
                aria-label={`${action.type.replace("-", " ")} action`}
                tabIndex={readOnly ? undefined : 0}
                className={
                  readOnly ? undefined : "group cursor-pointer outline-none"
                }
                onPointerDown={(event) => {
                  event.stopPropagation();
                  if (!readOnly) {
                    setPlaying(false);
                    setSelection({ kind: "action", id: action.id });
                  }
                }}
                onKeyDown={(event) => {
                  selectWithKeyboard(event, { kind: "action", id: action.id });
                }}
              >
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="transparent"
                  strokeWidth="44"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                />
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="var(--color-accent)"
                  strokeWidth={appearance.width + 8}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={selected ? 1 : 0}
                  className="pointer-events-none group-focus-visible:opacity-100"
                />
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={appearance.stroke}
                  strokeWidth={appearance.width}
                  strokeDasharray={appearance.dash}
                  strokeLinecap="round"
                  markerEnd={
                    action.type === "pick-screen"
                      ? undefined
                      : `url(#${markerPrefix}-${action.type})`
                  }
                />
                {action.type === "pick-screen" && (
                  <line
                    x1={end.x - 13}
                    y1={end.y}
                    x2={end.x + 13}
                    y2={end.y}
                    stroke={appearance.stroke}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {currentDiagram.actors.map((actor) => {
            const state = actorStates.get(actor.id);
            if (state === undefined) return null;
            const position =
              drag?.actorId === actor.id && dragPoint !== null
                ? dragPoint
                : state.position;
            const point = toSvg(position);
            const selected =
              selection?.kind === "actor" && selection.id === actor.id;
            if (actor.kind === "ball") {
              return (
                <g
                  key={actor.id}
                  transform={`translate(${point.x} ${point.y})`}
                  className={
                    readOnly ? undefined : "group cursor-grab outline-none"
                  }
                  role={readOnly ? undefined : "button"}
                  aria-label="Ball"
                  tabIndex={readOnly ? undefined : 0}
                  onPointerDown={(event) => {
                    startActorDrag(event, actor.id);
                  }}
                  onKeyDown={(event) => {
                    selectWithKeyboard(event, { kind: "actor", id: actor.id });
                  }}
                >
                  <circle
                    r="1"
                    fill="none"
                    stroke="transparent"
                    strokeWidth="44"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="stroke"
                  />
                  <circle
                    r="21"
                    fill="none"
                    stroke="var(--color-background)"
                    strokeWidth="3"
                    opacity={selected ? 1 : 0}
                    className="pointer-events-none group-focus-visible:opacity-100"
                  />
                  <circle
                    r="11"
                    fill="var(--color-accent)"
                    stroke="var(--color-foreground)"
                    strokeWidth="3"
                  />
                </g>
              );
            }
            const offense = actor.side === "offense";
            return (
              <g
                key={actor.id}
                transform={`translate(${point.x} ${point.y})`}
                className={
                  readOnly ? undefined : "group cursor-grab outline-none"
                }
                role={readOnly ? undefined : "button"}
                aria-label={`${offense ? "Offense" : "Defense"} player ${actor.label ?? ""}`}
                tabIndex={readOnly ? undefined : 0}
                onPointerDown={(event) => {
                  startActorDrag(event, actor.id);
                }}
                onKeyDown={(event) => {
                  selectWithKeyboard(event, { kind: "actor", id: actor.id });
                }}
              >
                <circle
                  r="1"
                  fill="none"
                  stroke="transparent"
                  strokeWidth="44"
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                />
                <circle
                  r="29"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="3"
                  opacity={selected ? 1 : 0}
                  className="pointer-events-none group-focus-visible:opacity-100"
                />
                <circle
                  r="22"
                  fill={
                    offense ? "var(--color-primary)" : "var(--color-background)"
                  }
                  stroke="var(--color-foreground)"
                  strokeWidth="4"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={
                    offense
                      ? "var(--color-primary-foreground)"
                      : "var(--color-foreground)"
                  }
                  fontSize="15"
                  fontWeight="700"
                >
                  {actor.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              className="size-11"
              aria-label="Previous frame"
              disabled={activeFrameIndex === 0}
              onClick={() => {
                navigateToFrame(activeFrameIndex - 1);
              }}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              className="size-11"
              aria-label={playing ? "Pause playback" : "Play frames"}
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                  return;
                }
                navigateToFrame(
                  activeFrameIndex >= lastFrameIndex ? 0 : activeFrameIndex,
                  true,
                );
                setPlaying(true);
              }}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xl"
              className="size-11"
              aria-label="Next frame"
              disabled={activeFrameIndex >= lastFrameIndex}
              onClick={() => {
                navigateToFrame(activeFrameIndex + 1);
              }}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="min-w-28 text-center">
            <p className="text-sm font-semibold text-foreground">
              {currentFrame.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Frame {activeFrameIndex + 1} of {currentDiagram.frames.length}
            </p>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="min-h-11"
                onClick={duplicateFrame}
              >
                <Copy /> Duplicate frame
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-xl"
                className="size-11"
                aria-label="Delete current frame"
                disabled={currentDiagram.frames.length <= 1}
                onClick={deleteFrame}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
          aria-label="Play phases"
        >
          {currentDiagram.frames.map((frame, index) => (
            <button
              key={frame.id}
              type="button"
              className={cn(
                "min-h-11 min-w-24 rounded-md border px-3 text-left text-xs font-medium",
                index === activeFrameIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-border-strong",
              )}
              aria-current={index === activeFrameIndex ? "step" : undefined}
              onClick={() => {
                navigateToFrame(index);
              }}
            >
              <span className="block text-[0.65rem] uppercase opacity-70">
                Phase {index + 1}
              </span>
              {frame.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
