# jjui - Terminal UI for Jujutsu

A TUI for interacting with Jujutsu version control. Requires jj v0.26+.

## Install

```bash
# Homebrew
brew install jjui

# Go
go install github.com/idursun/jjui/cmd/jjui@latest

# Nix
nix run nixpkgs#jjui

# Windows (winget)
winget install IbrahimDursun.jjui

# Arch Linux
paru -S jjui-bin
```

---

## Quick Start

```bash
jjui                    # Launch UI
jjui -r "trunk()..@"    # Launch with custom revset
```

---

## Key Bindings

### Navigation

| Key       | Action                            |
| --------- | --------------------------------- |
| `j` / `k` | Move down / up                    |
| `@`       | Jump to working copy              |
| `/`       | Quick search                      |
| `'`       | Jump to next match                |
| `L`       | Change revset (with autocomplete) |

### Views

| Key | Action                         |
| --- | ------------------------------ |
| `p` | Toggle preview pane            |
| `l` | Details view (files in commit) |
| `o` | Operation log view             |
| `d` | Show diff                      |
| `v` | Show evolog (evolution log)    |

### Preview Scrolling

| Key      | Action         |
| -------- | -------------- |
| `ctrl+n` | Scroll down    |
| `ctrl+p` | Scroll up      |
| `ctrl+d` | Half page down |
| `ctrl+u` | Half page up   |

### Revision Operations

| Key     | Action                             |
| ------- | ---------------------------------- |
| `n`     | New revision                       |
| `e`     | Edit revision                      |
| `Enter` | Inline describe (edit message)     |
| `D`     | Edit description (external editor) |
| `a`     | Abandon revision                   |
| `A`     | Absorb changes                     |
| `r`     | Rebase mode                        |
| `s`     | Split revision                     |
| `S`     | Squash revisions                   |
| `y`     | Duplicate revision                 |

### Bookmarks & Git

| Key | Action                |
| --- | --------------------- |
| `b` | Bookmark menu         |
| `B` | Set/move bookmark     |
| `g` | Git menu (push/fetch) |

### Undo/Redo

| Key | Action           |
| --- | ---------------- |
| `u` | Undo last change |
| `R` | Redo             |

---

## Details View

Press `l` to enter details view for a revision. Here you can:

| Key | Action                                              |
| --- | --------------------------------------------------- |
| `r` | Restore selected files (`i` for interactive chunks) |
| `s` | Split selected files                                |
| `d` | View diff of highlighted file                       |

---

## Rebase Mode

Press `r` to enter rebase mode:

- Select target revision
- Move revisions, branches, or sources interactively

---

## Operation Log

Press `o` to view operation log:

- Navigate operations
- Press `r` to restore to selected operation

---

## Mouse Support

- Scroll revision list with mouse wheel
- Click to select revisions
- Drag preview divider to resize

---

## Configuration

Config file location: `~/.config/jjui/config.toml`

```toml
[preview]
revision_command = ["show", "--color", "always", "-r", "$change_id"]
oplog_command = ["op", "show", "$operation_id", "--color", "always"]
file_command = ["diff", "--color", "always", "-r", "$change_id", "$file"]
```

See full docs: https://idursun.github.io/jjui/Configuration.html
