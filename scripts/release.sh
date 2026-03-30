#!/bin/bash
# Usage: ./scripts/release.sh <patch|minor|major>
# Creates a release branch and PR with auto-generated changelog from merged PR bodies.
set -euo pipefail

BUMP_TYPE=${1:?Usage: release.sh <patch|minor|major>}

# Ensure we're on main and up to date
git checkout main
git pull

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Bump version in package.json (no commit, no tag)
npm version "$BUMP_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")

# Collect release notes from merged PRs since last tag
NOTES=""
if [ -n "$LAST_TAG" ]; then
  PR_NUMBERS=$(git log "${LAST_TAG}..HEAD" --merges --pretty=format:"%s" | grep -oP '#\d+' | tr -d '#' | sort -u)
else
  PR_NUMBERS=$(git log --merges --pretty=format:"%s" | grep -oP '#\d+' | tr -d '#' | sort -u)
fi

for PR in $PR_NUMBERS; do
  BODY=$(gh pr view "$PR" --json body --jq '.body' 2>/dev/null || echo "")
  PR_NOTES=$(echo "$BODY" | sed -n '/^## Release Notes$/,/^## /p' | head -n -1 | tail -n +2)
  if [ -n "$PR_NOTES" ]; then
    NOTES="${NOTES}${PR_NOTES}"$'\n'
  fi
done

# Update CHANGELOG.md
DATE=$(date +%Y-%m-%d)
NEW_SECTION="## [${NEW_VERSION}] - ${DATE}"$'\n\n'"${NOTES}"

if [ -f CHANGELOG.md ]; then
  # Insert new version section after the "# Changelog" header line
  TMP=$(mktemp)
  awk -v section="$NEW_SECTION" '
    /^# Changelog$/ { print; print ""; print section; next }
    { print }
  ' CHANGELOG.md > "$TMP"
  mv "$TMP" CHANGELOG.md
else
  printf "# Changelog\n\n%s\n" "$NEW_SECTION" > CHANGELOG.md
fi

# Create release branch and PR
BRANCH="release/v${NEW_VERSION}"
git checkout -b "$BRANCH"
git add package.json CHANGELOG.md
git commit -m "release: v${NEW_VERSION}"
git push -u origin "$BRANCH"

PR_BODY=$(cat <<EOF
## Changelog

${NOTES}

---
Merging this PR will create tag \`v${NEW_VERSION}\`, publish a GitHub release, and deploy to Netlify.
EOF
)

gh pr create \
  --title "Release v${NEW_VERSION}" \
  --body "$PR_BODY"

echo "Release PR created for v${NEW_VERSION}"
