# Practice Planner — Future Improvements

## Code Quality

- **Magic offset arithmetic in `node-geometry.ts`**: The comments "canvas shifts start by -50 + 130 = +80" expose hardcoded offsets that will break if node dimensions change. Derive from width constants instead.
- **Edge label width uses manual char-pixel math (`workflow-edge.tsx`)**: `edge.label.length * 7 + 12` is a crude monospace approximation. Wrong for variable-width fonts, non-ASCII, or non-1x zoom. Use SVG `getComputedTextLength()` or a `textLength` attribute.
- **`autoLayout` uses `Array.shift()` for BFS (O(n²))**: Fine for typical practice sizes, but a proper deque would be more correct.
- **Extract `cn` utility**: Replace manual template-literal class concatenations — reuse `cn` from `@laxdb/ui` to reduce noise.
- **`globals.css` SVG workaround**: `svg, svg * { position: static }` patches a bug where a global `div { position: relative }` in `@laxdb/ui` breaks SVG layout. Fix the root cause in `@laxdb/ui/globals.css` instead.
- **`@laxdb/api` added to `@laxdb/cli`**: Verify this lockfile change was intentional — may be an accidental dependency from the merge.

## Architecture

- **Consider folding into a future product app**: Evaluate whether this should remain a standalone Cloudflare Worker or eventually live inside a broader application surface to avoid maintaining a separate deployment target.
