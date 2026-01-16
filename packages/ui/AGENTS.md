# @laxdb/ui - Shared UI Components

shadcn/ui components built on **Base UI** (NOT Radix). Shared across web, marketing, docs.

## CRITICAL: Base UI vs Radix

This package uses **Base UI**, not Radix. APIs differ significantly. Check component source when unsure.

| Pattern | Radix | Base UI (This Project) |
|---------|-------|------------------------|
| Select placeholder | `<SelectValue placeholder="...">` | `<SelectValue>{(v) => v ?? "..."}</SelectValue>` |
| Dialog trigger | Implicit via context | Often explicit `open` prop |
| Checkbox state | `checked={bool}` | `checked={bool}` (same) |

## STRUCTURE

```
src/
├── components/
│   ├── ui/           # shadcn components (53+ files)
│   └── data-table/   # TanStack Table components (9 files)
├── hooks/            # React hooks (use-mobile, use-toast, etc.)
├── lib/              # Utilities (cn, utils)
└── globals.css       # Tailwind styles
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add shadcn component | `bunx --bun shadcn@latest add <name>` |
| Modify component | `src/components/ui/{component}.tsx` |
| Add data table feature | `src/components/data-table/` |
| Add hook | `src/hooks/` |
| Modify styles | `src/globals.css` |

## IMPORT PATTERN

```tsx
// From apps (web, marketing, docs)
import { Button } from "@laxdb/ui/components/ui/button";
import { cn } from "@laxdb/ui/lib/utils";
import { useToast } from "@laxdb/ui/hooks/use-toast";
```

## PACKAGE EXPORTS

- `@laxdb/ui/components/ui/*` - UI components
- `@laxdb/ui/components/*` - Other components (data-table, etc.)
- `@laxdb/ui/lib/*` - Utilities
- `@laxdb/ui/hooks/*` - React hooks
- `@laxdb/ui/globals.css` - Global styles

## FORMS PATTERN

```tsx
import { Field, FieldLabel, FieldError } from "@laxdb/ui/components/ui/field";
import { Controller } from "react-hook-form";

<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input {...field} id="email" />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## ANTI-PATTERNS

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| Radix API patterns | APIs differ | Check component source |
| Direct Tailwind in apps | Inconsistent | Use cn() utility, extend components |
| Copy-paste components | Loses updates | Import from @laxdb/ui |

## COMMANDS

```bash
bunx --bun shadcn@latest add <component>  # Add new component
bun run typecheck                          # Type check
bun run fix                                # Lint + format
```

## KEY COMPONENTS

| Component | Notes |
|-----------|-------|
| `theme-provider.tsx` | ThemeProvider for dark/light mode |
| `sonner.tsx` | Toast notifications |
| `data-table/` | Full TanStack Table integration |
| `field.tsx` | Form field wrapper components |
| `sidebar.tsx` | App sidebar layout |

## NOTES

- **motion**: Uses motion (framer-motion) for animations
- **shadcn ownership**: Components are generated but you own them - modify freely
- **Tailwind v4**: Some packages use v4 beta with different syntax
