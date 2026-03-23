import {
  Search,
  ChevronRight,
  Clock,
  Flame,
  Target,
  Snowflake,
  X,
} from "lucide-react";
import { useState } from "react";

import { MOCK_DRILLS } from "@/data/mock-drills";
import type { Drill, PracticeItemType } from "@/data/types";

interface DrillSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDrill: (drill: Drill, type: PracticeItemType) => void;
}

const CATEGORIES = [
  { value: "all", label: "All Drills" },
  { value: "warmup", label: "Warm-ups", tag: "warmup" },
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up/EMO" },
  { value: "conditioning", label: "Conditioning" },
  { value: "cooldown", label: "Cool-downs", tag: "cooldown" },
] as const;

function drillToType(drill: Drill): PracticeItemType {
  if (drill.tags.includes("warmup")) return "warmup";
  if (drill.tags.includes("cooldown")) return "cooldown";
  return "drill";
}

export function DrillSidebar({
  isOpen,
  onClose,
  onAddDrill,
}: DrillSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = MOCK_DRILLS.filter((drill) => {
    const matchesSearch =
      !search ||
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      (drill.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      drill.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const cat = CATEGORIES.find((c) => c.value === activeCategory);
    const matchesCategory =
      activeCategory === "all" ||
      drill.categories.includes(
        activeCategory as Drill["categories"][number],
      ) ||
      (cat && "tag" in cat && drill.tags.includes(cat.tag));

    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className={`
        h-full border-r border-border bg-card
        transition-all duration-300 ease-out overflow-hidden
        flex flex-col
        ${isOpen ? "w-[300px]" : "w-0"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Drill Library</h3>
        <button
          aria-label="Close"
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search drills..."
            className="w-full text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setActiveCategory(cat.value);
              }}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                activeCategory === cat.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drill List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="space-y-1">
          {filtered.map((drill) => (
            <DrillCard
              key={drill.id}
              drill={drill}
              onAdd={() => {
                onAddDrill(drill, drillToType(drill));
              }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-8">
              No drills match your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DrillCard({ drill, onAdd }: { drill: Drill; onAdd: () => void }) {
  const TypeIcon = drill.tags.includes("warmup")
    ? Flame
    : drill.tags.includes("cooldown")
      ? Snowflake
      : Target;

  return (
    <button
      onClick={onAdd}
      className="w-full text-left p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 transition-all group/drill"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon size={12} className="flex-shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">
            {drill.name}
          </span>
        </div>
        <ChevronRight
          size={14}
          className="flex-shrink-0 opacity-0 group-hover/drill:opacity-60 transition-opacity text-muted-foreground mt-0.5"
        />
      </div>
      {drill.subtitle && (
        <p className="text-[11px] text-muted-foreground/70 mt-0.5 pl-5 truncate">
          {drill.subtitle}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1.5 pl-5">
        {drill.durationMinutes && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock size={10} />
            {drill.durationMinutes}m
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/50">
          {drill.difficulty}
        </span>
      </div>
    </button>
  );
}
