#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/scan-reports"
mkdir -p "$OUTPUT_DIR"

cd "$ROOT_DIR"

echo "== LKVIP codebase scan =="
echo "Output: $OUTPUT_DIR"

if command -v cloc >/dev/null 2>&1; then
  echo "[1/5] cloc"
  cloc apps packages --by-file --json \
    --exclude-dir=node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports \
    > "$OUTPUT_DIR/cloc.json" || true
  cloc apps packages \
    --exclude-dir=node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports \
    > "$OUTPUT_DIR/cloc-summary.txt" || true
else
  echo "[1/5] cloc skipped: command not found"
fi

echo "[2/5] jscpd duplication scan"
pnpm dlx jscpd apps packages \
  --pattern "**/*.{ts,tsx,js,jsx}" \
  --ignore "**/{node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports}/**" \
  --reporters console,json \
  --output "$OUTPUT_DIR/jscpd" \
  > "$OUTPUT_DIR/jscpd-console.txt" 2>&1 || true

echo "[3/5] depcheck"
for pkg in apps/* packages/*; do
  if [[ -f "$pkg/package.json" ]]; then
    name="$(basename "$pkg")"
    pnpm dlx depcheck "$pkg" --json > "$OUTPUT_DIR/depcheck-$name.json" 2>/dev/null || true
  fi
done

echo "[4/5] madge circular imports"
for src in apps/*/src packages/*/src; do
  if [[ -d "$src" ]]; then
    name="$(basename "$(dirname "$src")")"
    pnpm dlx madge --extensions ts,tsx,js,jsx --circular "$src" \
      > "$OUTPUT_DIR/madge-circular-$name.txt" 2>&1 || true
  fi
done

echo "[5/5] shared dependency analysis + bundle sizes"
node scripts/analyze-shared-deps.js > "$OUTPUT_DIR/shared-deps.txt"
du -sh apps/*/dist 2>/dev/null | sort -h > "$OUTPUT_DIR/bundle-size.txt" || true

cat > "$OUTPUT_DIR/README.txt" <<EOF
LKVIP scan reports

Generated files may include:
- cloc.json / cloc-summary.txt
- jscpd-console.txt / jscpd JSON files
- depcheck-*.json
- madge-circular-*.txt
- shared-deps.txt
- bundle-size.txt

Review manually before deleting dependencies or extracting shared code.
EOF

echo "Done: $OUTPUT_DIR"
