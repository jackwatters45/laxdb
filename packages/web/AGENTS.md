# @laxdb/web - TanStack Start Frontend

Main web application. TanStack Router (file-based routing) + React 19 + TanStack Query.

## STRUCTURE

```
src/
├── routes/
│   ├── __root.tsx              # Root layout (ThemeProvider, Toaster)
│   ├── (auth)/                 # Auth routes (login, register, logout)
│   ├── (marketing)/            # Public marketing pages
│   └── _protected/             # Authenticated routes
│       ├── $organizationSlug/  # Org-scoped routes
│       │   ├── $teamId/        # Team-scoped routes
│       │   │   └── players/    # Player management
│       │   ├── players/        # Org-level players
│       │   ├── games/          # Game management
│       │   └── settings/       # Org settings
│       └── organization/       # Org creation/join
├── components/
│   ├── auth/                   # Login/register forms
│   ├── nav/                    # Navigation (switchers, search)
│   ├── sidebar/                # App sidebar, header
│   ├── players/                # Player-specific components
│   ├── organizations/          # Org forms
│   └── layout/                 # Page layout components
├── lib/                        # Utilities, auth client, seo
├── hooks/                      # React hooks
├── query/                      # TanStack Query definitions
└── mutations/                  # Mutation hooks
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add protected route | `src/routes/_protected/$organizationSlug/` |
| Add team route | `src/routes/_protected/$organizationSlug/$teamId/` |
| Route-specific component | `src/routes/.../−components/` (dash prefix) |
| Shared component | `src/components/{category}/` |
| Add query | `src/query/` |
| Add mutation | `src/mutations/` |

## CONVENTIONS

### File-Based Routing

- `_protected.tsx` - Layout with auth guard
- `$param` - Dynamic route segment
- `(group)/` - Route group (no URL segment)
- `-components/` - Route-specific components (dash prefix)
- `index.tsx` - Index route for directory

### Route Component Pattern

```tsx
export const Route = createFileRoute("/_protected/$organizationSlug/players/")({
  component: PlayersPage,
  loader: async ({ context }) => {
    // Prefetch data
    await context.queryClient.ensureQueryData(playersQueryOptions);
  },
});

function PlayersPage() {
  const { organizationSlug } = Route.useParams();
  const { data } = useSuspenseQuery(playersQueryOptions);
  return <div>...</div>;
}
```

### Import Aliases

- `@/` - src/ directory
- `@laxdb/ui/...` - UI package

### Forms

Use react-hook-form with @laxdb/ui Field components:

```tsx
<Controller
  name="fieldName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel>Label</FieldLabel>
      <Input {...field} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

## ANTI-PATTERNS

- **useState for server data**: Use TanStack Query
- **Inline fetch calls**: Define in query/ or mutations/
- **Components in route files**: Extract to -components/
- **Skip route loader**: Prefetch for better UX

## NOTES

- **Many TODOs**: Routes have `// TODO: Replace with actual API` placeholders
- **Auth**: better-auth client in `lib/auth.ts`
- **Theme**: ThemeProvider in __root.tsx, storageKey "laxdb-ui-theme"
- **routeTree.gen.ts**: Auto-generated, don't edit
