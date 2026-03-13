import { Sparkles, Clock, X } from "lucide-react";
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

const CATEGORY_OPTIONS: {
  value: DrillCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "passing", label: "Passing", emoji: "." },
  { value: "shooting", label: "Shooting", emoji: "." },
  { value: "defense", label: "Defense", emoji: "." },
  { value: "ground-balls", label: "Ground Balls", emoji: "." },
  { value: "face-offs", label: "Face-offs", emoji: "." },
  { value: "transition", label: "Transition", emoji: "." },
  { value: "man-up", label: "Man-Up", emoji: "." },
  { value: "man-down", label: "Man-Down", emoji: "." },
  { value: "conditioning", label: "Conditioning", emoji: "." },
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

  if (!isOpen) return null;

  const toggleCategory = (cat: DrillCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="z-10 w-[460px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Sparkles
              size={18}
              className="text-amber-600 dark:text-amber-400"
            />
          </div>
          <div>
            <h2
              className="text-base font-semibold text-foreground"
              style={{ fontFamily: "var(--font-sans)", fontStyle: "normal" }}
            >
              Quick Plan
            </h2>
            <p className="text-xs text-muted-foreground">
              Auto-generate a practice flow in seconds
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 space-y-5">
          {/* Duration */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Clock size={12} />
              Practice Duration
            </label>
            <div className="flex items-center gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setDuration(preset);
                  }}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    duration === preset
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {preset} min
                </button>
              ))}
              <input
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(parseInt(e.target.value, 10) || 60);
                }}
                className="w-20 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10"
                min={30}
                max={180}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Focus Areas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    toggleCategory(cat.value);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    categories.includes(cat.value)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="text-[10px] text-destructive mt-1">
                Select at least one focus area
              </p>
            )}
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeWarmup}
                onChange={(e) => {
                  setIncludeWarmup(e.target.checked);
                }}
                className="rounded accent-foreground"
              />
              Include warm-up
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={includeCooldown}
                onChange={(e) => {
                  setIncludeCooldown(e.target.checked);
                }}
                className="rounded accent-foreground"
              />
              Include cool-down
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg"
          >
            Cancel
          </button>
          <button
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
            className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles size={14} />
            Generate Plan
          </button>
        </div>
      </div>
    </div>
  );
}
