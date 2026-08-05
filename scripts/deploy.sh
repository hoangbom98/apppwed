#!/bin/bash
# =============================================================================
#  deploy.sh — Quy trình triển khai chuẩn cho LKVIP GROUP @ tc-gaming.live
#  Cách dùng : bash /var/LKVIP/scripts/deploy.sh
#  Chạy trên : VPS Ubuntu 22.04, thư mục /var/LKVIP
#
#  Các bước thực thi (theo thứ tự):
#    1.  git pull — lấy code mới nhất
#    2.  pnpm install (frozen lockfile — không cho phép drift trong prod)
#    3.  Build shared packages (types / utils / constants / api-client)
#    4.  Build tất cả frontend SPA (hub, game, trade, dating, sports, admin,
#                                   banking, invest, store, academy)
#    4b. Build lkvipgroup-portal   (Next.js standalone :3010)
#    4c. Build lkvip-invest        (Next.js standalone :3011)
#    4d. Build lkvip-store         (Next.js standalone :3012)
#    4e. Build lkvip-academy       (Next.js standalone :3013)
#    5.  Build backend TypeScript → dist/
#    6.  Chạy Prisma migrations (6 schema MySQL + portal PostgreSQL)
#    7.  PM2 zero-downtime reload (5 process: api, portal, invest, store, academy)
#    8.  Kiểm tra và reload cấu hình Nginx
# =============================================================================
set -euo pipefail

DEPLOY_DIR="/var/LKVIP"
LOG_DIR="$DEPLOY_DIR/data/logs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  LKVIP GROUP — Deploy  [$TIMESTAMP]"
echo "═══════════════════════════════════════════════════════"

# ── Đảm bảo thư mục log tồn tại ──────────────────────────────────────────────
mkdir -p "$LOG_DIR"

cd "$DEPLOY_DIR"

# ── 1. Lấy code mới nhất từ git ───────────────────────────────────────────────
echo ""
echo "▶ [1/8] git pull"
git pull

# ── 2. Cài đặt dependencies (frozen lockfile) ─────────────────────────────────
echo ""
echo "▶ [2/8] pnpm install --frozen-lockfile"
pnpm install --frozen-lockfile

# ── 3. Build shared packages (types, utils, constants, api-client) ────────────
echo ""
echo "▶ [3/8] Build shared packages"
pnpm run build:packages

# ── 4. Build tất cả frontend SPA (Vite/React) ────────────────────────────────
echo ""
echo "▶ [4/8] Build tất cả frontend SPA"
pnpm run build:frontends

# ── [4b] Build lkvipgroup-portal (Next.js standalone, cổng :3010) ─────────────
# Chạy next build với output: standalone; sao chép static assets vào thư mục
# standalone để server.js có thể phục vụ trực tiếp mà không cần thư mục gốc.
echo "▶ [4b] Build lkvipgroup-portal (Next.js standalone)"
pnpm --filter @lkvip/portal run build
if [ -d "apps/lkvipgroup-portal/.next/standalone" ]; then
  cp -r apps/lkvipgroup-portal/.next/static \
        apps/lkvipgroup-portal/.next/standalone/.next/static 2>/dev/null || true
  cp -r apps/lkvipgroup-portal/public \
        apps/lkvipgroup-portal/.next/standalone/public 2>/dev/null || true
  echo "  ✔ Portal — đã sao chép static assets"
fi

# ── [4c] Build lkvip-invest (Next.js standalone, cổng :3011) ──────────────────
# Chạy next build với output: standalone; sao chép static assets vào thư mục
# standalone để server.js có thể phục vụ trực tiếp mà không cần thư mục gốc.
echo "▶ [4c] Build lkvip-invest (Next.js standalone)"
pnpm --filter @lkvip/invest run build
if [ -d "apps/invest/.next/standalone" ]; then
  cp -r apps/invest/.next/static    apps/invest/.next/standalone/.next/static    2>/dev/null || true
  cp -r apps/invest/public          apps/invest/.next/standalone/public          2>/dev/null || true
  echo "  ✔ Invest — đã sao chép static assets"
fi

# ── [4d] Build lkvip-store (Next.js standalone, cổng :3012) ───────────────────
# Chạy next build với output: standalone; sao chép static assets vào thư mục
# standalone để server.js có thể phục vụ trực tiếp mà không cần thư mục gốc.
echo "▶ [4d] Build lkvip-store (Next.js standalone)"
pnpm --filter @lkvip/store run build
if [ -d "apps/lkvip-store/.next/standalone" ]; then
  cp -r apps/lkvip-store/.next/static    apps/lkvip-store/.next/standalone/.next/static    2>/dev/null || true
  cp -r apps/lkvip-store/public          apps/lkvip-store/.next/standalone/public          2>/dev/null || true
  echo "  ✔ Store — đã sao chép static assets"
