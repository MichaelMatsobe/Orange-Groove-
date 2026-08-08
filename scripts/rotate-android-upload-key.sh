#!/usr/bin/env bash
# Generate a NEW Android upload keystore for rotation.
# Does NOT upload to Play Console (manual step) and does NOT write GitHub secrets.
# See docs/SECURITY_SIGNING.md and docs/KEY_ROTATION.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ALIAS="${KEY_ALIAS:-orange-groove}"
OUT_JKS="${1:-orange-groove-upload-$(date +%Y%m%d).jks}"
VALIDITY="${VALIDITY_DAYS:-10000}"

if [[ -f "$OUT_JKS" ]]; then
  echo "error: $OUT_JKS already exists — choose another path"
  exit 1
fi

echo "==> Generating new upload keystore: $OUT_JKS"
echo "    alias=$ALIAS validity=${VALIDITY}d"
echo ""
echo "You will be prompted for store/key passwords and certificate DN."
echo "Save passwords in your password manager before continuing."
echo ""

keytool -genkeypair -v \
  -keystore "$OUT_JKS" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY" \
  -storetype PKCS12

CERT_PEM="${OUT_JKS%.jks}_upload_certificate.pem"
keytool -export -rfc \
  -keystore "$OUT_JKS" \
  -alias "$ALIAS" \
  -file "$CERT_PEM"

echo ""
echo "==> Created:"
echo "    Keystore:     $OUT_JKS"
echo "    Certificate:  $CERT_PEM  (no private key — safe to send to Play for upload-key reset)"
echo ""
echo "Fingerprint (SHA-256):"
keytool -list -v -keystore "$OUT_JKS" -alias "$ALIAS" 2>/dev/null | grep -i "SHA256:" || true
echo ""
echo "Next steps (manual — cannot be fully automated):"
echo "  1. Play Console → App signing → Request upload key reset (if replacing lost/compromised key)"
echo "  2. Upload $CERT_PEM when Google asks for the new upload certificate"
echo "  3. Update local android/key.properties storeFile + passwords"
echo "  4. Update GitHub secrets:"
echo "       bash scripts/keystore-to-base64.sh $OUT_JKS"
echo "       → ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_PASSWORD, ANDROID_KEY_ALIAS"
echo "  5. Build internal-test AAB: npm run android:bundle"
echo "  6. Securely delete OLD keystore copies after Play accepts the new key"
echo "  7. Run: npm run android:verify-signing"
echo ""
echo "Full checklist: docs/KEY_ROTATION.md"
