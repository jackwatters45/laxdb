import { useMemo } from "react"
import type { Post } from "content-collections"
import { buildGraphData } from "./graph-utils"
import type { GraphData } from "./graph-types"

/**
 * Hook to build graph data from posts
 * Memoizes the result to avoid recalculation on re-renders
 */
export function useGraphData(posts: readonly Post[]): GraphData {
  return useMemo(() => buildGraphData(posts), [posts])
}