fi

# ── [4e] Build lkvip-academy (Next.js standalone, cổng :3013) ─────────────────
# Chạy next build với output: standalone; sao chép static assets vào thư mục
# standalone để server.js có thể phục vụ trực tiếp mà không cần thư mục gốc.
echo "▶ [4e] Build lkvip-academy (Next.js standalone)"
pnpm --filter @lkvip/academy run build
if [ -d "apps/academy/.next/standalone" ]; then
  cp -r apps/academy/.next/static    apps/academy/.next/standalone/.next/static    2>/dev/null || true
  cp -r apps/academy/public          apps/academy/.next/standalone/public          2>/dev/null || true
  echo "  ✔ Academy — đã sao chép static assets"
fi

# ── 5. Build backend TypeScript → dist/ ───────────────────────────────────────
echo ""
echo "▶ [5/8] Build backend"
pnpm --filter lkvip-backend run build

# ── 6. Chạy Prisma migrations ─────────────────────────────────────────────────
# Bước 6a: Deploy 6 schema MySQL cho backend (hub, game, trade, dating, sports, admin)
# Bước 6b: Deploy schema PostgreSQL cho portal (workspaceSprint, workspaceTask, workspaceComment)
echo ""
echo "▶ [6/8] Prisma deploy (6 schema MySQL + portal PostgreSQL)"

# 6a — MySQL schemas (backend)
pnpm run prisma:deploy

# 6b — PostgreSQL schema (portal) — idempotent: migrate deploy chỉ áp dụng migration chưa chạy
echo "  ▶ [6b] Portal Prisma migrate deploy (PostgreSQL)"
pnpm --filter @lkvip/portal run db:migrate

# ── 7. PM2 zero-downtime reload (5 process) ───────────────────────────────────
# Cơ chế idempotent: thử pm2 reload trước; nếu process chưa tồn tại (exit code ≠ 0)
# thì dùng pm2 start với ecosystem.config.js để khởi động mới.
# Điều này đảm bảo script an toàn khi chạy lại nhiều lần.
echo ""
echo "▶ [7/8] PM2 reload — api + portal + invest + store + academy"

# ── Backend API (cluster mode, zero-downtime) ─────────────────────────────────
# Process lkvip-api phải luôn chạy; fallback start nếu chưa tồn tại.
if pm2 describe lkvip-api > /dev/null 2>&1; then
  pm2 reload lkvip-api --update-env
  echo "  ✔ lkvip-api — đã reload"
else
  pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-api
  echo "  ✔ lkvip-api — đã khởi động mới"
fi

# ── Portal (Next.js standalone :3010) ─────────────────────────────────────────
# Reload hoặc start lần đầu nếu process chưa tồn tại trong danh sách PM2.
if pm2 describe lkvip-portal > /dev/null 2>&1; then
  pm2 reload lkvip-portal --update-env
  echo "  ✔ lkvip-portal — đã reload"
else
  pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-portal
  echo "  ✔ lkvip-portal — đã khởi động mới"
fi

# ── Invest (Next.js standalone :3011) ─────────────────────────────────────────
# Reload hoặc start lần đầu nếu process chưa tồn tại trong danh sách PM2.
if pm2 describe lkvip-invest > /dev/null 2>&1; then
  pm2 reload lkvip-invest --update-env
  echo "  ✔ lkvip-invest — đã reload"
else
  pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-invest
  echo "  ✔ lkvip-invest — đã khởi động mới"
fi

# ── Store (Next.js standalone :3012) ──────────────────────────────────────────
# Reload hoặc start lần đầu nếu process chưa tồn tại trong danh sách PM2.
if pm2 describe lkvip-store > /dev/null 2>&1; then
  pm2 reload lkvip-store --update-env
  echo "  ✔ lkvip-store — đã reload"
else
  pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-store
  echo "  ✔ lkvip-store — đã khởi động mới"
fi

# ── Academy (Next.js standalone :3013) ────────────────────────────────────────
# Reload hoặc start lần đầu nếu process chưa tồn tại trong danh sách PM2.
if pm2 describe lkvip-academy > /dev/null 2>&1; then
  pm2 reload lkvip-academy --update-env
  echo "  ✔ lkvip-academy — đã reload"
else
  pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-academy
  echo "  ✔ lkvip-academy — đã khởi động mới"
fi

# Lưu danh sách PM2 để tự khôi phục sau khi khởi động lại server
pm2 save

# ── 8. Kiểm tra và reload cấu hình Nginx ─────────────────────────────────────
echo ""
echo "▶ [8/8] nginx -t && reload"
nginx -t
systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  Deploy hoàn tất  [$TIMESTAMP]"
echo "  Trạng thái PM2:"
pm2 status
echo "═══════════════════════════════════════════════════════"
