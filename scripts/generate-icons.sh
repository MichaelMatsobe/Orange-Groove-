#!/usr/bin/env bash
# Generate 192 and 512 PNG icons (requires ImageMagick `convert`)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public"
mkdir -p "$OUT"

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick 'convert' not found. Install it, or export your own icon-192.png / icon-512.png into public/"
  exit 1
fi

convert -size 192x192 xc:'#f97316' \
  -fill white -draw 'circle 96,96 96,36' \
  -fill '#f97316' -draw 'circle 96,96 96,72' \
  -fill white -draw 'circle 96,96 96,88' \
  "$OUT/icon-192.png"

convert -size 512x512 xc:'#f97316' \
  -fill white -draw 'circle 256,256 256,96' \
  -fill '#f97316' -draw 'circle 256,256 256,192' \
  -fill white -draw 'circle 256,256 256,232' \
  "$OUT/icon-512.png"

echo "Wrote $OUT/icon-192.png and $OUT/icon-512.png"
