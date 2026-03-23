# @laxdb/ui - Shared UI Components

> **When to read:** Shared components. CRITICAL: Base UI, not Radix - APIs differ.

shadcn/ui components built on **Base UI** (NOT Radix). Shared across web, marketing, docs.

## CRITICAL: Base UI vs Radix

This package uses **Base UI**, not Radix. APIs differ significantly. Check component source when unsure.

| Pattern            | Radix                             | Base UI (This Project)                           |
| ------------------ | --------------------------------- | ------------------------------------------------ |
| Select placeholder | `<SelectValue placeholder="...">` | `<SelectValue>{(v) => v ?? "..."}</SelectValue>` |
| Dialog trigger     | Implicit via context              | Often explicit `open` prop                       |
| Checkbox state     | `checked={bool}`                  | `checked={bool}` (same)                          |

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
/>;
```

## ANTI-PATTERNS

| Pattern                 | Why Bad       | Do Instead                          |
| ----------------------- | ------------- | ----------------------------------- |
| Radix API patterns      | APIs differ   | Check component source              |
| Direct Tailwind in apps | Inconsistent  | Use cn() utility, extend components |
| Copy-paste components   | Loses updates | Import from @laxdb/ui               |

## NOTES

- **motion**: Uses motion (framer-motion) for animations
- **shadcn ownership**: Components are generated but you own them - modify freely
- **Tailwind v4**: Some packages use v4 beta with different syntax
