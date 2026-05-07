import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Separator } from "@laxdb/ui/components/ui/separator";
import { Switch } from "@laxdb/ui/components/ui/switch";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@laxdb/ui/components/ui/toggle-group";
import { Clock, Users } from "lucide-react";

import {
  DRILL_CATEGORY_OPTIONS,
  DRILL_DIFFICULTY_OPTIONS,
  DRILL_FIELD_SPACE_OPTIONS,
  DRILL_INTENSITY_OPTIONS,
  POSITION_GROUP_OPTIONS,
} from "@/lib/drill-definitions";
import { isOptionValue } from "@/lib/option-guards";
import type {
  Difficulty,
  DrillCategory,
  FieldSpace,
  Intensity,
  PositionGroup,
} from "@/types";

export interface DrillFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  categories: DrillCategory[];
  setCategories: (v: DrillCategory[]) => void;
  positionGroups: PositionGroup[];
  setPositionGroups: (v: PositionGroup[]) => void;
  intensity: Intensity | "";
  setIntensity: (v: Intensity | "") => void;
  contact: boolean;
  setContact: (v: boolean) => void;
  competitive: boolean;
  setCompetitive: (v: boolean) => void;
  playerCount: string;
  setPlayerCount: (v: string) => void;
  durationMinutes: string;
  setDurationMinutes: (v: string) => void;
  fieldSpace: FieldSpace | "";
  setFieldSpace: (v: FieldSpace | "") => void;
  equipment: string;
  setEquipment: (v: string) => void;
  diagramUrl: string;
  setDiagramUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  coachNotes: string;
  setCoachNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
}

export function DrillFormFields(props: DrillFormFieldsProps) {
  return (
    <>
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Basic Info</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Name is required. Everything else is optional.
          </p>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={props.name}
              onChange={(e) => {
                props.setName(e.target.value);
              }}
              placeholder="e.g. 3v2 Ground Ball Scoop"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={props.subtitle}
              onChange={(e) => {
                props.setSubtitle(e.target.value);
              }}
              placeholder="Short description"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={props.description}
              onChange={(e) => {
                props.setDescription(e.target.value);
              }}
              placeholder="Drill setup, rules, coaching points..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Classification
        </h2>

        <div className="grid gap-4">
          <div>
            <Label>Difficulty</Label>
            <Select
              value={props.difficulty}
              onValueChange={(value) => {
                if (isOptionValue(DRILL_DIFFICULTY_OPTIONS, value)) {
                  props.setDifficulty(value);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRILL_DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categories</Label>
            <ToggleGroup
              value={props.categories}
              onValueChange={(values) => {
                props.setCategories(
                  values.filter((value): value is DrillCategory =>
                    isOptionValue(DRILL_CATEGORY_OPTIONS, value),
                  ),
                );
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap justify-start"
            >
              {DRILL_CATEGORY_OPTIONS.map((category) => (
                <ToggleGroupItem key={category.value} value={category.value}>
                  {category.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div>
            <Label>Position Groups</Label>
            <ToggleGroup
              value={props.positionGroups}
              onValueChange={(values) => {
                props.setPositionGroups(
                  values.filter((value): value is PositionGroup =>
                    isOptionValue(POSITION_GROUP_OPTIONS, value),
                  ),
                );
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="flex-wrap justify-start"
            >
              {POSITION_GROUP_OPTIONS.map((group) => (
                <ToggleGroupItem key={group.value} value={group.value}>
                  {group.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Logistics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">
              <Clock size={12} className="inline mr-1.5 -mt-0.5" />
              Duration (min)
            </Label>
            <Input
              id="duration"
              type="number"
              value={props.durationMinutes}
              onChange={(e) => {
                props.setDurationMinutes(e.target.value);
              }}
              placeholder="15"
              min={1}
              max={120}
            />
          </div>
          <div>
            <Label htmlFor="playerCount">
              <Users size={12} className="inline mr-1.5 -mt-0.5" />
              Min Players
            </Label>
            <Input
              id="playerCount"
              type="number"
              value={props.playerCount}
              onChange={(e) => {
                props.setPlayerCount(e.target.value);
              }}
              placeholder="6"
              min={1}
              max={50}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Intensity</Label>
            <Select
              value={props.intensity || undefined}
              onValueChange={(value) => {
                if (isOptionValue(DRILL_INTENSITY_OPTIONS, value)) {
                  props.setIntensity(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {DRILL_INTENSITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Field Space</Label>
            <Select
              value={props.fieldSpace || undefined}
              onValueChange={(value) => {
                if (isOptionValue(DRILL_FIELD_SPACE_OPTIONS, value)) {
                  props.setFieldSpace(value);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {DRILL_FIELD_SPACE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="contact"
              checked={props.contact}
              onCheckedChange={props.setContact}
            />
            <Label htmlFor="contact">Contact</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="competitive"
              checked={props.competitive}
              onCheckedChange={props.setCompetitive}
            />
            <Label htmlFor="competitive">Competitive</Label>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Equipment & Resources
        </h2>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="equipment">Equipment</Label>
            <Input
              id="equipment"
              value={props.equipment}
              onChange={(e) => {
                props.setEquipment(e.target.value);
              }}
              placeholder="balls, cones, goals (comma-separated)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diagramUrl">Diagram URL</Label>
              <Input
                id="diagramUrl"
                value={props.diagramUrl}
                onChange={(e) => {
                  props.setDiagramUrl(e.target.value);
                }}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={props.videoUrl}
                onChange={(e) => {
                  props.setVideoUrl(e.target.value);
                }}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Notes & Tags</h2>

        <div>
          <Label htmlFor="coachNotes">Coach Notes</Label>
          <Textarea
            id="coachNotes"
            value={props.coachNotes}
            onChange={(e) => {
              props.setCoachNotes(e.target.value);
            }}
            placeholder="Private coaching notes, variations, progressions..."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={props.tags}
            onChange={(e) => {
              props.setTags(e.target.value);
            }}
            placeholder="warmup, cooldown, team-building (comma-separated)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated. Use &quot;warmup&quot; or &quot;cooldown&quot; to
            categorize automatically.
          </p>
        </div>
      </section>
    </>
  );
}
