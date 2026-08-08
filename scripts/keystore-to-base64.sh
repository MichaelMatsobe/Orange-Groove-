#!/usr/bin/env bash
# Encode a keystore for GitHub Actions secret ANDROID_KEYSTORE_BASE64.
# Does not modify the repo. Prints base64 to stdout.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <keystore.jks|keystore.keystore>" >&2
  exit 1
fi

KS="$1"
if [[ ! -f "$KS" ]]; then
  echo "error: file not found: $KS" >&2
  exit 1
fi

if base64 -w0 "$KS" 2>/dev/null; then
  echo "" >&2
elif base64 -i "$KS" 2>/dev/null; then
  :
else
  # generic
  base64 < "$KS"
  echo "" >&2
fi

echo "" >&2
echo "Copy the line above into GitHub secret: ANDROID_KEYSTORE_BASE64" >&2
echo "Also set ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_PASSWORD, ANDROID_KEY_ALIAS" >&2
