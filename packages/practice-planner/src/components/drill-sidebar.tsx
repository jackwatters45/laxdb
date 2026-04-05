import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Separator } from "@laxdb/ui/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { Search, Clock, Flame, Target, Snowflake, X } from "lucide-react";
import { useState } from "react";

import { useDrills } from "@/hooks/use-drills";
import { drillToType } from "@/lib/drill-utils";
import type { Drill, PracticeItemType } from "@/types";

interface DrillSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDrill: (drill: Drill, type: PracticeItemType) => void;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "warmup", label: "Warm-ups", tag: "warmup" },
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up" },
  { value: "conditioning", label: "Conditioning" },
  { value: "cooldown", label: "Cool-downs", tag: "cooldown" },
] as const;

const isSidebarCategory = (
  value: string,
): value is (typeof CATEGORIES)[number]["value"] =>
  CATEGORIES.some((category) => category.value === value);

type SidebarCategory = (typeof CATEGORIES)[number]["value"];
type SidebarDrillCategory = Extract<Drill["category"][number], SidebarCategory>;

const DRILL_CATEGORY_VALUES: readonly SidebarDrillCategory[] = [
  "passing",
  "shooting",
  "defense",
  "ground-balls",
  "face-offs",
  "transition",
  "man-up",
  "conditioning",
];

const isDrillSidebarCategoryValue = (
  value: SidebarCategory,
): value is SidebarDrillCategory =>
  DRILL_CATEGORY_VALUES.some((category) => category === value);

export function DrillSidebar({
  isOpen,
  onClose,
  onAddDrill,
}: DrillSidebarProps) {
  const drills = useDrills();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]["value"]>("all");

  const filtered = drills.filter((drill) => {
    const matchesSearch =
      !search ||
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      (drill.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      drill.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const cat = CATEGORIES.find((c) => c.value === activeCategory);
    const matchesCategory =
      activeCategory === "all"
        ? true
        : cat && "tag" in cat
          ? drill.tags.includes(cat.tag)
          : isDrillSidebarCategoryValue(activeCategory)
            ? drill.category.includes(activeCategory)
            : false;

    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="w-[320px] h-full border-r border-border bg-card flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="text-sm font-medium text-foreground">Drill Library</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Search drills..."
            className="pl-7"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="px-4 pb-3">
        <ToggleGroup
          value={[activeCategory]}
          onValueChange={(values) => {
            const next = values[0];
            if (next && isSidebarCategory(next)) setActiveCategory(next);
          }}
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
        >
          {CATEGORIES.map((cat) => (
            <ToggleGroupItem key={cat.value} value={cat.value}>
              {cat.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      {/* Drill list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 space-y-1">
          {filtered.map((drill) => (
            <DrillCard
              key={drill.publicId}
              drill={drill}
              onAdd={() => {
                onAddDrill(drill, drillToType(drill));
              }}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
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
    <Button
      variant="ghost"
      size="lg"
      onClick={onAdd}
      className="w-full justify-start h-auto py-2 px-2.5"
    >
      <div className="flex flex-col items-start gap-1 w-full min-w-0">
        <div className="flex items-center gap-2 w-full min-w-0">
          <TypeIcon className="size-3 flex-shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium truncate">{drill.name}</span>
        </div>
        {drill.subtitle && (
          <p className="text-[11px] text-muted-foreground/70 truncate pl-5 w-full">
            {drill.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 pl-5">
          {drill.durationMinutes && (
            <Badge variant="outline" className="h-4 text-[10px] px-1.5 gap-0.5">
              <Clock className="size-2.5" />
              {drill.durationMinutes}m
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground/50">
            {drill.difficulty}
          </span>
        </div>
      </div>
    </Button>
  );
}
