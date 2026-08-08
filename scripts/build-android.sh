#!/usr/bin/env bash
# Build web assets, sync Capacitor, assemble debug or release APK/AAB.
# Usage: scripts/build-android.sh [debug|release|bundle]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-debug}"
cd "$ROOT"

echo "==> npm ci / install"
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi

echo "==> vite build"
npm run build

if [[ ! -d android ]]; then
  echo "==> cap add android"
  npx cap add android
fi

echo "==> cap sync android"
npx cap sync android

if [[ ! -f android/app/build.gradle ]] && [[ ! -f android/app/build.gradle.kts ]]; then
  echo "error: android project incomplete"
  exit 1
fi

# Wire signing if release/bundle and script not yet applied
if [[ "$MODE" == "release" || "$MODE" == "bundle" ]]; then
  bash "$ROOT/scripts/setup-android-signing.sh" || true
fi

cd android
chmod +x gradlew 2>/dev/null || true

case "$MODE" in
  debug)
    echo "==> assembleDebug"
    ./gradlew assembleDebug --no-daemon
    echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
    ;;
  release)
    echo "==> assembleRelease"
    ./gradlew assembleRelease --no-daemon
    echo "APK: android/app/build/outputs/apk/release/app-release.apk"
    ;;
  bundle)
    echo "==> bundleRelease"
    ./gradlew bundleRelease --no-daemon
    echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
    ;;
  *)
    echo "usage: $0 [debug|release|bundle]"
    exit 1
    ;;
esac
