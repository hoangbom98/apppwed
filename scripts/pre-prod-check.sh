#!/usr/bin/env bash
# =============================================================================
# scripts/pre-prod-check.sh — Kiểm tra trước khi deploy lên production
# Sử dụng: bash scripts/pre-prod-check.sh
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

ok()   { echo -e "${GREEN}✅ $1${NC}"; ((PASS++)); }
fail() { echo -e "${RED}❌ $1${NC}"; ((FAIL++)); }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARN++)); }
hdr()  { echo -e "\n${YELLOW}── $1 ──${NC}"; }

echo "════════════════════════════════════════════════"
echo "  LKVIP PRE-PRODUCTION CHECK"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"

# ─── 1. Services ─────────────────────────────────────────────────────────────
hdr "1. Services"

if pm2 status 2>/dev/null | grep -q "online"; then
  ok "PM2 — lkvip-api online"
else
  fail "PM2 — lkvip-api không online"
fi

if systemctl is-active --quiet nginx 2>/dev/null; then
  ok "Nginx — đang chạy"
else
  fail "Nginx — không chạy"
fi

if redis-cli ping 2>/dev/null | grep -q "PONG"; then
  ok "Redis — PONG"
else
  fail "Redis — không phản hồi"
fi

if mysqladmin ping --silent 2>/dev/null; then
  ok "MySQL — alive"
else
  fail "MySQL — không kết nối được"
fi

# ─── 2. API Health ────────────────────────────────────────────────────────────
hdr "2. API Health"

HEALTH=$(curl -sf https://api.tc-gaming.live/health 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"status"'; then
  ok "API health endpoint — phản hồi"
else
  fail "API health endpoint — không phản hồi (https://api.tc-gaming.live/health)"
fi

# ─── 3. Build ────────────────────────────────────────────────────────────────
hdr "3. TypeScript & Build"

if cd apps/backend && npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  fail "TypeScript — có lỗi compile"
  cd ../..
else
  ok "TypeScript — 0 errors"
  cd ../..
fi

if nginx -t 2>/dev/null; then
  ok "Nginx config — hợp lệ"
else
  fail "Nginx config — có lỗi"
fi

# ─── 4. Database & Migrations ────────────────────────────────────────────────
hdr "4. Database & Migrations"

if git status --short prisma/ 2>/dev/null | grep -q "M\|?"; then
  warn "Có file prisma chưa commit — kiểm tra migration chưa chạy"
else
  ok "Prisma schemas — không có thay đổi uncommitted"
fi

# ─── 5. Disk & Memory ────────────────────────────────────────────────────────
hdr "5. Disk & Memory"

DISK_USAGE=$(df /var/LKVIP 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}')
if [ -n "$DISK_USAGE" ]; then
  if [ "$DISK_USAGE" -lt 80 ]; then
    ok "Disk usage — ${DISK_USAGE}% (< 80%)"
  elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Disk usage — ${DISK_USAGE}% (80–90%, cần dọn dẹp sớm)"
  else
    fail "Disk usage — ${DISK_USAGE}% (> 90%, NGUY HIỂM)"
  fi
fi

MEM=$(free -m 2>/dev/null | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
if [ -n "$MEM" ]; then
  if [ "$MEM" -lt 85 ]; then
    ok "Memory — ${MEM}% used"
  else
    warn "Memory — ${MEM}% used (cao)"
  fi
fi

# ─── 6. SSL Certificates ─────────────────────────────────────────────────────
hdr "6. SSL Certificates"

for domain in api.tc-gaming.live hub.tc-gaming.live trade.tc-gaming.live; do
  EXPIRY=$(echo | timeout 5 openssl s_client -connect "${domain}:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
  if [ -n "$EXPIRY" ]; then
    DAYS_LEFT=$(( ($(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null) - $(date +%s)) / 86400 ))
    if [ "$DAYS_LEFT" -gt 30 ]; then
      ok "SSL ${domain} — còn ${DAYS_LEFT} ngày"
    elif [ "$DAYS_LEFT" -gt 7 ]; then
      warn "SSL ${domain} — còn ${DAYS_LEFT} ngày (cần gia hạn sớm)"
    else
      fail "SSL ${domain} — còn ${DAYS_LEFT} ngày (KHẨN CẤP)"
    fi
  else
    warn "SSL ${domain} — không kiểm tra được"
  fi
done

# ─── Kết quả ─────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ PASS: ${PASS}${NC}  |  ${YELLOW}⚠️  WARN: ${WARN}${NC}  |  ${RED}❌ FAIL: ${FAIL}${NC}"
echo "════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\n${RED}⛔ Có ${FAIL} lỗi nghiêm trọng — KHÔNG deploy cho đến khi fix xong.${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "\n${YELLOW}⚠️  Có ${WARN} cảnh báo — xem xét trước khi deploy.${NC}"
  exit 0
else
  echo -e "\n${GREEN}🚀 Sẵn sàng deploy!${NC}"
  exit 0
fi
