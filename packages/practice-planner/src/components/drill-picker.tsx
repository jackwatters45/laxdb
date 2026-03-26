import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@laxdb/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@laxdb/ui/components/ui/popover";
import { Clock, Flame, Snowflake, Target } from "lucide-react";
import { useState } from "react";

import { MOCK_DRILLS } from "@/data/mock";
import type { Drill } from "@/types";

interface DrillPickerPopoverProps {
  children: React.ReactNode;
  onSelect: (drill: Drill) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A popover with a searchable drill picker.
 * Wraps a trigger element (e.g. the "+" button between nodes).
 */
export function DrillPickerPopover({
  children,
  onSelect,
  open,
  onOpenChange,
}: DrillPickerPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={children as React.ReactElement} />
      <PopoverContent className="w-[280px] p-0" side="right" align="start">
        <DrillPickerList
          onSelect={(drill) => {
            onSelect(drill);
            setIsOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface DrillPickerListProps {
  onSelect: (drill: Drill) => void;
}

function DrillPickerList({ onSelect }: DrillPickerListProps) {
  return (
    <Command>
      <CommandInput placeholder="Search drills..." />
      <CommandList>
        <CommandEmpty>No drills found.</CommandEmpty>
        <CommandGroup heading="Warm-ups">
          {MOCK_DRILLS.filter((d) => d.tags.includes("warmup")).map((drill) => (
            <DrillOption key={drill.id} drill={drill} onSelect={onSelect} />
          ))}
        </CommandGroup>
        <CommandGroup heading="Drills">
          {MOCK_DRILLS.filter(
            (d) => !d.tags.includes("warmup") && !d.tags.includes("cooldown"),
          ).map((drill) => (
            <DrillOption key={drill.id} drill={drill} onSelect={onSelect} />
          ))}
        </CommandGroup>
        <CommandGroup heading="Cool-downs">
          {MOCK_DRILLS.filter((d) => d.tags.includes("cooldown")).map(
            (drill) => (
              <DrillOption key={drill.id} drill={drill} onSelect={onSelect} />
            ),
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function DrillOption({
  drill,
  onSelect,
}: {
  drill: Drill;
  onSelect: (drill: Drill) => void;
}) {
  const Icon = drill.tags.includes("warmup")
    ? Flame
    : drill.tags.includes("cooldown")
      ? Snowflake
      : Target;

  return (
    <CommandItem
      value={`${drill.name} ${drill.tags.join(" ")}`}
      onSelect={() => {
        onSelect(drill);
      }}
    >
      <Icon className="text-muted-foreground" />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="truncate">{drill.name}</span>
        {drill.durationMinutes && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="size-2.5" />
            <span className="tabular-nums">{drill.durationMinutes} min</span>
            <span>· {drill.difficulty}</span>
          </span>
        )}
      </div>
    </CommandItem>
  );
}
