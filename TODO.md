# TODO

## Infrastructure / Data

- Upgrade Drizzle integration to Effect-native SQLite/D1 bindings once Drizzle offers parity with its current Effect Postgres integration: https://orm.drizzle.team/docs/connect-effect-postgres. Replace our custom `DrizzleService` / `query` wrapper with the official Effect integration and revisit typed SQL error handling at that point.
