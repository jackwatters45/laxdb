import { Button } from "@laxdb/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@laxdb/ui/components/ui/dialog";
import { Input } from "@laxdb/ui/components/ui/input";
import { GitBranch, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SplitNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groups: string[]) => void;
}

export function SplitNodeModal({
  isOpen,
  onClose,
  onConfirm,
}: SplitNodeModalProps) {
  const [groups, setGroups] = useState<string[]>(["Offense", "Defense"]);
  const [newGroup, setNewGroup] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGroups(["Offense", "Defense"]);
      setNewGroup("");
    }
  }, [isOpen]);

  const addGroup = () => {
    const name = newGroup.trim();
    if (name && !groups.includes(name)) {
      setGroups([...groups, name]);
      setNewGroup("");
    }
  };

  const removeGroup = (index: number) => {
    if (groups.length > 2) {
      setGroups(groups.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-4 text-violet-500" />
            Group Split
          </DialogTitle>
          <DialogDescription>
            Define groups to work in parallel lanes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {groups.map((group, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={group}
                onChange={(e) => {
                  const updated = [...groups];
                  updated[i] = e.target.value;
                  setGroups(updated);
                }}
                placeholder="Group name"
              />
              {groups.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    removeGroup(i);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X />
                  <span className="sr-only">Remove group</span>
                </Button>
              )}
            </div>
          ))}

          {/* Add new group */}
          <div className="flex items-center gap-2">
            <Input
              value={newGroup}
              onChange={(e) => {
                setNewGroup(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addGroup();
              }}
              placeholder="Add another group..."
              className="border-dashed"
            />
            <Button variant="ghost" size="icon-sm" onClick={addGroup}>
              <Plus />
              <span className="sr-only">Add group</span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const valid = groups.filter((g) => g.trim());
              if (valid.length >= 2) {
                onConfirm(valid);
                onClose();
              }
            }}
          >
            Create Split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
