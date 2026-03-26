import { createContext, useContext } from "react";

import type { Drill } from "@/types";

const DrillsContext = createContext<readonly Drill[] | null>(null);

export function DrillsProvider({
  drills,
  children,
}: {
  drills: readonly Drill[];
  children: React.ReactNode;
}) {
  return (
    <DrillsContext.Provider value={drills}>{children}</DrillsContext.Provider>
  );
}

export function useDrills(): readonly Drill[] {
  const ctx = useContext(DrillsContext);
  if (!ctx) throw new Error("useDrills must be used within DrillsProvider");
  return ctx;
}
