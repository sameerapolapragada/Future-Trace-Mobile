#!/usr/bin/env bash
# Tunnel Metro through ngrok — works when iPad and Mac are on different networks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"

cd "$ROOT"

for p in "$PORT" 8082; do
  if lsof -ti ":$p" >/dev/null 2>&1; then
    echo "Stopping stale Metro on port ${p}..."
    lsof -ti ":$p" | xargs kill -9 2>/dev/null || true
  fi
done

sleep 0.5

echo "Starting Metro with tunnel..."
exec npx expo start --tunnel -c --port "$PORT"
