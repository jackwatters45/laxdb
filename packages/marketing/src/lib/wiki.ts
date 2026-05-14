import type { Post } from "content-collections";

import { publishedPosts } from "./posts";

export interface WikiSection {
  key: string;
  label: string;
  description?: string;
}

const OTHER_SECTION: WikiSection = { key: "other", label: "Other" };

export const WIKI_SECTIONS: readonly WikiSection[] = [
  {
    key: "basics",
    label: "Basics",
    description: "Plain-language guides for new lacrosse players.",
  },
  { key: "league", label: "Leagues" },
  { key: "team", label: "Teams" },
  { key: "player", label: "Players" },
  { key: "skill", label: "Skills & Techniques" },
  { key: "media", label: "Media & Coverage" },
  { key: "event", label: "Events" },
  OTHER_SECTION,
];

const SECTION_KEYS = new Set(WIKI_SECTIONS.map((section) => section.key));

export function getWikiPosts(): Post[] {
  return publishedPosts.filter((post) => post.tags?.includes("wiki"));
}

export function isWikiPost(post: Post): boolean {
  return post.tags?.includes("wiki") ?? false;
}

export function getWikiPostBySlug(slug: string): Post | undefined {
  return getWikiPosts().find((post) => post.slug === slug);
}

export function getWikiSectionKey(post: Post): string {
  if (post.section && SECTION_KEYS.has(post.section)) return post.section;

  for (const tag of post.tags ?? []) {
    if (SECTION_KEYS.has(tag) && tag !== "wiki") return tag;
  }

  return "other";
}

export function getWikiSection(post: Post): WikiSection {
  const key = getWikiSectionKey(post);
  return WIKI_SECTIONS.find((section) => section.key === key) ?? OTHER_SECTION;
}

export function sortWikiPosts(posts: readonly Post[]): Post[] {
  return [...posts].toSorted((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title);
  });
}

export function groupWikiPostsBySection(posts: readonly Post[]): Map<WikiSection, Post[]> {
  const groups = new Map<WikiSection, Post[]>();

  for (const section of WIKI_SECTIONS) {
    groups.set(section, []);
  }

  for (const post of posts) {
    const section = getWikiSection(post);
    const sectionPosts = groups.get(section) ?? [];
    sectionPosts.push(post);
    groups.set(section, sectionPosts);
  }

  for (const [section, sectionPosts] of groups) {
    groups.set(section, sortWikiPosts(sectionPosts));
  }

  return groups;
}
