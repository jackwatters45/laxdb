# jj-ryu - Stacked PRs for Jujutsu

Tool for pushing bookmark stacks to GitHub/GitLab as chained pull requests.

## Install

```bash
# npm (recommended - includes prebuilt binaries)
npm install -g jj-ryu

# or with npx
npx jj-ryu

# cargo
cargo install jj-ryu
```

Binary name is `ryu`.

**macOS quarantine fix:**

```bash
xattr -d com.apple.quarantine $(which ryu)
```

---

## What it Does

Converts a jj bookmark stack into chained PRs:

```
       [feat-c]
    @  mzpwwxkq Add logout       ──►   PR #3: feat-c → feat-b
    │
       [feat-b]
    ○  yskvutnz Add sessions     ──►   PR #2: feat-b → feat-a
    │
       [feat-a]
    ○  kpqvunts Add auth         ──►   PR #1: feat-a → main
    │
  trunk()
```

Each bookmark becomes a PR targeting the previous bookmark (or trunk).

---

## Quick Start

```bash
# View your bookmark stacks
ryu

# Submit a stack as PRs
ryu submit feat-c

# Preview what would happen
ryu submit feat-c --dry-run

# Sync all stacks
ryu sync
```

---

## Workflow Example

```bash
# Start a feature
jj new main
jj bookmark create feat-auth

# Work on it
jj commit -m "Add user model"

# Stack another change on top
jj bookmark create feat-session
jj commit -m "Add session handling"

# View the stack
ryu

# Submit both as PRs (feat-session → feat-auth → main)
ryu submit feat-session

# Make changes, then update PRs
jj commit -m "Address review feedback"
ryu submit feat-session

# After feat-auth merges, rebase and re-submit
jj rebase -d main
ryu submit feat-session
```

---

## Commands

### Visualize stacks

```bash
ryu
```

Shows all bookmark stacks with status:

- `✓` = synced with remote
- `↑` = needs push
- `@` = working copy

### Submit a stack

```bash
ryu submit <bookmark>
ryu submit feat-c --dry-run     # Preview only
ryu submit feat-c --remote fork # Use different remote
```

Creates/updates PRs for entire stack. Adds navigation comments to each PR showing the full stack.

### Sync all stacks

```bash
ryu sync
ryu sync --dry-run
```

Push all stacks to remote and update PRs.

---

## Authentication

### GitHub

Uses (in order):

1. `gh auth token` (GitHub CLI)
2. `GITHUB_TOKEN` env var
3. `GH_TOKEN` env var

For GitHub Enterprise:

```bash
export GH_HOST=github.mycompany.com
```

### GitLab

Uses (in order):

1. `glab auth token` (GitLab CLI)
2. `GITLAB_TOKEN` env var
3. `GL_TOKEN` env var

For self-hosted:

```bash
export GITLAB_HOST=gitlab.mycompany.com
```

### Test auth

```bash
ryu auth github test
ryu auth gitlab test
```

---

## CLI Reference

```bash
ryu [OPTIONS] [COMMAND]

Commands:
  submit  Submit a bookmark stack as PRs
  sync    Sync all stacks with remote
  auth    Authentication management

Options:
  -p, --path <PATH>  Path to jj repository
  -V, --version      Print version
  -h, --help         Print help
```
