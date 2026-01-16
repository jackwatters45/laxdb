import { loader } from "fumadocs-core/source";
import { docs } from "fumadocs-mdx:collections/server";
import * as icons from "lucide-static";

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) {
      return;
    }

    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- guarded by `in` check
    if (icon in icons) return icons[icon as keyof typeof icons];
  },
});
