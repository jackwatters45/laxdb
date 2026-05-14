# Backlog

## Fines app migration

- Merge `packages/fines/src/core/fine/*` into the shared `@laxdb/core` domain model.
- Merge `packages/fines/src/api` endpoints into the main `@laxdb/api` server instead of keeping feature-local routing.
- Reconcile Fines database migrations in `packages/fines/migrations` with `packages/core/migrations` before deploying against shared LaxDB data.

## Auth and organizations

- Decide how Fines should use LaxDB auth instead of the imported Malvern better-auth setup.
- Map imported organization/team membership concepts to LaxDB organizations.
- Add authorization rules for fine templates, fine events, audit pages, and admin actions.
- Plan migration path for existing Fines users, organizations, invitations, and sessions.
