#!/usr/bin/env bash
# One command: USB port-forward + Metro + install on connected iPad.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"

cd "$ROOT"

bash "$ROOT/scripts/sync-packager-config.sh"

# Stop stale processes
for p in "$PORT" 8082; do
  lsof -ti ":$p" 2>/dev/null | xargs kill -9 2>/dev/null || true
done
pkill -f "iproxy ${PORT}" 2>/dev/null || true

sleep 0.5

# USB → Mac Metro (works even if iPad Wi-Fi is off)
if xcrun devicectl list devices 2>/dev/null | grep -q "connected"; then
  if command -v iproxy >/dev/null 2>&1; then
    iproxy "${PORT}" "${PORT}" >/tmp/iproxy.log 2>&1 &
    echo "USB iproxy: iPad localhost:${PORT} → Mac:${PORT}"
  fi
fi

echo "Starting Metro on port ${PORT}…"
npx expo start --tunnel -c --port "$PORT" >/tmp/expo-metro.log 2>&1 &
METRO_PID=$!

cleanup() {
  kill "$METRO_PID" 2>/dev/null || true
  pkill -f "iproxy ${PORT}" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for Metro
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
    echo "Metro ready."
    break
  fi
  sleep 1
done

echo "Building and installing on iPad…"
npx expo run:ios --device

echo ""
echo "App installed. Metro logs: /tmp/expo-metro.log"
echo "Keep this terminal open while testing. Press Ctrl+C to stop Metro."

wait "$METRO_PID"
