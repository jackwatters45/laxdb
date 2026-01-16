import { type RefObject, useCallback, useEffect } from "react";

export function useScrollEnd(callback: () => void, target: RefObject<HTMLDivElement | null>) {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    const el = target.current;
    if (!el) {
      return;
    }
    el.addEventListener("scrollend", stableCallback);
    return () => {
      el.removeEventListener("scrollend", stableCallback);
    };
  }, [target, stableCallback]);
}
