# @laxdb/web - TanStack Start Frontend

Main web application. TanStack Router (file-based routing) + React 19 + TanStack Query.

## STRUCTURE

```
src/
├── routes/
│   ├── __root.tsx              # Root layout (ThemeProvider, Toaster)
│   ├── (auth)/                 # Auth routes (login, register, logout)
│   ├── (marketing)/            # Public marketing pages
│   └── _protected/             # Authenticated routes (see ROUTE HIERARCHY)
│       ├── _protected.tsx      # Auth guard layout
│       ├── redirect.tsx        # Post-login redirect logic
│       ├── organization/       # Org creation/join (no org selected)
│       └── $organizationSlug/  # Org-scoped routes (sidebar layout)
├── components/
│   ├── auth/                   # Login/register forms
│   ├── nav/                    # Navigation (switchers, search)
│   ├── sidebar/                # App sidebar, header
│   ├── players/                # Player-specific components
│   ├── organizations/          # Org forms
│   └── layout/                 # Page layout components
├── lib/
│   ├── auth-client.ts          # better-auth client instance
│   ├── middleware.ts           # Auth middleware for server fns
│   ├── seo.ts                  # SEO utilities
│   └── formatters.ts           # Date/string formatters
├── hooks/                      # React hooks
├── query/                      # TanStack Query definitions
└── mutations/                  # Mutation hooks
```

## ROUTE HIERARCHY (CRITICAL)

```
/_protected                     # Auth check → redirect to login if no session
  ├── /organization/create      # Create first org (no org required)
  ├── /organization/join        # Join via invite
  └── /$organizationSlug        # ← Sidebar layout, org context loaded
      ├── /index                # Org dashboard
      ├── /feedback             # Feedback form
      ├── /teams.create         # Create team
      ├── /players/             # Org-level player views
      │   ├── /index            # Player list
      │   ├── /$playerId/       # Player detail
      │   └── -components/      # Route-specific components
      ├── /games/               # Game management
      ├── /settings/            # Org settings (billing, users)
      └── /$teamId/             # ← Team-scoped routes
          ├── /index            # Team dashboard
          ├── /setup            # Team setup wizard
          └── /players/         # Team player views
              ├── /index        # Team player list
              └── /$playerId/   # Team player detail
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add protected route | `src/routes/_protected/$organizationSlug/` |
| Add team route | `src/routes/_protected/$organizationSlug/$teamId/` |
| Route-specific component | `src/routes/.../-components/` (dash prefix) |
| Shared component | `src/components/{category}/` |
| Add query | `src/query/` |
| Add mutation | `src/mutations/` |
| Auth middleware | `src/lib/middleware.ts` |

## FILE-BASED ROUTING

| Pattern | Meaning |
|---------|---------|
| `_protected.tsx` | Layout with auth guard |
| `$param` | Dynamic route segment |
| `(group)/` | Route group (no URL segment) |
| `-components/` | Route-specific components (dash prefix) |
| `index.tsx` | Index route for directory |

## ROUTE COMPONENT PATTERN

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

## SERVER FUNCTIONS & AUTH MIDDLEWARE

**Critical**: All protected server functions use `authMiddleware` from `lib/middleware.ts`.

```tsx
import { authMiddleware } from "@/lib/middleware";
import { RuntimeServer } from "@laxdb/core/runtime.server";

// Define server function with middleware
const getData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])  // ← Validates session, provides context
  .handler(({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const service = yield* MyService;
        // context.session - User session
        // context.headers - Request headers for downstream auth
        return yield* service.getData(context.headers);
      }),
    ),
  );

// Use in loader or beforeLoad
export const Route = createFileRoute("...")({
  loader: () => getData(),
});
```

**Middleware chain**:
1. `authMiddleware` checks session via `AuthService.getSession()`
2. If no session → redirects to `/login?redirectUrl=...`
3. If valid → provides `{ session, headers }` in context

## FORMS

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

| Pattern | Why Bad | Do Instead |
|---------|---------|------------|
| `useState` for server data | Missing cache/sync | TanStack Query |
| Inline fetch calls | No caching/retry | Define in query/ or mutations/ |
| Components in route files | Hard to test | Extract to -components/ |
| Skip route loader | Flash of empty state | Prefetch for better UX |

## NOTES

- **Many TODOs**: Routes have `// TODO: Replace with actual API` placeholders
- **Auth client**: `lib/auth-client.ts` exports better-auth client
- **Theme**: ThemeProvider in __root.tsx, storageKey "laxdb-ui-theme"
- **routeTree.gen.ts**: Auto-generated, don't edit
- **Import alias**: `@/` maps to `src/`
