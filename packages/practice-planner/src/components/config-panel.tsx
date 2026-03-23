import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import { ScrollArea } from "@laxdb/ui/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@laxdb/ui/components/ui/select";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { X, Clock, Users, FileText, Tag, Trash2, Target } from "lucide-react";

import { MOCK_DRILLS } from "@/data/mock-drills";
import type {
  PracticeNode,
  PracticeItemType,
  PracticeItemPriority,
} from "@/data/types";

const PRACTICE_ITEM_TYPES: ReadonlySet<string> = new Set<PracticeItemType>([
  "warmup",
  "drill",
  "cooldown",
  "water-break",
  "activity",
]);

function isPracticeItemType(value: string): value is PracticeItemType {
  return PRACTICE_ITEM_TYPES.has(value);
}

const NO_DRILL = "__none__";

interface ConfigPanelProps {
  node: PracticeNode;
  onUpdate: (nodeId: string, updates: Partial<PracticeNode>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: PracticeItemType; label: string }[] = [
  { value: "warmup", label: "Warm-up" },
  { value: "drill", label: "Drill" },
  { value: "cooldown", label: "Cool-down" },
  { value: "water-break", label: "Water Break" },
  { value: "activity", label: "Activity" },
];

const PRIORITY_OPTIONS: { value: PracticeItemPriority; label: string }[] = [
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
  { value: "if-time", label: "If Time" },
];

export function ConfigPanel({
  node,
  onUpdate,
  onDelete,
  onClose,
}: ConfigPanelProps) {
  const linkedDrill = node.drillId
    ? MOCK_DRILLS.find((d) => d.id === node.drillId)
    : null;

  const isStart = node.variant === "start";

  return (
    <div className="w-[340px] h-full border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground truncate pr-2">
          {node.label}
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-5">
          {/* Label */}
          <Field label="Label" icon={<Tag className="size-3.5" />}>
            <Input
              value={node.label}
              onChange={(e) => {
                onUpdate(node.id, { label: e.target.value });
              }}
              disabled={isStart}
            />
          </Field>

          {/* Type */}
          {!isStart && (
            <Field label="Type" icon={<Target className="size-3.5" />}>
              <Select
                value={node.type}
                onValueChange={(v) => {
                  if (v && isPracticeItemType(v)) onUpdate(node.id, { type: v });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

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
            <p className="text-[10px] text-muted-foreground/60 mt-1">
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

          {/* Drill Picker */}
          {!isStart && node.type !== "water-break" && (
            <Field label="Linked Drill" icon={<Target className="size-3.5" />}>
              <Select
                value={node.drillId ?? NO_DRILL}
                onValueChange={(v) => {
                  const drillId = v === NO_DRILL ? null : v;
                  const drill = drillId
                    ? MOCK_DRILLS.find((d) => d.id === drillId)
                    : null;
                  onUpdate(node.id, {
                    drillId,
                    label: drill?.name ?? node.label,
                    durationMinutes:
                      drill?.durationMinutes ?? node.durationMinutes,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DRILL}>None</SelectItem>
                  {MOCK_DRILLS.map((drill) => (
                    <SelectItem key={drill.id} value={drill.id}>
                      {drill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Linked Drill Details */}
          {linkedDrill && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {linkedDrill.name}
              </p>
              {linkedDrill.subtitle && (
                <p className="text-xs text-muted-foreground">
                  {linkedDrill.subtitle}
                </p>
              )}
              {linkedDrill.description && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  {linkedDrill.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {linkedDrill.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isStart && (
        <>
          <Separator />
          <div className="p-4">
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              onClick={() => {
                onDelete(node.id);
              }}
            >
              <Trash2 />
              Delete Block
            </Button>
          </div>
        </>
      )}
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
