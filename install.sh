#!/usr/bin/env bash
set -euo pipefail
echo "Installing FRC7 + Ayiti OS (GoV)..."
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js 20+ required" >&2; exit 1; }
npm install
mkdir -p "$HOME/.local/bin"
ln -sf "$(pwd)/apps/cli/src/index.js" "$HOME/.local/bin/frc"
chmod +x apps/cli/src/index.js frc-cli/frc
echo "✅ FRC7 ready — try: frc help | npm run demo:ayiti"
