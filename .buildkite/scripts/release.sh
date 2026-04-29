#!/usr/bin/env bash
set -euo pipefail

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN secret is required for release." >&2
  exit 1
fi

repo_slug() {
  local remote
  remote="${BUILDKITE_REPO:-$(git config --get remote.origin.url)}"
  remote="${remote#git@github.com:}"
  remote="${remote#https://github.com/}"
  remote="${remote%.git}"
  printf '%s' "$remote"
}

REPO="${GITHUB_REPOSITORY:-$(repo_slug)}"
OWNER="${REPO%%/*}"
NAME="${REPO#*/}"

latest_tag() {
  git fetch --tags --force --quiet
  git tag -l 'v*' --sort=-v:refname | head -n 1
}

next_tag() {
  local latest="$1"
  local bump="$2"
  local major minor patch

  if [ -z "$latest" ]; then
    case "$bump" in
      major) echo "v1.0.0" ;;
      minor) echo "v0.1.0" ;;
      *) echo "v0.0.1" ;;
    esac
    return
  fi

  major="$(printf '%s' "$latest" | sed 's/^v//' | cut -d. -f1)"
  minor="$(printf '%s' "$latest" | sed 's/^v//' | cut -d. -f2)"
  patch="$(printf '%s' "$latest" | sed 's/^v//' | cut -d. -f3)"

  case "$bump" in
    major) echo "v$((major + 1)).0.0" ;;
    minor) echo "v${major}.$((minor + 1)).0" ;;
    *) echo "v${major}.${minor}.$((patch + 1))" ;;
  esac
}

determine_bump() {
  node <<'NODE'
const owner = process.env.OWNER;
const name = process.env.NAME;
const oid = process.env.BUILDKITE_COMMIT;
const token = process.env.GITHUB_TOKEN;

const query = `
  query AssociatedPullRequests($owner: String!, $name: String!, $oid: GitObjectID!) {
    repository(owner: $owner, name: $name) {
      object(oid: $oid) {
        ... on Commit {
          associatedPullRequests(first: 1) {
            nodes {
              number
              labels(first: 50) {
                nodes { name }
              }
            }
          }
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  },
  body: JSON.stringify({ query, variables: { owner, name, oid } }),
});

if (!response.ok) {
  console.log("patch");
  process.exit(0);
}

const payload = await response.json();
const labels = payload?.data?.repository?.object?.associatedPullRequests?.nodes?.[0]?.labels?.nodes?.map((label) => label.name) ?? [];

if (labels.includes("release:major")) console.log("major");
else if (labels.includes("release:minor")) console.log("minor");
else console.log("patch");
NODE
}

create_release() {
  local tag="$1"
  local body
  local response_file
  local status

  body="$(node -e 'console.log(JSON.stringify({ tag_name: process.argv[1], generate_release_notes: true }))' "$tag")"
  response_file="$(mktemp)"
  status="$(curl -sS \
    -o "$response_file" \
    -w '%{http_code}' \
    -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$OWNER/$NAME/releases" \
    -d "$body")"

  if [ "$status" = "201" ]; then
    echo "Created GitHub release for $tag"
    return 0
  fi

  if [ "$status" = "422" ] && grep -q 'already_exists' "$response_file"; then
    echo "GitHub release for $tag already exists; nothing to do."
    return 0
  fi

  echo "GitHub release creation failed with HTTP $status" >&2
  cat "$response_file" >&2
  exit 1
}

TAG="${BUILDKITE_TAG:-}"

if [ -z "$TAG" ]; then
  if [ "${BUILDKITE_BRANCH:-}" != "main" ]; then
    echo "No tag and not on main; skipping release."
    exit 0
  fi

  export OWNER NAME
  BUMP="$(determine_bump)"
  LATEST="$(latest_tag)"
  TAG="$(next_tag "$LATEST" "$BUMP")"

  echo "Version bump: $BUMP"
  echo "Latest tag: ${LATEST:-none}"
  echo "Next tag: $TAG"

  git config user.name "buildkite[bot]"
  git config user.email "buildkite[bot]@users.noreply.github.com"
  git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/${OWNER}/${NAME}.git"

  if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Tag $TAG already exists locally."
  else
    git tag "$TAG"
  fi

  git push origin "$TAG"
else
  echo "Using pushed tag: $TAG"
fi

create_release "$TAG"
