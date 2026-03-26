import { Button } from "@laxdb/ui/components/ui/button";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { FileText, MapPin, Calendar, Clock, X } from "lucide-react";

import type { PracticeGraph } from "@/types";

interface PracticeSettingsProps {
  practice: PracticeGraph;
  totalMinutes: number;
  blockCount: number;
  onUpdate: (updates: Partial<PracticeGraph>) => void;
  onClose: () => void;
}

export function PracticeSettings({
  practice,
  totalMinutes,
  blockCount,
  onUpdate,
  onClose,
}: PracticeSettingsProps) {
  return (
    <div className="w-[340px] h-full border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground text-balance">
          Practice Details
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X />
        </Button>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-border flex gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Duration
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {totalMinutes} min
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Blocks
          </p>
          <p className="text-sm font-semibold tabular-nums">{blockCount}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-5">
          <Field label="Name" icon={<FileText className="size-3.5" />}>
            <Input
              value={practice.name}
              onChange={(e) => {
                onUpdate({ name: e.target.value });
              }}
              placeholder="Practice name"
            />
          </Field>

          <Field label="Date" icon={<Calendar className="size-3.5" />}>
            <Input
              type="date"
              value={practice.date ?? ""}
              onChange={(e) => {
                onUpdate({ date: e.target.value || null });
              }}
            />
          </Field>

          <Field label="Target Duration" icon={<Clock className="size-3.5" />}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={practice.durationMinutes ?? ""}
                onChange={(e) => {
                  onUpdate({
                    durationMinutes: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  });
                }}
                placeholder="—"
                className="w-20"
                min={15}
                max={300}
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </Field>

          <Field label="Location" icon={<MapPin className="size-3.5" />}>
            <Input
              value={practice.location ?? ""}
              onChange={(e) => {
                onUpdate({ location: e.target.value || null });
              }}
              placeholder="Field, gym, etc."
            />
          </Field>

          <Field label="Description" icon={<FileText className="size-3.5" />}>
            <Textarea
              value={practice.description ?? ""}
              onChange={(e) => {
                onUpdate({ description: e.target.value || null });
              }}
              placeholder="Practice focus, goals, themes..."
              className="min-h-[80px]"
            />
          </Field>

          <Field label="Notes" icon={<FileText className="size-3.5" />}>
            <Textarea
              value={practice.notes ?? ""}
              onChange={(e) => {
                onUpdate({ notes: e.target.value || null });
              }}
              placeholder="Reminders, equipment needed..."
              className="min-h-[60px]"
            />
          </Field>
        </div>
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
