import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@laxdb/ui/components/ui/alert-dialog";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import {
  X,
  Clock,
  Users,
  FileText,
  Trash2,
  ArrowRightLeft,
  ArrowUp,
  ArrowDown,
  Flame,
  Snowflake,
  Target,
} from "lucide-react";

import type {
  Drill,
  PracticeNode,
  PracticeItemType,
  PracticeItemPriority,
} from "@/types";

import { DrillPickerPopover } from "./drill-picker";

interface ConfigPanelProps {
  drills: Drill[];
  node: PracticeNode;
  onUpdate: (nodeId: string, updates: Partial<PracticeNode>) => void;
  onDelete: (nodeId: string) => void;
  onMove: (nodeId: string, direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: PracticeItemPriority; label: string }[] = [
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
  { value: "if-time", label: "If Time" },
];

function drillToType(drill: Drill): PracticeItemType {
  if (drill.tags.includes("warmup")) return "warmup";
  if (drill.tags.includes("cooldown")) return "cooldown";
  return "drill";
}

export function ConfigPanel({
  drills,
  node,
  onUpdate,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
  onClose,
}: ConfigPanelProps) {
  const linkedDrill = node.drillId
    ? drills.find((d) => d.id === node.drillId)
    : null;

  const isStart = node.variant === "start";
  const isSplit = node.variant === "split";
  const isSpecial = isStart || isSplit || node.type === "water-break";

  const handleSwapDrill = (drill: Drill) => {
    onUpdate(node.id, {
      drillId: drill.id,
      label: drill.name,
      type: drillToType(drill),
      durationMinutes: drill.durationMinutes,
      notes: drill.subtitle,
    });
  };

  return (
    <div className="w-[340px] h-full border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground truncate pr-2 text-balance">
          {node.label}
        </h3>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {!isStart && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  onMove(node.id, "up");
                }}
                disabled={!canMoveUp}
                aria-label="Move up"
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  onMove(node.id, "down");
                }}
                disabled={!canMoveDown}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X />
          </Button>
        </div>
      </div>

      {/* Drill identity — top of panel */}
      {linkedDrill && (
        <DrillIdentity
          drill={linkedDrill}
          drills={drills}
          onSwap={handleSwapDrill}
        />
      )}

      {/* No drill linked — prompt to pick one */}
      {!linkedDrill && !isSpecial && (
        <div className="px-4 py-3 border-b border-border">
          <DrillPickerPopover drills={drills} onSelect={handleSwapDrill}>
            <Button variant="outline" size="lg" className="w-full">
              <Target />
              Pick a drill
            </Button>
          </DrillPickerPopover>
        </div>
      )}

      {/* Editable fields */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Label */}
          <Field label="Label" icon={<FileText className="size-3.5" />}>
            <Input
              value={node.label}
              onChange={(e) => {
                onUpdate(node.id, { label: e.target.value });
              }}
              disabled={isStart}
            />
          </Field>

          {/* Duration */}
          {!isStart && (
            <Field label="Duration" icon={<Clock className="size-3.5" />}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={node.durationMinutes ?? ""}
                  onChange={(e) => {
                    onUpdate(node.id, {
                      durationMinutes: e.target.value
                        ? parseInt(e.target.value, 10)
                        : null,
                    });
                  }}
                  placeholder="—"
                  className="w-20"
                  min={1}
                  max={120}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </Field>
          )}

          {/* Groups */}
          <Field label="Groups" icon={<Users className="size-3.5" />}>
            <Input
              value={node.groups.join(", ")}
              onChange={(e) => {
                onUpdate(node.id, {
                  groups: e.target.value
                    .split(",")
                    .map((g) => g.trim())
                    .filter(Boolean),
                });
              }}
              placeholder="all"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1 text-pretty">
              Comma-separated: all, Offense, Defense, Goalies
            </p>
          </Field>

          {/* Priority */}
          {!isStart && (
            <Field label="Priority" icon={<Target className="size-3.5" />}>
              <ToggleGroup
                value={[node.priority]}
                onValueChange={(values) => {
                  const next = values[0] as PracticeItemPriority | undefined;
                  if (next) onUpdate(node.id, { priority: next });
                }}
                variant="outline"
                size="sm"
                spacing={1}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <ToggleGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          )}

          {/* Notes */}
          <Field label="Notes" icon={<FileText className="size-3.5" />}>
            <Textarea
              value={node.notes ?? ""}
              onChange={(e) => {
                onUpdate(node.id, { notes: e.target.value || null });
              }}
              placeholder="Add coaching notes..."
              className="min-h-[60px]"
            />
          </Field>
        </div>
      </div>

      {/* Footer — destructive action behind AlertDialog */}
      {!isStart && (
        <>
          <Separator />
          <div className="p-4">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="lg" className="w-full">
                    <Trash2 />
                    Delete Block
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{node.label}"?</AlertDialogTitle>
                  <AlertDialogDescription className="text-pretty">
                    This block will be removed from the practice plan. Connected
                    blocks will be re-linked automatically.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    render={<Button variant="destructive" />}
                    onClick={() => {
                      onDelete(node.id);
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}

function DrillIdentity({
  drill,
  drills,
  onSwap,
}: {
  drill: Drill;
  drills: Drill[];
  onSwap: (drill: Drill) => void;
}) {
  const Icon = drill.tags.includes("warmup")
    ? Flame
    : drill.tags.includes("cooldown")
      ? Snowflake
      : Target;

  return (
    <div className="px-4 py-3 border-b border-border space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="size-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {drill.name}
            </p>
            {drill.subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {drill.subtitle}
              </p>
            )}
          </div>
        </div>
        <DrillPickerPopover drills={drills} onSelect={onSwap}>
          <Button variant="ghost" size="icon-sm" aria-label="Swap drill">
            <ArrowRightLeft />
          </Button>
        </DrillPickerPopover>
      </div>

      {drill.description && (
        <p className="text-xs text-muted-foreground/80 leading-relaxed text-pretty">
          {drill.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {drill.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
