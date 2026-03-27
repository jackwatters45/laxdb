import { useCallback, useEffect, useRef, useState } from "react";

import type {
  PracticeGraph,
  PracticeItemPriority,
  PracticeItemType,
  PracticeNode,
  PracticeNodeVariant,
  PracticeStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UsePracticePersistenceOptions<P> {
  practice: PracticeGraph;
  initialNodes: readonly PracticeNode[];
  buildPayload: (current: PracticeGraph, knownIds: ReadonlySet<string>) => P;
  onSave: (payload: P) => Promise<unknown>;
  debounceMs?: number;
}

export function usePracticePersistence<P>({
  practice,
  initialNodes,
  buildPayload,
  onSave,
  debounceMs = 2000,
}: UsePracticePersistenceOptions<P>) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownIds = useRef(new Set(initialNodes.map((n) => n.id)));
  const isFirstRender = useRef(true);

  const save = useCallback(
    async (current: PracticeGraph) => {
      const payload = buildPayload(current, knownIds.current);

      setSaving(true);
      try {
        await onSave(payload);

        // Update known IDs after successful save
        for (const n of current.nodes) knownIds.current.add(n.id);
        const currentIds = new Set(current.nodes.map((n) => n.id));
        for (const id of knownIds.current) {
          if (!currentIds.has(id)) knownIds.current.delete(id);
        }

        setLastSaved(new Date());
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, onSave],
  );

  // Debounced auto-save — skip initial render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save(practice);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [practice, debounceMs, save]);

  return { saving, lastSaved, saveNow: () => save(practice) };
}
