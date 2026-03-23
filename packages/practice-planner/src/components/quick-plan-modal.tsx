import { Button } from "@laxdb/ui/components/ui/button";
import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@laxdb/ui/components/ui/dialog";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { Sparkles, Clock } from "lucide-react";
import { useState } from "react";

import type { DrillCategory } from "@/data/types";

interface QuickPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: {
    durationMinutes: number;
    categories: DrillCategory[];
    includeWarmup: boolean;
    includeCooldown: boolean;
  }) => void;
}

const CATEGORY_OPTIONS: { value: DrillCategory; label: string }[] = [
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defense", label: "Defense" },
  { value: "ground-balls", label: "Ground Balls" },
  { value: "face-offs", label: "Face-offs" },
  { value: "transition", label: "Transition" },
  { value: "man-up", label: "Man-Up" },
  { value: "man-down", label: "Man-Down" },
  { value: "conditioning", label: "Conditioning" },
];

const DURATION_PRESETS = [60, 90, 120];

export function QuickPlanModal({
  isOpen,
  onClose,
  onGenerate,
}: QuickPlanModalProps) {
  const [duration, setDuration] = useState(90);
  const [categories, setCategories] = useState<DrillCategory[]>([
    "passing",
    "shooting",
    "defense",
  ]);
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeCooldown, setIncludeCooldown] = useState(true);

  const toggleCategory = (cat: DrillCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Quick Plan
          </DialogTitle>
          <DialogDescription>
            Auto-generate a practice flow in seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground gap-1.5">
              <Clock className="size-3" />
              Practice Duration
            </Label>
            <div className="flex items-center gap-2">
              <ToggleGroup
                value={[String(duration)]}
                onValueChange={(values) => {
                  const next = values[0] as string | undefined;
                  if (next) setDuration(parseInt(next, 10));
                }}
                variant="outline"
                spacing={1}
              >
                {DURATION_PRESETS.map((preset) => (
                  <ToggleGroupItem key={preset} value={String(preset)}>
                    {preset} min
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Input
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(parseInt(e.target.value, 10) || 60);
                }}
                className="w-20"
                min={30}
                max={180}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Focus Areas
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <Button
                  key={cat.value}
                  variant={
                    categories.includes(cat.value) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    toggleCategory(cat.value);
                  }}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="text-[10px] text-destructive">
                Select at least one focus area
              </p>
            )}
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeWarmup}
                onCheckedChange={(checked) => {
                  setIncludeWarmup(checked);
                }}
              />
              Include warm-up
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={includeCooldown}
                onCheckedChange={(checked) => {
                  setIncludeCooldown(checked);
                }}
              />
              Include cool-down
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (categories.length > 0) {
                onGenerate({
                  durationMinutes: duration,
                  categories,
                  includeWarmup,
                  includeCooldown,
                });
                onClose();
              }
            }}
            disabled={categories.length === 0}
          >
            <Sparkles />
            Generate Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
