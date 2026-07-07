#!/usr/bin/env bash
# Single Metro on a fixed port so the iOS debug app always knows where to connect.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"

cd "$ROOT"

bash "$ROOT/scripts/sync-packager-config.sh"

for p in "$PORT" 8082; do
  if lsof -ti ":$p" >/dev/null 2>&1; then
    echo "Stopping stale Metro on port ${p}..."
    lsof -ti ":$p" | xargs kill -9 2>/dev/null || true
  fi
done

sleep 0.5

if xcrun devicectl list devices 2>/dev/null | grep -q "connected"; then
  echo "iPad connected via USB — also enable iPad Wi-Fi on the same network as this Mac."
fi

echo "Starting Metro on port $PORT (LAN)..."
exec npx expo start --lan -c --port "$PORT"
