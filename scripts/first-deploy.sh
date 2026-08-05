#!/bin/bash
# =============================================================================
#  first-deploy.sh — First-time application deployment
#  Run AFTER: vps-setup.sh + filling .env + ssl-setup.sh
#
#  Usage  : bash /var/LKVIP/scripts/first-deploy.sh
#  Runs on: VPS as root or lkvip user with /var/LKVIP as cwd
# =============================================================================
set -euo pipefail

DEPLOY_DIR="/var/LKVIP"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  LKVIP GROUP — First Deploy  [$TIMESTAMP]"
echo "═══════════════════════════════════════════════════════"

cd "$DEPLOY_DIR"

# ── Guard: .env must exist ────────────────────────────────────────────────────
if [ ! -f "apps/backend/.env" ]; then
  echo "❌  apps/backend/.env not found."
  echo "   Run: cp apps/backend/.env.example apps/backend/.env"
  echo "        nano apps/backend/.env"
  exit 1
fi

mkdir -p data/logs data/uploads

# ── 1. Install all dependencies ───────────────────────────────────────────────
echo ""
echo "▶ [1/7] pnpm install"
pnpm install --frozen-lockfile

# ── 2. Build shared packages ──────────────────────────────────────────────────
echo ""
echo "▶ [2/7] Build shared packages"
pnpm run build:packages

# ── 3. Build all frontend SPAs ────────────────────────────────────────────────
echo ""
echo "▶ [3/7] Build all frontend SPAs"
pnpm run build:frontends

# ── 4. Build portal (Next.js standalone) ─────────────────────────────────────
echo ""
echo "▶ [4/7] Build lkvipgroup-portal"
pnpm --filter @lkvip/portal run build
# Copy static assets into standalone tree
if [ -d "apps/lkvipgroup-portal/.next/standalone" ]; then
  cp -r apps/lkvipgroup-portal/.next/static \
        apps/lkvipgroup-portal/.next/standalone/.next/static
  cp -r apps/lkvipgroup-portal/public \
        apps/lkvipgroup-portal/.next/standalone/public 2>/dev/null || true
  echo "  ✔ Portal static assets ready"
fi

# ── 5. Build backend ──────────────────────────────────────────────────────────
echo ""
echo "▶ [5/7] Build backend"
pnpm --filter lkvip-backend run build

# ── 6. Prisma migrations ─────────────────────────────────────────────────────
echo ""
echo "▶ [6/7] Prisma deploy (all schemas)"
pnpm run prisma:deploy

echo ""
echo "▶ [6b] Seed initial data"
pnpm --filter lkvip-backend run seed:all || echo "  ⚠  Seed failed or already seeded — continuing"

# ── 7. Start PM2 processes ────────────────────────────────────────────────────
echo ""
echo "▶ [7/7] PM2 start"
pm2 start config/pm2/ecosystem.config.js --env production
pm2 save
echo "  ✔ PM2 processes started and saved"

echo ""
echo "▶ Nginx reload"
nginx -t && systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  First deploy complete!"
echo ""
echo "  Public URLs:"
echo "    https://tc-gaming.live           → Hub SPA"
echo "    https://hub.tc-gaming.live       → Hub SPA"
echo "    https://game.tc-gaming.live      → Game SPA"
echo "    https://trade.tc-gaming.live     → Trading SPA"
echo "    https://dating.tc-gaming.live    → Dating SPA"
echo "    https://sports.tc-gaming.live    → Sports SPA"
echo "    https://admin.tc-gaming.live     → Admin Dashboard"
echo "    https://banking.tc-gaming.live   → Banking SPA"
echo "    https://invest.tc-gaming.live    → Invest SPA"
echo "    https://store.tc-gaming.live     → Store SPA"
echo "    https://lkvip.tc-gaming.live     → Portal (Next.js)"
echo "    https://api.tc-gaming.live       → Backend API"
echo ""
echo "  Monitoring:"
echo "    pm2 status"
echo "    pm2 logs lkvip-api"
echo "    curl https://api.tc-gaming.live/health"
echo "═══════════════════════════════════════════════════════"
