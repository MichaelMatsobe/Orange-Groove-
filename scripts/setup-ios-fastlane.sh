#!/usr/bin/env bash
# Copy Fastlane Match templates into ios/fastlane after `npx cap add ios`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/templates/ios/fastlane"
DEST="$ROOT/ios/fastlane"

if [[ ! -d "$ROOT/ios" ]]; then
  echo "error: ios/ not found. On macOS run:"
  echo "  npm run build && npx cap add ios && npx cap sync ios"
  exit 1
fi

mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
echo "Copied Fastlane templates → ios/fastlane/"
echo ""
echo "Next:"
echo "  1. Create a PRIVATE git repo for Match certs (e.g. orange-groove-certs)"
echo "  2. Set MATCH_GIT_URL to that repo SSH URL"
echo "  3. cd ios && bundle install"
echo "  4. bundle exec fastlane match init   # once"
echo "  5. bundle exec fastlane match appstore"
echo "  6. See docs/FASTLANE_MATCH.md"
