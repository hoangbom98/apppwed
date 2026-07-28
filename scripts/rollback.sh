#!/usr/bin/env bash
# =============================================================================
# scripts/rollback.sh — Rollback LKVIP về commit hoặc tag trước
# Sử dụng:
#   bash scripts/rollback.sh           → rollback 1 commit (HEAD~1)
#   bash scripts/rollback.sh v1.2.3    → rollback về tag cụ thể
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

TARGET="${1:-}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

echo "════════════════════════════════════════════════"
echo "  LKVIP ROLLBACK SCRIPT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"

# ─── Xác định target commit ──────────────────────────────────────────────────
if [ -z "$TARGET" ]; then
  ROLLBACK_REF="HEAD~1"
  echo -e "${YELLOW}Target: rollback 1 commit về HEAD~1${NC}"
else
  ROLLBACK_REF="$TARGET"
  echo -e "${YELLOW}Target: rollback về ${TARGET}${NC}"
fi

CURRENT_COMMIT=$(git rev-parse --short HEAD)
TARGET_COMMIT=$(git rev-parse --short "$ROLLBACK_REF" 2>/dev/null || echo "UNKNOWN")
echo -e "  Current : ${CURRENT_COMMIT}"
echo -e "  Target  : ${TARGET_COMMIT} (${ROLLBACK_REF})"
echo ""

# ─── Xác nhận ────────────────────────────────────────────────────────────────
read -r -p "$(echo -e "${RED}⚠️  Xác nhận rollback? [y/N]: ${NC}")" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Đã hủy rollback."
  exit 0
fi

# ─── Bước 1: Backup trạng thái hiện tại ──────────────────────────────────────
echo ""
echo "📦 Bước 1: Tạo backup trạng thái hiện tại..."
git stash push -m "pre-rollback-${TIMESTAMP}" 2>/dev/null || true
echo -e "${GREEN}✅ Stash lưu tại: pre-rollback-${TIMESTAMP}${NC}"

# ─── Bước 2: Checkout target ─────────────────────────────────────────────────
echo ""
echo "🔀 Bước 2: Checkout ${ROLLBACK_REF}..."
git checkout "$ROLLBACK_REF" -- .
echo -e "${GREEN}✅ Đã checkout files về ${TARGET_COMMIT}${NC}"

# ─── Bước 3: Install dependencies ────────────────────────────────────────────
echo ""
echo "📦 Bước 3: Cài đặt dependencies..."
pnpm install --frozen-lockfile
echo -e "${GREEN}✅ Dependencies OK${NC}"

# ─── Bước 4: Build ───────────────────────────────────────────────────────────
echo ""
echo "🔨 Bước 4: Build..."
if pnpm run build:backend 2>/dev/null; then
  echo -e "${GREEN}✅ Build thành công${NC}"
else
  echo -e "${RED}❌ Build thất bại — rollback bị dừng.${NC}"
  echo -e "${YELLOW}Để undo, chạy: git stash pop${NC}"
  exit 1
fi

# ─── Bước 5: Restart PM2 ─────────────────────────────────────────────────────
echo ""
echo "🔄 Bước 5: Restart PM2..."
pm2 reload lkvip-api --update-env
echo -e "${GREEN}✅ PM2 reloaded${NC}"

# ─── Bước 6: Nginx reload ────────────────────────────────────────────────────
echo ""
echo "🌐 Bước 6: Reload Nginx..."
if nginx -t 2>/dev/null; then
  nginx -s reload
  echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
  echo -e "${YELLOW}⚠️  Nginx config lỗi — bỏ qua reload${NC}"
fi

# ─── Bước 7: Health check ────────────────────────────────────────────────────
echo ""
echo "🏥 Bước 7: Health check (chờ 5 giây)..."
sleep 5
HEALTH=$(curl -sf https://api.tc-gaming.live/health 2>/dev/null || echo "FAILED")
if echo "$HEALTH" | grep -q '"status"'; then
  echo -e "${GREEN}✅ API health OK${NC}"
else
  echo -e "${RED}❌ API health FAIL — kiểm tra: pm2 logs lkvip-api --err${NC}"
fi

# ─── Tổng kết ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ Rollback hoàn tất${NC}"
echo -e "  Từ : ${CURRENT_COMMIT}"
echo -e "  Về  : ${TARGET_COMMIT}"
echo ""
echo "  Để undo rollback này:"
echo -e "  ${YELLOW}git stash pop && pnpm run build:backend && pm2 reload lkvip-api${NC}"
echo "════════════════════════════════════════════════"
