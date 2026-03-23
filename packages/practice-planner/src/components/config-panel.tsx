import {
  X,
  Clock,
  Users,
  FileText,
  Tag,
  AlertCircle,
  Trash2,
  Target,
} from "lucide-react";

import { MOCK_DRILLS } from "@/data/mock-drills";
import type {
  PracticeNode,
  PracticeItemType,
  PracticeItemPriority,
} from "@/data/types";

const PRACTICE_ITEM_TYPES = new Set<string>([
  "warmup",
  "drill",
  "cooldown",
  "water-break",
  "activity",
]);

function isPracticeItemType(value: string): value is PracticeItemType {
  return PRACTICE_ITEM_TYPES.has(value);
}

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
        <button
          aria-label="Close"
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Label */}
        <Field label="Label" icon={<Tag size={14} />}>
          <input
            type="text"
            value={node.label}
            onChange={(e) => {
              onUpdate(node.id, { label: e.target.value });
            }}
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
            disabled={isStart}
          />
        </Field>

        {/* Type */}
        {!isStart && (
          <Field label="Type" icon={<AlertCircle size={14} />}>
            <select
              value={node.type}
              onChange={(e) => {
                if (isPracticeItemType(e.target.value)) {
                  onUpdate(node.id, { type: e.target.value });
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow appearance-none"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {/* Duration */}
        {!isStart && (
          <Field label="Duration" icon={<Clock size={14} />}>
            <div className="flex items-center gap-2">
              <input
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
                className="w-20 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
                min={1}
                max={120}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </Field>
        )}

        {/* Groups */}
        <Field label="Groups" icon={<Users size={14} />}>
          <input
            type="text"
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
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow"
          />
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Comma-separated: all, Offense, Defense, Goalies
          </p>
        </Field>

        {/* Priority */}
        {!isStart && (
          <Field label="Priority" icon={<AlertCircle size={14} />}>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onUpdate(node.id, { priority: opt.value });
                  }}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                    node.priority === opt.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Notes */}
        <Field label="Notes" icon={<FileText size={14} />}>
          <textarea
            value={node.notes ?? ""}
            onChange={(e) => {
              onUpdate(node.id, {
                notes: e.target.value || null,
              });
            }}
            placeholder="Add coaching notes..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow min-h-[60px] leading-relaxed"
          />
        </Field>

        {/* Drill Picker */}
        {!isStart && node.type !== "water-break" && (
          <Field label="Linked Drill" icon={<Target size={14} />}>
            <select
              value={node.drillId ?? ""}
              onChange={(e) => {
                onUpdate(node.id, {
                  drillId: e.target.value || null,
                  label:
                    MOCK_DRILLS.find((d) => d.id === e.target.value)?.name ??
                    node.label,
                  durationMinutes:
                    MOCK_DRILLS.find((d) => d.id === e.target.value)
                      ?.durationMinutes ?? node.durationMinutes,
                });
              }}
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-shadow appearance-none"
            >
              <option value="">None</option>
              {MOCK_DRILLS.map((drill) => (
                <option key={drill.id} value={drill.id}>
                  {drill.name}
                </option>
              ))}
            </select>
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
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] bg-accent rounded text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isStart && (
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full justify-center"
          >
            <Trash2 size={14} />
            Delete Block
          </button>
        </div>
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
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
