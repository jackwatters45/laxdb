# Lax DB - Roadmap

## Overview

Lax DB equips lacrosse players with modern tools to enhance game performance. Comprehensive suite for players, coaches, and teams to optimize gameplay, improve communication, and streamline admin.

---

## Immediate TODO

- [ ] Individual player page
- [ ] Move player individual pages away from teams
- [ ] Root players page with team filter
- [ ] Add fields - position etc when no field set for team
- [ ] Games
- [ ] Coaches
- [ ] Teams page
- [ ] Org + team invites/joins
- [ ] Sidebar subpages/dropdown

### Pipeline

- [ ] Historical vs real time extraction
- [ ] Game events -> structured data

### Marketing

- [ ] Update marketing page
- [ ] Blog styling
- [ ] Tool plans

### Infrastructure

- [ ] Fix http api
- [ ] Build script (turbo not really working)
- [ ] Tests
- [ ] Contributing docs site
- [ ] Consolidate ui components

---

## Current Status

### In Progress

- **Team Management**: Team creation, roster management, coaching staff organization
- **Organization Management**: Multi-team organization structure and administration
- **Player Management**: Individual player profiles, development tracking, goal setting
- **Game Management System**: Game scheduling, roster management, and game tracking

### Completed

- [x] Database Layer: Drizzle ORM with PlanetScale PostgreSQL
- [x] Authentication: Better Auth with Google OAuth
- [x] Frontend: TanStack Start with React 19
- [x] Styling: Tailwind CSS with custom design system
- [x] Infrastructure: Cloudflare Workers via Alchemy
- [x] Org switcher

---

## Planned Features

### Ready for Development

Feature specs available in `plans/features/`:

- **Playbook Management**: Digital playbook with play creation, categorization, assignments
- **Scouting System**: Opponent team analysis, scouting reports, strategic insights
- **Practice Planning**: Drill bank, practice templates, session management, scheduling
- **Game Film Integration**: Upload/link game footage with timestamped events
- **Advanced Statistics**: Shot charts, possession analytics, player performance metrics
- **Game Reports**: Automated post-game analysis and player evaluations
- **Calendar System**: Unified calendar for practices, games, team events

### Future

- Whiteboard for play drawing
- AI Film Analysis
- Learning Management (rules, tutorials, quizzes)
- Recruitment Tools (highlights, recruiting profiles)
- Mobile App (Expo)

### Small Features

- Export table contents to CSV/Excel
- Table views
- Table column/row dragging
- Table column resizing

---

## Technical Debt

- [ ] Email sending: `sendInvitationEmail` in auth.ts is stubbed
- [ ] Polar integration: Payment webhook handlers are commented out
- [ ] KV Rate Limiting: Wire up `KVService` for better-auth rate limiting/session caching
  - TODO in `packages/core/src/auth.ts`
  - `packages/core/src/kv.ts` ready, needs KVNamespace injection

---

## Infrastructure

### Current Stack

- Cloudflare Workers (compute)
- PlanetScale PostgreSQL + Hyperdrive (database)
- Cloudflare KV (available)
- Cloudflare R2 (storage - available)
- Better Auth with Google OAuth
- Polar.sh for payments

### Potential Additions

- [ ] LiveStore / Zero sync engine for real-time updates
- [ ] Structured logging
- [ ] Error tracking (Sentry or similar)

---

## Considerations

- **Rate limiting**: Currently disabled. Security gap for production.
- **Testing strategy**: Vitest is set up but no defined coverage goals.
- **effect-cloudflare package**: Has type errors. Being used? Dead code?
- **Observability**: No logging/monitoring story.
- **Permissions**: How to handle teamId + org in core repo

---

## Notes

- Take a closer look at AGENTS.md files
- Blog some of the specific/unique technical challenges (http + rpc)
