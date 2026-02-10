/** Tags that have dedicated routes - maps tag to redirect path */
export const ROUTING_TAG_REDIRECTS: Record<string, string> = {
  blog: "/blog",
  wiki: "/wiki",
  opinion: "/blog?filter=opinion",
};

/** Set of routing tags for quick lookup */
export const ROUTING_TAGS = new Set(Object.keys(ROUTING_TAG_REDIRECTS));
