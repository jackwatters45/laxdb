# feat: Public Feedback Page

Public-facing feedback/support page on the marketing site. Linear-inspired minimal design: single textarea, optional file attachments, email fallback. Frontend-only (no backend).

## Overview

Add `/feedback` route to `packages/marketing`. The page has three elements:

1. **Textarea** -- free-form text, no categories or structured inputs
2. **File upload** -- images/video via click-to-browse + drag-and-drop, with inline previews
3. **Email fallback** -- `mailto:jack@laxdb.io` link as secondary option

Design cues from Linear's `/contact/support`: dialog-as-card layout, radical simplicity, generous whitespace. Adapted to laxdb's editorial aesthetic (serif headings, warm tones).

## Acceptance Criteria

- [ ] `/feedback` route renders on marketing site with NavBar + Footer from `__root.tsx`
- [ ] Single textarea field -- placeholder guides the user, no min length enforcement (frontend-only)
- [ ] "Attach images or videos" trigger opens file picker. Accepts PNG/JPG/WebP/MP4/MOV
- [ ] Drag-and-drop works on the upload area
- [ ] Inline thumbnails (images) and video frames appear below the textarea after selection
- [ ] Max 3 files, max 10 MB each, with user-visible error on rejection
- [ ] Remove button on each attachment
- [ ] "Send message" button (disabled state while empty). Shows toast "Thanks for your feedback" on click, clears form (no actual submission)
- [ ] Email fallback: "or email us at jack@laxdb.io" with `mailto:` link in form footer
- [ ] Matches marketing site typography/spacing conventions (serif headings, `text-muted-foreground`, etc.)
- [ ] Accessible: keyboard-navigable upload, `aria-live` announcements, focus-visible rings
- [ ] Verify in browser using visual-feedback

## Files to Create/Modify

### New files

#### `packages/marketing/src/routes/feedback.tsx`

The route and page component. Single file, no extraction needed.

Structure (Linear dialog-card pattern adapted to marketing aesthetic):

```
<main> (max-w-screen-sm centered, py-16/32)
  <header>
    <h1 serif italic> "Get in touch"
    <p muted> "We'd love to hear from you."
  </header>

  <div card> (border, rounded-xl, overflow-hidden)
    <div card-header> (border-b, px-6 py-4)
      <span> "Send a message"
    </div>

    <div card-body> (p-6)
      <label muted> "Tell us what's on your mind."
      <textarea rows=5 placeholder="How do I..." resize-y>

      <UploadArea>
        -- hidden input[type=file] multiple
        -- label as trigger: icon + "Attach images or videos"
        -- drag-and-drop via react-dropzone useDropzone hook
        -- thumbnails inline below (size-16, rounded, object-cover)
        -- remove buttons (X) on hover
      </UploadArea>
    </div>

    <div card-footer> (border-t, px-6 py-4, flex justify-between)
      <span muted> "or email us at " <a mailto> jack@laxdb.io
      <button> "Send message"
    </div>
  </div>
</main>
```

**Implementation notes:**
- Use `react-dropzone` `useDropzone` hook for file handling (install in marketing package)
- `URL.createObjectURL()` for previews, revoke on remove + unmount
- `accept`: `{ "image/png": [".png"], "image/jpeg": [".jpg",".jpeg"], "image/webp": [".webp"], "video/mp4": [".mp4"], "video/quicktime": [".mov"] }`
- `maxSize: 10 * 1024 * 1024`, `maxFiles: 3`
- On "Send message" click: `toast` (sonner) success message, reset form state. No server call.
- Button disabled when textarea empty
- Marketing site uses `@remixicon/react` for icons (not lucide)

### Dependencies

```bash
bun add react-dropzone --filter @laxdb/marketing
```

`sonner` -- check if already in marketing package, add if not.

## Design Details

| Element | Style |
|---------|-------|
| Page heading | `font-serif text-3xl italic text-foreground` (matches about.tsx) |
| Subheading | `text-muted-foreground` |
| Card | `border border-border rounded-xl bg-card` (subtle surface) |
| Card header/footer | `border-b border-border` / `border-t border-border`, `px-6 py-4` |
| Card body | `p-6 space-y-4` |
| Textarea | Full width, `bg-transparent border border-border rounded-lg`, `placeholder:text-muted-foreground` |
| Upload trigger | Inline text link style: icon + "Attach images or videos", `text-muted-foreground hover:text-foreground transition-colors` |
| Upload drag state | Card body gets `ring-2 ring-primary/30 bg-primary/5` overlay |
| Thumbnails | `size-16 rounded-md object-cover border bg-muted` with `group-hover` X button |
| Email link | `text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground` (matches about.tsx links) |
| Send button | Solid foreground button: `bg-foreground text-background rounded-md px-5 py-2.5 text-sm font-medium` |

## Not Doing

- Backend submission (explicitly deferred)
- Category/topic selector (user wants "just a text box")
- Rating system (existing web app feedback has this; this page is simpler)
- Auth requirement (public page, no login needed)
- File upload to storage (files stay in browser state, discarded on form reset)
