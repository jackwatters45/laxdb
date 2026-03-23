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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="z-10 w-[400px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30">
            <GitBranch
              size={18}
              className="text-violet-600 dark:text-violet-400"
            />
          </div>
          <div>
            <h2
              className="text-base font-semibold text-foreground"
              style={{ fontFamily: "var(--font-sans)", fontStyle: "normal" }}
            >
              Group Split
            </h2>
            <p className="text-xs text-muted-foreground">
              Define groups to work in parallel lanes
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 space-y-3">
          {groups.map((group, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={group}
                onChange={(e) => {
                  const updated = [...groups];
                  updated[i] = e.target.value;
                  setGroups(updated);
                }}
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10"
                placeholder="Group name"
              />
              {groups.length > 2 && (
                <button
                  aria-label="Remove group"
                  onClick={() => {
                    removeGroup(i);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Add new group */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroup}
              onChange={(e) => {
                setNewGroup(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addGroup();
              }}
              placeholder="Add another group..."
              className="flex-1 px-3 py-2 text-sm bg-background border border-dashed border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 placeholder:text-muted-foreground/40"
            />
            <button
              onClick={addGroup}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Plus size={14} />
            </button>
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
              const valid = groups.filter((g) => g.trim());
              if (valid.length >= 2) {
                onConfirm(valid);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Split
          </button>
        </div>
      </div>
    </div>
  );
}
