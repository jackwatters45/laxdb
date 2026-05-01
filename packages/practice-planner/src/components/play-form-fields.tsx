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
import { Textarea } from "@laxdb/ui/components/ui/textarea";

import { isOptionValue } from "@/lib/option-guards";
import { PLAY_CATEGORY_OPTIONS } from "@/lib/play-definitions";
import type { PlayCategory } from "@/types";

export interface PlayFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  category: PlayCategory;
  setCategory: (v: PlayCategory) => void;
  formation: string;
  setFormation: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  personnelNotes: string;
  setPersonnelNotes: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  diagramUrl: string;
  setDiagramUrl: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
}

export function PlayFormFields(props: PlayFormFieldsProps) {
  return (
    <>
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Basic Info</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Name and category are required. Everything else is optional.
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
              placeholder="e.g. 2-3-1 Slide"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={props.category}
              onValueChange={(value) => {
                if (isOptionValue(PLAY_CATEGORY_OPTIONS, value)) {
                  props.setCategory(value);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAY_CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="formation">Formation</Label>
            <Input
              id="formation"
              value={props.formation}
              onChange={(e) => {
                props.setFormation(e.target.value);
              }}
              placeholder="e.g. 2-3-1, 1-4-1, 3-3"
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
              placeholder="Play setup, reads, coaching points..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Personnel</h2>

        <div>
          <Label htmlFor="personnelNotes">Personnel Notes</Label>
          <Textarea
            id="personnelNotes"
            value={props.personnelNotes}
            onChange={(e) => {
              props.setPersonnelNotes(e.target.value);
            }}
            placeholder="Who goes where, matchup assignments, slides..."
            className="min-h-[80px]"
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Resources</h2>

        <div className="grid gap-4">
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
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Tags</h2>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={props.tags}
            onChange={(e) => {
              props.setTags(e.target.value);
            }}
            placeholder="settled, unsettled, invert, pick (comma-separated)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Comma-separated. Use tags to organize and find plays quickly.
          </p>
        </div>
      </section>
    </>
  );
}
