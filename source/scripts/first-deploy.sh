#!/usr/bin/env bash
# =============================================================================
#  first-deploy.sh — LKVIP GROUP First Deployment
#
#  Run AFTER setup.sh on a fresh VPS (repo already cloned to install dir).
#  Installs dependencies, runs migrations, seeds DBs, builds frontends,
#  configures Nginx, and starts PM2.
#
#  Usage:
#    bash source/scripts/first-deploy.sh --domain yourdomain.com
#
#  Options:
#    --domain  <yourdomain.com>   Your root domain (required)
#    --env     <path>             Path to .env file (default: source/backend/.env)
#    --branch  <name>             Git branch to deploy (default: main)
#    --skip-seed                  Skip database seeding
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

# ── Parse arguments ───────────────────────────────────────────────────────────
DOMAIN=""
ENV_FILE=""
BRANCH="main"
SKIP_SEED=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)     DOMAIN="$2";     shift 2 ;;
    --env)        ENV_FILE="$2";   shift 2 ;;
    --branch)     BRANCH="$2";     shift 2 ;;
    --skip-seed)  SKIP_SEED=true;  shift ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  log_error "Missing required argument: --domain"
  echo "Usage: bash $0 --domain yourdomain.com"
  exit 1
fi

# ── Resolve paths ─────────────────────────────────────────────────────────────
INSTALL_DIR="/var/www/lkvip"
SOURCE_DIR="$INSTALL_DIR/source"
BACKEND_DIR="$SOURCE_DIR/backend"
SCRIPTS_DIR="$SOURCE_DIR/scripts"
NGINX_TEMPLATE="$SOURCE_DIR/nginx/nginx.conf"
NGINX_CONF="/etc/nginx/sites-available/lkvip-platform"
ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"
PM2_CONF="$BACKEND_DIR/ecosystem.config.js"

require_cmd node
require_cmd pnpm
require_cmd mysql
require_cmd nginx
require_cmd pm2

log_header "LKVIP GROUP — First Deployment"
log_info "Domain:  $DOMAIN"
log_info "Branch:  $BRANCH"
log_info "Env:     $ENV_FILE"
log_info "Dir:     $INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Pull latest code
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 1/9: Checking out branch $BRANCH"
cd "$INSTALL_DIR"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log_ok "Code up-to-date on branch $BRANCH"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Verify .env exists
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 2/9: Verifying .env"
check_env_file "$ENV_FILE"
# Validate mandatory vars
for VAR in JWT_SECRET JWT_REFRESH_SECRET ADMIN_DATABASE_URL HUB_DATABASE_URL \
           GAME_DATABASE_URL TRADE_DATABASE_URL DATING_DATABASE_URL SPORTS_DATABASE_URL; do
  VAL=$(grep -E "^${VAR}=" "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  if [[ -z "$VAL" || "$VAL" == "changeme" ]]; then
    log_error "Required env var not set: $VAR"
    exit 1
  fi
done
log_ok ".env validated"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Install dependencies
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 3/9: Installing dependencies (pnpm install)"
cd "$SOURCE_DIR"
pnpm install --frozen-lockfile
log_ok "Dependencies installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Generate Prisma clients
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 4/9: Generating Prisma clients"
cd "$BACKEND_DIR"
npm run prisma:generate
log_ok "Prisma clients generated"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Run database migrations
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 5/9: Running database migrations"
cd "$BACKEND_DIR"
npm run prisma:deploy:all
log_ok "All 6 database migrations applied"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Seed databases
# ═══════════════════════════════════════════════════════════════════════════════
if [[ "$SKIP_SEED" == false ]]; then
  log_step "Step 6/9: Seeding databases"
  cd "$BACKEND_DIR"
  npm run seed:all
  log_ok "Databases seeded"
else
  log_info "Step 6/9: Skipping seed (--skip-seed)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — Build all 6 frontends
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 7/9: Building backend (tsc) + all 6 frontends"

# Build TypeScript backend → dist/ (required by ecosystem.config.js)
cd "$BACKEND_DIR"
npm run build
log_ok "Backend compiled to dist/"

# Build all 6 SPAs
cd "$SOURCE_DIR"
declare -A FRONTEND_PKG=(
  [hub]="@lkvip/hub"
  [game]="@lkvip/game"
  [trade]="@lkvip/trade"
  [dating]="@lkvip/dating"
  [sports]="@lkvip/sports"
  [admin-dashboard]="@lkvip/admin-dashboard"
)
for APP in hub game trade dating sports admin-dashboard; do
  log_info "  Building $APP..."
  pnpm --filter "${FRONTEND_PKG[$APP]}" run build 2>&1 | tail -3
  log_ok "  $APP built"
done
log_ok "All 6 frontends built"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — Configure Nginx
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 8/9: Configuring Nginx for $DOMAIN"

if [[ ! -f "$NGINX_TEMPLATE" ]]; then
  log_error "Nginx template not found: $NGINX_TEMPLATE"
  exit 1
fi

# Patch domain placeholder in nginx template
sed "s/yourdomain\.com/$DOMAIN/g" "$NGINX_TEMPLATE" > "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/lkvip-platform

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
log_ok "Nginx configured for $DOMAIN"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 — Start PM2
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 9/9: Starting API server with PM2"
cd "$BACKEND_DIR"

# Stop existing instances if any
pm2 delete lkvip-api 2>/dev/null || true

pm2 start "$PM2_CONF" --env production
pm2 save

# Setup PM2 startup script
PM2_STARTUP=$(pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>&1 | grep 'sudo' | head -1 || true)
if [[ -n "$PM2_STARTUP" ]]; then
  eval "$PM2_STARTUP"
  log_ok "PM2 startup configured"
fi

pm2 save
log_ok "PM2 started and saved"

# ── Final summary ─────────────────────────────────────────────────────────────
log_header "First Deployment Complete!"
echo ""
echo -e "  ${GREEN}API Server${RESET}  https://api.${DOMAIN}"
echo -e "  ${GREEN}Hub${RESET}         https://hub.${DOMAIN}"
echo -e "  ${GREEN}Game${RESET}        https://game.${DOMAIN}"
echo -e "  ${GREEN}Trade${RESET}       https://trade.${DOMAIN}"
echo -e "  ${GREEN}Dating${RESET}      https://dating.${DOMAIN}"
echo -e "  ${GREEN}Sports${RESET}      https://sports.${DOMAIN}"
echo -e "  ${GREEN}Admin${RESET}       https://admin.${DOMAIN}"
echo ""
log_info "PM2 status:  pm2 status"
log_info "PM2 logs:    pm2 logs lkvip-api"
log_info "Setup SSL:   bash $SCRIPTS_DIR/ssl-setup.sh --domain $DOMAIN"
