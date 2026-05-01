import { useCallback, useEffect, useRef, useState } from "react";

import type { PracticeGraph, PracticeNode } from "@/types";

interface BuiltPayload<P> {
  payload: P;
  persistedIds: readonly string[];
}

interface UsePracticePersistenceOptions<P> {
  practice: PracticeGraph;
  initialNodes: readonly PracticeNode[];
  buildPayload: (
    current: PracticeGraph,
    knownIds: ReadonlySet<string>,
  ) => BuiltPayload<P>;
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
  const knownIdsRef = useRef(new Set(initialNodes.map((node) => node.id)));
  const queuedPracticeRef = useRef<PracticeGraph | null>(null);
  const isFirstRender = useRef(true);
  const isSavingRef = useRef(false);

  const buildPayloadRef = useRef(buildPayload);
  buildPayloadRef.current = buildPayload;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const save = useCallback(async (current: PracticeGraph) => {
    queuedPracticeRef.current = current;
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setSaving(true);

    try {
      while (queuedPracticeRef.current) {
        const nextPractice = queuedPracticeRef.current;
        queuedPracticeRef.current = null;

        const { payload, persistedIds } = buildPayloadRef.current(
          nextPractice,
          knownIdsRef.current,
        );

        // oxlint-disable-next-line no-await-in-loop -- queued saves must flush in order
        await onSaveRef.current(payload);
        knownIdsRef.current = new Set(persistedIds);
        setLastSaved(new Date());
      }
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, []);

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
