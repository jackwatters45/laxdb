# Jujutsu (jj) Cheatsheet

## Core Concepts

- **Working copy (@)**: Your current uncommitted changes - automatically tracked
- **Commits are immutable**: Changes create new commits, old ones remain in history
- **No staging area**: All changes in working copy are part of the current change
- **Bookmarks**: Like git branches, but just pointers to commits

## Essential Commands

### Status & Log

```bash
jj status                    # Show working copy changes
jj log                       # Show commit history (graph)
jj log -r @                  # Show just current commit
jj diff                      # Show working copy diff
jj diff -r @-                # Diff against parent
```

### Creating Commits

```bash
jj commit -m "message"       # Commit working copy, start new empty change
jj describe -m "message"     # Set message for current change (no new commit)
jj new                       # Start new empty change on top of @
jj new -m "message"          # Start new change with message
```

### Navigating History

```bash
jj edit <rev>                # Move working copy to revision
jj prev                      # Edit parent commit
jj next                      # Edit child commit
```

### Bookmarks (like branches)

```bash
jj bookmark list             # List bookmarks
jj bookmark create <name>    # Create bookmark at @
jj bookmark set <name>       # Move bookmark to @
jj bookmark track <name>@origin  # Track remote bookmark
```

### Git Integration

```bash
jj git fetch                 # Fetch from remotes
jj git push                  # Push current bookmark
jj git push -b <bookmark>    # Push specific bookmark
jj git push --all            # Push all bookmarks
```

### Rewriting History

```bash
jj squash                    # Squash @ into parent
jj squash -r <rev>           # Squash rev into its parent
jj split                     # Split current change interactively
jj abandon <rev>             # Abandon/delete a commit
jj restore --from <rev>      # Restore files from another revision
```

### Revsets (revision specifiers)

```bash
@                            # Current working copy
@-                           # Parent of @
@--                          # Grandparent
main                         # Bookmark named "main"
heads()                      # All head commits
trunk()                      # Main branch (auto-detected)
```

## Common Workflows

### Start work on new feature

```bash
jj new main -m "feat: add feature"
# ... make changes ...
jj commit -m "feat: add feature"
```

### Amend current change

```bash
# Just edit files - working copy IS the current change
jj describe -m "better message"  # Update message if needed
```

### Interactive commit (partial changes)

```bash
jj split                     # Interactively split changes
```

### Rebase onto latest main

```bash
jj git fetch
jj rebase -d main@origin
```

### Squash multiple commits

```bash
jj squash --from <start> --into <target>
```

### Undo last operation

```bash
jj undo                      # Undo last jj command
jj op log                    # View operation history
jj op restore <op-id>        # Restore to specific operation
```

## Colocated Repo (jj + git)

When colocated, both jj and git work on same repo:

- `.git/` is the actual git repo
- `.jj/` stores jj metadata
- Git commits visible in jj, jj changes export to git

```bash
jj git init --colocate       # Init colocated repo
jj git import                # Import git changes into jj
jj git export                # Export jj changes to git
```

## Tips

1. **No need to stage** - all file changes are automatically tracked
2. **Describe often** - use `jj describe` to update current change message
3. **Commits are cheap** - create many small commits, squash later
4. **@ is always dirty** - working copy changes are the "current change"
5. **Use jj log often** - the graph view shows relationships clearly

## Pull Request Workflow

jj doesn't have a "PR" concept itself—PRs are a GitHub/GitLab feature. You create bookmarks and push them, then open a PR via the web UI or `gh` CLI.

### Basic Flow

```bash
# 1. Start from main
jj new main -m "feat: my feature"

# 2. Make changes (they're auto-tracked)
# ... edit files ...

# 3. Create a bookmark (like a branch)
jj bookmark create my-feature

# 4. Push the bookmark
jj git push -b my-feature

# 5. Create PR via GitHub CLI
gh pr create --title "My feature" --body "Description"
```

### Updating a PR (after review feedback)

```bash
# Edit the commit directly (no amend needed - just edit files)
jj edit <rev>        # or just work on @

# Bookmark auto-updates, then force push
jj git push -b my-feature
```

### Stacked PRs (multiple dependent changes)

```bash
# Create chain of commits
jj new main -m "feat: part 1"
# ... work ...
jj new -m "feat: part 2"  
# ... work ...

# Create bookmarks for each
jj bookmark create part-1 -r @-
jj bookmark create part-2 -r @

# Push both
jj git push --all
```

### First Push (new repo with no commits)

```bash
jj describe -m "initial commit"   # Describe current change
jj bookmark create main           # Create main bookmark
jj git push -b main --allow-new   # Push to origin
```
