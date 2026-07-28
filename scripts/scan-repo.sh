#!/usr/bin/env bash
# =============================================================================
# scan-repo.sh — Phân tích toàn diện codebase LKVIP GROUP
#
# Chạy 5 công cụ phân tích và lưu kết quả vào scan-reports/:
#   1. cloc       — đếm dòng code theo ngôn ngữ
#   2. jscpd      — phát hiện code trùng lặp (copy-paste detection)
#   3. depcheck   — kiểm tra dependency thừa/thiếu
#   4. madge      — phát hiện circular import
#   5. analyze-shared-deps — phân tích dependency dùng chung
#
# Usage:
#   bash scripts/scan-repo.sh
#
# Output: scan-reports/  (không được commit vào git)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/scan-reports"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[scan]${NC} $*"; }
warn()  { echo -e "${YELLOW}[scan]${NC} $*"; }
error() { echo -e "${RED}[scan]${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

mkdir -p "$OUTPUT_DIR"
cd "$ROOT_DIR"

echo ""
info "LKVIP codebase scan — $(date '+%Y-%m-%d %H:%M:%S')"
info "Output: $OUTPUT_DIR"

EXCLUDE_DIRS="node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports"

# ── [1/5] cloc ────────────────────────────────────────────────────────────────
step "1/5: cloc — Lines of code"

if command -v cloc >/dev/null 2>&1; then
  cloc apps packages --by-file --json \
    --exclude-dir="$EXCLUDE_DIRS" \
    > "$OUTPUT_DIR/cloc.json" 2>/dev/null || true
  cloc apps packages \
    --exclude-dir="$EXCLUDE_DIRS" \
    > "$OUTPUT_DIR/cloc-summary.txt" 2>/dev/null || true
  info "cloc → $OUTPUT_DIR/cloc.json"
else
  warn "cloc không có — bỏ qua. Cài đặt: sudo apt-get install cloc"
fi

# ── [2/5] jscpd ───────────────────────────────────────────────────────────────
step "2/5: jscpd — Code duplication"

pnpm dlx jscpd apps packages \
  --pattern "**/*.{ts,tsx,js,jsx}" \
  --ignore "**/{node_modules,dist,.turbo,.pnpm-store,.claude,coverage,scan-reports}/**" \
  --reporters console,json \
  --output "$OUTPUT_DIR/jscpd" \
  > "$OUTPUT_DIR/jscpd-console.txt" 2>&1 || true
info "jscpd → $OUTPUT_DIR/jscpd-console.txt"

# ── [3/5] depcheck ────────────────────────────────────────────────────────────
step "3/5: depcheck — Dependency audit"

for pkg in apps/* packages/*; do
  if [[ -f "$pkg/package.json" ]]; then
    name="$(basename "$pkg")"
    pnpm dlx depcheck "$pkg" --json > "$OUTPUT_DIR/depcheck-${name}.json" 2>/dev/null || true
    info "depcheck → $name"
  fi
done

# ── [4/5] madge ───────────────────────────────────────────────────────────────
step "4/5: madge — Circular imports"

for src in apps/*/src packages/*/src; do
  if [[ -d "$src" ]]; then
    name="$(basename "$(dirname "$src")")"
    pnpm dlx madge --extensions ts,tsx,js,jsx --circular "$src" \
      > "$OUTPUT_DIR/madge-circular-${name}.txt" 2>&1 || true
    info "madge → $name"
  fi
done

# ── [5/5] shared deps + bundle sizes ─────────────────────────────────────────
step "5/5: Shared deps + bundle sizes"

node "$SCRIPT_DIR/analyze-shared-deps.js" > "$OUTPUT_DIR/shared-deps.txt" 2>/dev/null || true
info "shared-deps → $OUTPUT_DIR/shared-deps.txt"

du -sh apps/*/dist 2>/dev/null | sort -h > "$OUTPUT_DIR/bundle-size.txt" || true
info "bundle-size → $OUTPUT_DIR/bundle-size.txt"

# ── README ────────────────────────────────────────────────────────────────────
cat > "$OUTPUT_DIR/README.txt" <<EOF
LKVIP scan reports — $(date '+%Y-%m-%d %H:%M:%S')

Generated files:
  cloc.json / cloc-summary.txt   — Lines of code by language
  jscpd-console.txt / jscpd/    — Code duplication report
  depcheck-*.json                — Unused/missing dependencies per package
  madge-circular-*.txt           — Circular import chains per app
  shared-deps.txt                — Dependencies shared across 3+ packages
  bundle-size.txt                — dist/ folder sizes after build

NOTE: Review manually before removing dependencies or extracting shared code.
EOF

echo ""
info "✅ Scan hoàn tất → $OUTPUT_DIR"
info "Tổng file tạo ra: $(find "$OUTPUT_DIR" -type f | wc -l)"
