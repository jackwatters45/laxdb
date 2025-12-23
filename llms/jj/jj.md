# Jujutsu (jj) Cheatsheet

## The Squash Workflow (Recommended)

This workflow uses an empty working change as a "staging area", squashing changes into a described parent commit. Similar to git's index, but simpler.

### Setup

```bash
# 1. Describe the work you want to do
jj describe -m "feat: add goodbye message"

# 2. Create empty change on top (your "staging area")
jj new

# Now: @ is empty scratch space, parent has your description
```

### Working

```bash
# Make changes to files...
# They appear in @ (your scratch space)

# Move changes from @ into the described parent
jj squash                    # Move all changes to parent
jj squash src/main.rs        # Move specific file
jj squash -i                 # Interactive TUI - select hunks

# After squash, @ is empty again, parent has the changes
```

### Interactive Squash TUI

```bash
jj squash -i
# - Arrow keys to navigate
# - Space to toggle selection
# - f to toggle folding (see individual hunks)
# - c to confirm
```

### Cleanup

```bash
# Discard unwanted changes in @
jj abandon                   # Abandon @, creates fresh empty change
```

---

## Working with Remotes (GitHub)

### Initial Setup

```bash
# Add remote
jj git remote add origin git@github.com:user/repo.git

# Push main branch first time
jj bookmark create main
jj git push -b main --allow-new
```

### Pushing Changes

```bash
# Push existing bookmark
jj git push -b my-feature

# Create bookmark and push in one command
jj git push -c @             # Creates push-<change-id> bookmark automatically
```

### Fetching Updates

```bash
jj git fetch                 # Fetch from origin
jj new trunk                 # Start working ahead of updated trunk
```

### Creating a Pull Request

```bash
# 1. Make your changes on a new commit
jj new trunk -m "feat: my feature"
# ... edit files ...

# 2. Push with auto-created bookmark
jj git push -c @
# Creates bookmark like: push-vmunwxsksqvk

# 3. Open PR on GitHub (branch name shown in output)
gh pr create
```

### Updating a PR After Review

```bash
# Just edit the files - they're already in @
# Or if you need to edit a different commit:
jj edit <rev>

# Push updates (bookmark tracks the change, not commit hash)
jj git push -b push-vmunwxsksqvk
```

### Working with Forks

```bash
# Add your fork
jj git remote add myfork git@github.com:you/repo.git

# Push to fork explicitly
jj git push --remote myfork -b my-feature

# Or configure default push remote in .jj/repo/config.toml:
# [git]
# push = "myfork"
```

---

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
jj git push -c @             # Push current commit as new pr
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

---

## Other Common Workflows

### Amend current change

```bash
# Just edit files - working copy IS the current change
jj describe -m "better message"  # Update message if needed
```

### Interactive split

```bash
jj split                     # Interactively split changes into multiple commits
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

---

## Conflict Handling

jj handles conflicts differently than git - conflicts are stored in commits, so rebases never fail.

### Conflicts don't block you

```bash
# Rebase that creates a conflict
jj rebase -r some-change -d @
# Output: "New conflicts appeared in these commits"

# The rebase succeeded! The commit is just marked as conflicted
jj log   # Shows "conflict" marker on the commit

# You can keep working - fix it when ready
```

### Resolving conflicts

```bash
# Edit the conflicted commit
jj edit <conflicted-rev>

# File will have conflict markers:
# <<<<<<<
# +++++++ (snapshot - one side)
# %%%%%%% (diff - the change being applied)
# >>>>>>>

# Edit the file to resolve, save
# jj automatically detects resolution

# Or use the resolve tool
jj resolve
```

### Auto-propagation

```bash
# If you have: A (conflicted) -> B -> C
# Fixing A automatically rebases B and C
# Conflicts in children may auto-resolve too
```

---

## Useful Revsets

```bash
# Your unpushed work
jj log -r 'mine() & ~remote_bookmarks()'

# Local-only bookmarks (not on any remote)
jj log -r 'bookmarks() & ~remote_bookmarks()'

# All ancestors of @ not on remote
jj log -r 'remote_bookmarks()..@'

# All your commits on any bookmark
jj log -r 'mine() & bookmarks()'
```
