#!/usr/bin/env bash
# Build with JS embedded in the app — works on device without Metro.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/ios"
cd "$ROOT"

HOST="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
PORT="${METRO_PORT:-8081}"

# Do NOT set SKIP_BUNDLING — react-native-xcode.sh skips when the var is any non-empty value (even "0").
cat > "$IOS_DIR/.xcode.env.local" <<EOF
export REACT_NATIVE_PACKAGER_HOSTNAME=${HOST:-localhost}
export RCT_METRO_PORT=$PORT
EOF

echo "Building Release with embedded JS (no Metro, no devtools websocket error)..."
npx expo run:ios --configuration Release --device "$@"

# Restore Metro-friendly config for next debug build.
bash "$ROOT/scripts/sync-packager-config.sh"
