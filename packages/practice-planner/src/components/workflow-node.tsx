import type { LucideProps } from "lucide-react";
import {
  Play,
  Flame,
  Target,
  Snowflake,
  Droplets,
  Zap,
  GripVertical,
  GitBranch,
} from "lucide-react";

import type { PracticeNode, PracticeItemType } from "@/data/types";

const TYPE_CONFIG: Record<
  PracticeItemType,
  {
    bg: string;
    border: string;
    badge: string;
    badgeText: string;
    icon: React.ComponentType<LucideProps>;
  }
> = {
  warmup: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800/50",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    badgeText: "Warm-up",
    icon: Flame,
  },
  drill: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/50",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    badgeText: "Drill",
    icon: Target,
  },
  cooldown: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800/50",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    badgeText: "Cool-down",
    icon: Snowflake,
  },
  "water-break": {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800/50",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    badgeText: "Water",
    icon: Droplets,
  },
  activity: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800/50",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    badgeText: "Activity",
    icon: Zap,
  },
};

interface WorkflowNodeProps {
  node: PracticeNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  scale: number;
}

export function WorkflowNode({
  node,
  isSelected,
  onSelect,
  scale,
}: WorkflowNodeProps) {
  const config = TYPE_CONFIG[node.type];
  const Icon = config.icon;
  const isStart = node.label === "Start";
  const isSplit = node.label.toLowerCase().includes("split");

  if (isStart) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        className={`
          flex items-center justify-center
          w-[100px] h-[100px] rounded-full
          bg-foreground text-background
          shadow-md
          transition-all duration-200 ease-out
          cursor-pointer select-none
          ${isSelected ? "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background scale-105" : "hover:scale-[1.03] hover:shadow-lg"}
        `}
        style={{ fontSize: `${Math.max(11, 14 / Math.max(scale, 0.5))}px` }}
      >
        <div className="flex flex-col items-center gap-1">
          <Play size={20} />
          <span className="text-xs font-semibold tracking-wide uppercase">
            Start
          </span>
        </div>
      </button>
    );
  }

  if (isSplit) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        className={`
          flex items-center justify-center
          w-[180px] h-[56px] rounded-full
          border-2 border-dashed border-violet-300 dark:border-violet-700
          bg-violet-50/80 dark:bg-violet-950/40
          shadow-sm
          transition-all duration-200 ease-out
          cursor-pointer select-none
          ${isSelected ? "ring-2 ring-violet-400/50 ring-offset-2 ring-offset-background scale-105 border-solid" : "hover:scale-[1.02] hover:shadow-md hover:border-violet-400"}
        `}
      >
        <GitBranch size={16} className="text-violet-500 mr-2" />
        <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
          {node.label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={`
        w-[260px] rounded-xl border
        ${config.bg} ${config.border}
        shadow-sm
        transition-all duration-200 ease-out
        cursor-pointer select-none text-left
        ${isSelected ? "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background scale-[1.02] shadow-md" : "hover:scale-[1.01] hover:shadow-md"}
      `}
    >
      <div className="p-3.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <Icon size={14} className="opacity-60" />
            </div>
            <span className="text-sm font-semibold truncate leading-tight text-foreground">
              {node.label}
            </span>
          </div>
          <GripVertical size={14} className="flex-shrink-0 opacity-20 mt-0.5" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${config.badge}`}
          >
            {config.badgeText}
          </span>
          {node.durationMinutes && (
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
              {node.durationMinutes} min
            </span>
          )}
          {node.groups.length > 0 && node.groups[0] !== "all" && (
            <span className="text-[11px] text-muted-foreground/70 truncate">
              {node.groups.join(", ")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
