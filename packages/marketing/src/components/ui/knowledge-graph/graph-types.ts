/**
 * Graph data types for knowledge graph visualization
 */

export interface GraphNode {
  /** Unique identifier for the node */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Node type: 'post' for blog posts, 'tag' for tag nodes */
  readonly type: "post" | "tag";
  /** URL slug for navigation (posts only) */
  readonly slug?: string;
  /** Color for the node (optional, can be derived from type) */
  readonly color?: string;
  /** Size multiplier (based on connections) */
  readonly size?: number;
}

export interface GraphLink {
  /** Source node ID */
  readonly source: string;
  /** Target node ID */
  readonly target: string;
  /** Link type: 'tag' for post-tag connections, 'internal' for post-post links */
  readonly type: "tag" | "internal";
}

export interface GraphData {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
}
