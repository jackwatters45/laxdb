import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { ScrollArea } from "@laxdb/ui/components/ui/scroll-area";
import { Separator } from "@laxdb/ui/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@laxdb/ui/components/ui/sheet";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { Search, Clock, Flame, Target, Snowflake } from "lucide-react";
import { useState } from "react";

import { MOCK_DRILLS } from "@/data/mock-drills";
import type { Drill, PracticeItemType } from "@/data/types";

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
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="left"
        className="w-[320px] sm:max-w-[320px] p-0 flex flex-col"
        showCloseButton
      >
        <SheetHeader className="px-4 pt-4 pb-3">
          <SheetTitle>Drill Library</SheetTitle>
        </SheetHeader>

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

        <div className="px-4 pb-3">
          <ToggleGroup
            value={[activeCategory]}
            onValueChange={(values) => {
              const next = values[0] as string | undefined;
              if (next) setActiveCategory(next);
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

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-1">
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
              <p className="text-xs text-muted-foreground text-center py-8">
                No drills match your search.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
