import { useCallback, useEffect, useRef, useState } from "react";

import type { PracticeGraph } from "@/types";

interface BuiltPayload<P> {
  payload: P;
}

interface UsePracticePersistenceOptions<P> {
  practice: PracticeGraph;
  buildPayload: (current: PracticeGraph) => BuiltPayload<P>;
  onSave: (payload: P) => Promise<unknown>;
  debounceMs?: number;
}

export function usePracticePersistence<P>({
  practice,
  buildPayload,
  onSave,
  debounceMs = 2000,
}: UsePracticePersistenceOptions<P>) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

        const { payload } = buildPayloadRef.current(nextPractice);

        // oxlint-disable-next-line no-await-in-loop -- queued saves must flush in order
        await onSaveRef.current(payload);
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
