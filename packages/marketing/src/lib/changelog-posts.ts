import { Array } from "effect";
import { allChangelogs } from "content-collections";

/** All changelog entries excluding drafts, sorted newest first */
export const publishedChangelogs = Array.filter(allChangelogs, (c) => !c.draft).toSorted(
  (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
);
