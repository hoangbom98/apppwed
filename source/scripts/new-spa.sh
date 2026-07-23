#!/usr/bin/env bash
# =============================================================================
#  new-spa.sh — Scaffold a new KJC frontend SPA from the _template
#
#  Usage:
#    bash source/scripts/new-spa.sh <app-name> <project-id> <port>
#
#  Example:
#    bash source/scripts/new-spa.sh loyalty loyalty 5181
#
#  What it does:
#    1. Copies source/frontend/_template/ → source/frontend/<app-name>/
#    2. Replaces __APPNAME__, __PROJECT__, __PORT__ placeholders
#    3. Prints next steps (pnpm-workspace.yaml, nginx, package.json)
# =============================================================================
set -euo pipefail

APPNAME="${1:-}"
PROJECT="${2:-}"
PORT="${3:-}"

if [[ -z "$APPNAME" || -z "$PROJECT" || -z "$PORT" ]]; then
  echo "Usage: bash source/scripts/new-spa.sh <app-name> <project-id> <port>"
  echo ""
  echo "  app-name   — directory name under frontend/ (e.g. loyalty)"
  echo "  project-id — VITE_PROJECT env value, matches backend route prefix (e.g. loyalty)"
  echo "  port       — dev server port (e.g. 5181)"
  exit 1
fi

BASE="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_DIR="$BASE/frontend/_template"
DEST_DIR="$BASE/frontend/$APPNAME"

if [[ -d "$DEST_DIR" ]]; then
  echo "❌  Directory already exists: $DEST_DIR"
  exit 1
fi

if [[ ! -d "$TEMPLATE_DIR" ]]; then
  echo "❌  Template not found at $TEMPLATE_DIR"
  exit 1
fi

echo "🚀  Creating SPA: $APPNAME (project=$PROJECT, port=$PORT)"

# Copy entire template
cp -r "$TEMPLATE_DIR" "$DEST_DIR"

# Replace all placeholder tokens in text files
find "$DEST_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.env*" -o -name "*.css" -o -name "*.js" \) | while read -r file; do
  sed -i "s/__APPNAME__/${APPNAME}/g"  "$file"
  sed -i "s/__PROJECT__/${PROJECT}/g"  "$file"
  sed -i "s/__PORT__/${PORT}/g"        "$file"
done

# Also handle tsconfig.node.json (no sed on binary — text only, already covered above)

echo ""
echo "✅  SPA '$APPNAME' created at $DEST_DIR"
echo ""
echo "Next steps:"
echo "  1.  Add to pnpm-workspace.yaml:"
echo "        - \"frontend/${APPNAME}\""
echo ""
echo "  2.  Add to source/package.json scripts:"
echo "        \"dev:${APPNAME}\":   \"pnpm --filter @kjc/${APPNAME} run dev\","
echo "        \"build:${APPNAME}\": \"pnpm --filter @kjc/${APPNAME} run build\","
echo ""
echo "  3.  Add Nginx server block for ${APPNAME}.yourdomain.com"
echo "      (copy any existing SPA block in source/nginx/nginx.conf and adapt)."
echo ""
echo "  4.  Install deps and start dev server:"
echo "        cd $DEST_DIR && npm install"
echo "        # or from root:"
echo "        pnpm install && pnpm run dev:${APPNAME}"
echo ""
echo "  5.  (Optional) Create .env from .env.example:"
echo "        cp $DEST_DIR/.env.example $DEST_DIR/.env"
