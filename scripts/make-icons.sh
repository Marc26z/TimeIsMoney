#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found (install librsvg)." >&2
  exit 1
fi

rsvg-convert -w 180 -h 180 icons/icon.svg -o icons/icon-180.png
rsvg-convert -w 192 -h 192 icons/icon.svg -o icons/icon-192.png
rsvg-convert -w 512 -h 512 icons/icon.svg -o icons/icon-512.png
rsvg-convert -w 512 -h 512 icons/icon-maskable.svg -o icons/icon-maskable-512.png
rsvg-convert -w 512 -h 512 icons/icon-mono.svg -o icons/icon-mono-512.png

echo "Generated PNG icons."
