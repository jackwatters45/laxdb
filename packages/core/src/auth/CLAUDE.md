# Auth Subsystem

better-auth integration with organization/team multi-tenancy and role-based access control.

## ARCHITECTURE

```
AuthService (auth.ts)
   ├── better-auth instance (session, OAuth, email/password)
   ├── Polar subscription (checkout, webhooks)
   └── Organization plugin (roles, teams, invitations)
```

**Key invariant**: Session always carries `activeOrganizationId` and `activeTeamId`. New sessions auto-populate from last used org.

## FILES

| File | Purpose |
|------|---------|
| `auth.schema.ts` | Effect Schema for Session, Account, Verification |
| `auth.sql.ts` | Drizzle tables (session, account, verification) |
| `auth.permissions.ts` | Access control roles (headCoach, coach, etc.) |
| `auth.error.ts` | Auth-specific errors |
| `auth.contract.ts` | RPC contracts |
| `../auth.ts` | AuthService factory + exported `auth` instance |

## ROLES (CRITICAL)

Defined in `auth.permissions.ts`. Athletic club hierarchy:

| Role | Permissions | Notes |
|------|-------------|-------|
| `headCoach` | Full control | Creator role, can delete org |
| `coach` | Admin-like | Manage teams/players, no org delete |
| `assistantCoach` | Limited | Read/update rosters, no create/delete |
| `player` | View only | Read schedules, stats, rosters |
| `parent` | View only | Same as player |

**Permission domains**: `roster`, `player`, `schedule`, `stats`, `practice`, `game`

## ENTRY POINTS

```typescript
// Get current session
const session = yield* authService.getSession(headers);
const org = yield* authService.getActiveOrganization(headers);

// OrThrow variants throw if null
const session = yield* authService.getSessionOrThrow(headers);
```

## INVARIANTS

1. **Session org population**: Database hook auto-sets `activeOrganizationId` on new sessions from last used org
2. **Polar integration**: Customer created on signup, synced via webhooks
3. **Multi-tenant hierarchy**: Organization → Teams → Players. Users are members of orgs, can be on multiple teams.

## ORGANIZATION/TEAM RELATIONSHIP

```
User ←→ Member ←→ Organization
              ↓
            Team ←→ TeamMember ←→ User
```

**Tables** (all managed by better-auth organization plugin):
- `organization` - Clubs/orgs
- `member` - User ↔ Org membership with role
- `invitation` - Pending invites
- `team` - Teams within org (better-auth teams plugin)
- `teamMember` - User ↔ Team membership

**Key behavior**: Session tracks `activeOrganizationId` AND `activeTeamId` for context

## ANTI-PATTERNS

- **Skip auth checks**: Every protected endpoint needs session validation
- **Direct role checks**: Use permission system via `ac` (access control)
- **Custom session logic**: Use better-auth hooks, not manual queries

## RELATED

- `../organization/` - Organization CRUD
- `../team/` - Team management
- `../../api/src/auth/` - API layer auth handlers
- `llms/better-auth.txt` - better-auth reference docs
