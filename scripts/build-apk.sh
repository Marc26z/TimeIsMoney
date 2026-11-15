#!/usr/bin/env bash
# Wrap the built PWA into a signed Android APK with zapstore/goapk.
# No Android SDK, JDK or Gradle needed — goapk is a self-contained binary.
#
#   go install github.com/zapstore/goapk@latest
#   ./scripts/build-apk.sh
#
# Environment overrides: PACKAGE, NAME, VERSION_CODE, VERSION_NAME, KEYSTORE, OUT.
set -euo pipefail
cd "$(dirname "$0")/.."

PACKAGE="${PACKAGE:-com.marc26z.timeismoney}"
NAME="${NAME:-TimeIsMoney}"
VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="${VERSION_NAME:-0.01}"
KEYSTORE="${KEYSTORE:-keystore.p12}"
OUT="${OUT:-build/TimeIsMoney-${VERSION_NAME}.apk}"

if ! command -v goapk >/dev/null 2>&1; then
  echo "goapk not found. Install it with: go install github.com/zapstore/goapk@latest" >&2
  exit 1
fi

npm run build

# Reuse one keystore for every release so the app updates in place.
if [ ! -f .keystore-password ]; then
  openssl rand -base64 24 > .keystore-password
  chmod 600 .keystore-password
fi
PASS="$(cat .keystore-password)"

if [ ! -f "$KEYSTORE" ]; then
  echo "Generating signing keystore at $KEYSTORE — keep it safe and reuse it for every release."
  KEYSTORE_PASSWORD="$PASS" goapk keygen --cn "TimeIsMoney" "$KEYSTORE"
fi

mkdir -p "$(dirname "$OUT")"
KEYSTORE_PASSWORD="$PASS" goapk build \
  -s dist \
  --package "$PACKAGE" \
  --name "$NAME" \
  --version-code "$VERSION_CODE" \
  --version-name "$VERSION_NAME" \
  --icon icons/icon-512.png \
  --icon-mono icons/icon-mono-512.png \
  --keystore "$KEYSTORE" \
  "$OUT"

echo "Built $OUT"
