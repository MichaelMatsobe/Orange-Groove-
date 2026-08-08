#!/usr/bin/env bash
# Verify local signing files exist and are not tracked by git.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ok=0
warn() { echo "WARN: $*"; }
fail() { echo "FAIL: $*"; ok=1; }
pass() { echo "OK: $*"; }

echo "=== Orange Groove signing setup check ==="

if [[ -d android ]]; then
  pass "android/ project present"
else
  warn "android/ missing — run: npx cap add android && npx cap sync"
fi

if [[ -f android/key.properties ]] || [[ -f android/app/key.properties ]]; then
  pass "key.properties found under android/"
  # ensure not tracked
  if git ls-files --error-unmatch android/key.properties &>/dev/null || \
     git ls-files --error-unmatch android/app/key.properties &>/dev/null; then
    fail "key.properties is tracked by git — remove it from the index immediately"
  else
    pass "key.properties is not tracked by git"
  fi
else
  warn "no key.properties — copy scripts/android/key.properties.example after setup-signing"
fi

# any jks in repo root
shopt -s nullglob
for f in *.jks *.keystore; do
  if git check-ignore -q "$f" 2>/dev/null || ! git ls-files --error-unmatch "$f" &>/dev/null; then
    pass "keystore $f present and not tracked"
  else
    fail "keystore $f is tracked by git — REMOVE FROM HISTORY"
  fi
done

if grep -q 'ORANGE_GROOVE_SIGNING\|signing.gradle' android/app/build.gradle 2>/dev/null; then
  pass "Gradle signing apply detected in app/build.gradle"
elif [[ -f android/app/build.gradle ]]; then
  warn "signing.gradle not applied — run: npm run android:setup-signing"
fi

if grep -q '\*\.jks' .gitignore && grep -q 'key.properties' .gitignore; then
  pass ".gitignore covers keystores and key.properties"
else
  fail ".gitignore incomplete for signing artifacts"
fi

echo "=== done ==="
exit "$ok"
