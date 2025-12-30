# @laxdb/ui - Shared UI Components

shadcn/ui components built on **Base UI** (NOT Radix). Shared across web, marketing, docs.

## STRUCTURE

```
src/
├── components/
│   ├── ui/           # shadcn components (53+ files)
│   └── data-table/   # TanStack Table components (9 files)
├── hooks/            # React hooks (use-mobile, use-toast, etc.)
├── lib/              # Utilities (cn, utils)
└── styles/           # globals.css
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add shadcn component | Run: `bunx --bun shadcn@latest add <name>` |
| Modify component | `src/components/ui/{component}.tsx` |
| Add data table feature | `src/components/data-table/` |
| Add hook | `src/hooks/` |
| Modify styles | `src/styles/globals.css` |

## CONVENTIONS

### Base UI vs Radix (CRITICAL)

This package uses **Base UI**, not Radix. APIs differ significantly:

| Pattern | Radix | Base UI (This Project) |
|---------|-------|------------------------|
| Select placeholder | `<SelectValue placeholder="...">` | `<SelectValue>{(v) => v ?? "..."}</SelectValue>` |
| Checkbox state | `checked={bool}` | `checked={bool}` (same) |
| Dialog trigger | Implicit via context | Often explicit `open` prop |

### Import Pattern

```tsx
// From apps (web, marketing, docs)
import { Button } from "@laxdb/ui/components/ui/button";
import { cn } from "@laxdb/ui/lib/utils";
import { useToast } from "@laxdb/ui/hooks/use-toast";
```

### Package Exports

- `@laxdb/ui/components/ui/*` - UI components
- `@laxdb/ui/components/*` - Other components (data-table, etc.)
- `@laxdb/ui/lib/*` - Utilities
- `@laxdb/ui/hooks/*` - React hooks
- `@laxdb/ui/globals.css` - Global styles

### Forms with Field Components

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

- **Radix patterns**: Base UI APIs differ - check component source
- **Direct Tailwind in apps**: Use cn() utility, extend components here
- **Modify generated components blindly**: shadcn generates, but you own the code

## COMMANDS

```bash
bunx --bun shadcn@latest add <component>  # Add new component
bun run typecheck                          # Type check (tsgo --build)
bun run fix                                # Lint + format
```

## NOTES

- **ThemeProvider**: In `components/theme-provider.tsx`
- **Sonner toasts**: Use `components/ui/sonner.tsx`
- **Data tables**: Full TanStack Table integration in `components/data-table/`
- **motion**: Uses motion (framer-motion) for animations
