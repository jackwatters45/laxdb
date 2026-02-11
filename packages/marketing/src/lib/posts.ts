import { Array } from "effect";
import { allPosts } from "content-collections";

/** All posts excluding drafts */
export const publishedPosts = Array.filter(allPosts, (p) => !p.draft);
