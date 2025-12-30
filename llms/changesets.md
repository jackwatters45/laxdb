# Changesets Guide

Changesets is a tool for managing versioning and changelogs in monorepos. It helps track what changes have been made, what version bump they require, and generates changelogs automatically.

## Core Concept

A **changeset** is a markdown file that describes:
1. Which packages are affected by a change
2. What type of version bump is needed (patch/minor/major)
3. A human-readable summary of the change

Changesets are created during development and consumed during release.

## Quick Reference

| Command | Description |
|---------|-------------|
| `bun changeset` | Create a new changeset |
| `bun changeset status` | See pending changesets |
| `bun version` | Apply changesets (bump versions, update changelogs) |
| `bun release` | Publish packages to npm |

## Workflow

### 1. Making Changes

When you make a change that should be tracked (new feature, bug fix, breaking change), create a changeset:

```bash
bun changeset
```

This interactive CLI will ask:
1. **Which packages changed?** - Select from the list of packages
2. **What type of bump?** - Choose major/minor/patch based on semver
3. **Summary** - Write a description of the change

A markdown file is created in `.changeset/` with a random name like `funny-dogs-dance.md`:

```markdown
---
"@laxdb/core": minor
"@laxdb/api": patch
---

Added new player statistics tracking feature
```

### 2. Commit the Changeset

Commit the changeset file along with your code changes:

```bash
git add .changeset/funny-dogs-dance.md
git commit -m "feat: add player statistics tracking"
```

### 3. Release (When Ready)

When you're ready to release, run:

```bash
bun version
```

This will:
- Read all pending changesets
- Calculate the appropriate version bump for each package
- Update `package.json` versions
- Generate/update `CHANGELOG.md` files
- Delete the consumed changeset files

Review the changes, then commit:

```bash
git add .
git commit -m "chore: version packages"
```

### 4. Publish (Optional)

If publishing to npm:

```bash
bun release
```

## Semver Primer

| Bump | When to Use | Example |
|------|-------------|---------|
| **patch** | Bug fixes, internal changes | `1.0.0` -> `1.0.1` |
| **minor** | New features (backwards compatible) | `1.0.0` -> `1.1.0` |
| **major** | Breaking changes | `1.0.0` -> `2.0.0` |

## When to Create a Changeset

**DO create a changeset for:**
- New features
- Bug fixes
- Breaking changes
- Dependency updates that affect behavior
- Performance improvements

**DON'T create a changeset for:**
- Documentation-only changes
- Test-only changes
- Refactoring with no behavior change
- CI/tooling changes

## Multiple Changesets

You can have multiple changesets for a single PR. This is useful when:
- A PR contains multiple distinct changes
- Different packages need different bump types

Each changeset becomes a separate entry in the changelog.

## Configuration

The config lives in `.changeset/config.json`:

```json
{
  "changelog": ["@changesets/changelog-github", { "repo": "jackwatters45/laxdb" }],
  "commit": false,
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": {
    "version": true,
    "tag": false
  }
}
```

Key settings:
- `changelog: ["@changesets/changelog-github", ...]` - Enhanced changelogs with PR links and GitHub usernames
- `access: "restricted"` - Packages are not published publicly
- `updateInternalDependencies: "patch"` - When a package is bumped, dependents get a patch bump
- `privatePackages.version: true` - Private packages still get version bumps

## Tips

### Check Status Before PR

```bash
bun changeset status
```

Shows what packages will be bumped and by how much.

### Empty Changeset

If your PR doesn't need a changeset but CI requires one:

```bash
bun changeset --empty
```

Creates an empty changeset that won't bump any versions.

### Pre-release Versions

For alpha/beta releases:

```bash
bun changeset pre enter alpha
bun version
# Creates versions like 1.0.0-alpha.0
```

Exit pre-release mode:

```bash
bun changeset pre exit
```

## CI Integration

### Changeset Bot

Install the [Changeset Bot](https://github.com/apps/changeset-bot) to automatically comment on PRs missing changesets.

### GitHub Action

Use the [changesets/action](https://github.com/changesets/action) to:
- Automatically create "Version Packages" PRs
- Auto-publish when version PRs are merged

Example workflow (`.github/workflows/release.yml`):

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for changelog GitHub integration
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      
      - uses: changesets/action@v1
        with:
          version: bun run version
          publish: bun run release
          commit: "chore: version packages"
          title: "chore: version packages"
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## AI-Powered Changeset Generation

You can automatically generate changesets using AI by adding the `generate-changeset` label to a PR.

**How it works:**
1. Add the `generate-changeset` label to any PR
2. Claude Code analyzes the diff and determines affected packages
3. It creates and commits a changeset file to your PR branch
4. The label is automatically removed
5. Claude comments on the PR confirming completion

**Setup required:**
- Uses `CLAUDE_CODE_OAUTH_TOKEN` (same as other Claude workflows)

### Creating the Label

The `generate-changeset` label must exist in your repository:

1. Go to **github.com/jackwatters45/laxdb/labels**
2. Click **New label**
3. Name: `generate-changeset`
4. Description: `Trigger AI changeset generation`
5. Color: `#7C3AED` (purple, optional)
6. Click **Create label**

### Using the Label

**Option 1: From the PR page**
1. Open any pull request
2. In the right sidebar, click **Labels**
3. Select `generate-changeset`

**Option 2: Using GitHub CLI**
```bash
gh pr edit <PR_NUMBER> --add-label "generate-changeset"
```

**Option 3: From PR comment**
```
/label generate-changeset
```

### When to use

- Quick changesets for straightforward changes
- When you're unsure about the right semver bump
- To save time on routine PRs
- Dependabot/Renovate PRs that need changesets

### Important Notes

- Always review the generated changeset - AI may misjudge the bump type
- For complex PRs with multiple distinct changes, create changesets manually
- The workflow uses the same `CLAUDE_CODE_OAUTH_TOKEN` as code review

## Further Reading

- [Changesets Documentation](https://github.com/changesets/changesets/tree/main/docs)
- [Adding a Changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- [Config Options](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md)
