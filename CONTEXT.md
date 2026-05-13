# laxdb Domain Context

## Practice planning

- **Practice** — a planned lacrosse training session with date, location, duration, status, notes, and coaching intent.
- **Practice item** — one persisted block inside a Practice, such as a warmup, drill, cooldown, water break, or activity. Practice items carry ordering, position, group, priority, and optional drill linkage.
- **Practice edge** — a persisted flow connection between two Practice items. Practice edges describe the canvas topology for a Practice.
- **Practice aggregate** — a Practice with its full set of Practice items and Practice edges, loaded or saved as one planning unit. A Practice aggregate save represents the desired final item set and graph topology for the Practice.

## Data pipeline

- **Extraction command** — a league-specific CLI entry point that loads extraction status, chooses an extraction mode, runs one season or all seasons, and optionally emits JSON for automation.
- **Extraction manifest** — the persisted status record for extracted league seasons and entities. Extraction commands read it for `--status` and update it as entities complete.
