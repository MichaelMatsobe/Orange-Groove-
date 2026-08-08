#!/usr/bin/env bash
# Wire automated release signing into a Capacitor android/ project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
APP_GRADLE="$ANDROID_DIR/app/build.gradle"
# Capacitor 7 may use build.gradle.kts
APP_GRADLE_KTS="$ANDROID_DIR/app/build.gradle.kts"
MARKER="// ORANGE_GROOVE_SIGNING"

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "error: android/ not found. Run: npx cap add android && npx cap sync"
  exit 1
fi

# Place example key.properties if missing
if [[ ! -f "$ANDROID_DIR/key.properties" && ! -f "$ANDROID_DIR/app/key.properties" ]]; then
  cp "$ROOT/scripts/android/key.properties.example" "$ANDROID_DIR/key.properties"
  echo "Created android/key.properties from example — edit passwords and storeFile."
fi

if [[ -f "$APP_GRADLE" ]]; then
  if grep -q "ORANGE_GROOVE_SIGNING" "$APP_GRADLE"; then
    echo "Signing already wired in app/build.gradle"
  else
    # Prefer apply from file so we don't break existing android {} blocks
    {
      echo ""
      echo "$MARKER"
      echo "apply from: \"../../scripts/android/signing.gradle\""
    } >> "$APP_GRADLE"
    # Capacitor projects live at android/app — path to repo scripts is ../../scripts from app/
    # But signing.gradle uses rootProject.file which is android/ — good for key.properties
    # apply from path: from android/app, scripts are at ../../scripts/android/signing.gradle
    echo "Appended signing apply to android/app/build.gradle"
  fi

  # Fix apply path: from android/app/build.gradle, repo root is ../..
  # scripts/android/signing.gradle → ../../scripts/android/signing.gradle
  sed -i.bak 's|apply from: ".*signing.gradle"|apply from: "../../scripts/android/signing.gradle"|' "$APP_GRADLE" 2>/dev/null || \
  sed -i '' 's|apply from: ".*signing.gradle"|apply from: "../../scripts/android/signing.gradle"|' "$APP_GRADLE" 2>/dev/null || true
  rm -f "$APP_GRADLE.bak"

elif [[ -f "$APP_GRADLE_KTS" ]]; then
  echo "warning: Kotlin DSL build.gradle.kts detected."
  echo "Add signing manually — see BUILD_APK.md section 'Kotlin DSL'."
  echo "Template properties: scripts/android/key.properties.example"
else
  echo "error: could not find android/app/build.gradle"
  exit 1
fi

echo ""
echo "Next:"
echo "  1. Edit android/key.properties (storePassword, keyPassword, storeFile)"
echo "  2. Place your .jks next to android/ or update storeFile path"
echo "  3. cd android && ./gradlew assembleRelease"
echo "     or: npm run android:release"
