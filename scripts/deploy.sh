#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Safe, isolated deploy script for LKVIP GROUP
#
# Isolation guarantees:
#   • Runs entirely inside /var/LKVIP — never touches /var/www
#   • PM2 process "lkvip-api" on 127.0.0.1:5000 (Nginx proxies externally)
#   • Port 5000 is internal-only; UFW blocks direct external access
#   • Logs → /var/LKVIP/logs/  (separate from BoYue logs)
#   • Backups → /var/LKVIP/.backups/
#
# Usage:
#   sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh [OPTIONS]
#
# Options:
#   --env=production|staging   (default: production)
#   --skip-backup              skip upload backup step
#   --skip-build               skip tsc + vite build (deploy existing dist)
#   --backend-only             only rebuild + restart backend
#   --frontend-only            only rebuild frontend static files
#
# Requirements: git, node ≥20, pnpm ≥9, pm2
# Run from:     /var/LKVIP  (project root)
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
BACKUP_DIR="$ROOT_DIR/.backups"
UPLOADS_DIR="$ROOT_DIR/data/uploads"
LOG_DIR="$ROOT_DIR/data/logs"
PM2_APP_NAME="${PM2_APP_NAME:-lkvip-api}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
INTERNAL_PORT=5000          # must match ecosystem.config.js + nginx upstream
HEALTH_URL="http://127.0.0.1:${INTERNAL_PORT}/health"

SKIP_BACKUP=false
SKIP_BUILD=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --env=*)         DEPLOY_ENV="${arg#*=}" ;;
    --skip-backup)   SKIP_BACKUP=true ;;
    --skip-build)    SKIP_BUILD=true ;;
    --backend-only)  BACKEND_ONLY=true ;;
    --frontend-only) FRONTEND_ONLY=true; SKIP_BUILD=false ;;
  esac
done

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()  { echo -e "${YELLOW}[deploy]${NC} $*"; }
error() { echo -e "${RED}[deploy]${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }
check_url() {
  local name="$1"
  local url="$2"
  if curl -fsSIL --max-time 15 "$url" >/dev/null; then
    info "Public check OK: $name"
  else
    error "Public check failed: $name — $url"
    return 1
  fi
}

TS="$(date +%Y%m%d_%H%M%S)"
ROLLBACK_NEEDED=false
PREV_COMMIT=""

cleanup_on_failure() {
  if [[ "$ROLLBACK_NEEDED" == "true" && -n "$PREV_COMMIT" ]]; then
    error "Deploy failed — rolling back to $PREV_COMMIT"
    git -C "$ROOT_DIR" checkout "$PREV_COMMIT" -- . 2>/dev/null || true
    pm2 restart "$PM2_APP_NAME" 2>/dev/null || true
    error "Rollback complete. Check: pm2 logs $PM2_APP_NAME"
  fi
}
trap cleanup_on_failure ERR

# =============================================================================
step "Pre-deploy checks"
# =============================================================================

# 1. Must be inside /var/LKVIP — refuse to run from wrong directory
if [[ "$ROOT_DIR" != "/var/LKVIP" ]]; then
  error "This script must run from /var/LKVIP (got: $ROOT_DIR)"
  error "Usage: sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh"
  exit 1
fi

# 2. Required tools
for cmd in git node pnpm pm2; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Required tool not found: $cmd"
    error "Run vps-setup.sh first to install dependencies"
    exit 1
  fi
done

# 3. Node version ≥ 20
NODE_MAJOR="$(node -v | cut -d. -f1 | tr -d 'v')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  error "Node.js ≥20 required (found $(node -v)). Run: nvm use 20"
  exit 1
fi

# 4. .env must exist
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  error "$BACKEND_DIR/.env not found."
  error "Copy and fill: cp $ROOT_DIR/config/env/.env.example $BACKEND_DIR/.env"
  exit 1
fi

# 5. Port isolation check — warn if 5000 is bound to a non-PM2 process
PORT_OWNER="$(ss -tlnp 2>/dev/null | awk "\$4 ~ /:${INTERNAL_PORT}$/ {print \$NF}" | head -1 || true)"
if [[ -n "$PORT_OWNER" ]] && ! echo "$PORT_OWNER" | grep -q "pm2\|node"; then
  warn "Port $INTERNAL_PORT is already in use by: $PORT_OWNER"
  warn "Change PORT in $BACKEND_DIR/.env and ecosystem.config.js to avoid conflict"
fi

mkdir -p "$LOG_DIR"
info "Environment : $DEPLOY_ENV"
info "Timestamp   : $TS"
info "Root        : $ROOT_DIR"
info "API port    : $INTERNAL_PORT (internal only)"

# =============================================================================
step "Backup"
# =============================================================================

PREV_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo '')"

if [[ "$SKIP_BACKUP" == "false" ]]; then
  mkdir -p "$BACKUP_DIR"

  if [[ -d "$UPLOADS_DIR" ]]; then
    UPLOADS_BACKUP="$BACKUP_DIR/uploads_${TS}.tar.gz"
    tar -czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")" 2>/dev/null || true
    info "Uploads backed up → $UPLOADS_BACKUP"
  fi

  # Keep last 5 backups only
  ls -t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
  info "Previous commit: $PREV_COMMIT"
else
  warn "Backup skipped (--skip-backup)"
fi

# =============================================================================
step "Pull latest code"
# =============================================================================

ROLLBACK_NEEDED=true

git -C "$ROOT_DIR" fetch --quiet origin
git -C "$ROOT_DIR" pull --ff-only origin main

NEW_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
info "Updated: $PREV_COMMIT → $NEW_COMMIT"

# =============================================================================
step "Install dependencies"
# =============================================================================

cd "$ROOT_DIR"
pnpm install --frozen-lockfile --prod=false
info "Workspace dependencies installed"

# =============================================================================
step "Database migrations"
# =============================================================================

if [[ "$FRONTEND_ONLY" != "true" ]]; then
  cd "$BACKEND_DIR"
  for schema in \
    prisma/hub/schema.prisma \
    prisma/game/schema.prisma \
    prisma/trade/schema.prisma \
    prisma/dating/schema.prisma \
    prisma/sports/schema.prisma \
    prisma/admin/schema.prisma; do
    if [[ -f "$schema" ]]; then
      info "Migrating $schema..."
      NODE_ENV="$DEPLOY_ENV" npx prisma migrate deploy --schema="$schema" 2>&1 \
        | grep -E "(Applied|New migration|No pending|error|Error)" || true
    fi
  done
  cd "$ROOT_DIR"
fi

# =============================================================================
step "Build"
# =============================================================================

if [[ "$SKIP_BUILD" == "false" ]]; then

  if [[ "$FRONTEND_ONLY" != "true" ]]; then
    info "Building backend (TypeScript)..."
    cd "$BACKEND_DIR"
    pnpm run build
    cd "$ROOT_DIR"
    info "Backend build complete → apps/backend/dist/"
  fi

  if [[ "$BACKEND_ONLY" != "true" ]]; then
    info "Building all frontends..."
    # Build shared packages first, then SPAs
    pnpm run build:packages 2>/dev/null || true
    pnpm run build:frontends
    info "Frontend builds complete"
    info "  hub      → apps/hub/dist/"
    info "  game     → apps/game/dist/ (not public-routed unless DNS/Nginx enabled)"
    info "  trading  → apps/trading/dist/"
    info "  dating   → apps/dating/dist/ (not public-routed unless DNS/Nginx enabled)"
    info "  sports   → apps/sports/dist/"
    info "  admin    → apps/admin-dashboard/dist/"
  fi

else
  warn "Build skipped (--skip-build)"
fi

# =============================================================================
step "Restore uploads"
# =============================================================================

if [[ "$SKIP_BACKUP" == "false" && -f "${BACKUP_DIR}/uploads_${TS}.tar.gz" ]]; then
  mkdir -p "$UPLOADS_DIR"
  tar -xzf "${BACKUP_DIR}/uploads_${TS}.tar.gz" \
    -C "$(dirname "$UPLOADS_DIR")" \
    --keep-old-files 2>/dev/null || true
  info "Uploads preserved from backup"
fi

# =============================================================================
step "Restart services (zero-downtime)"
# =============================================================================

if [[ "$FRONTEND_ONLY" != "true" ]]; then
  if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 reload "$PM2_APP_NAME" --update-env
    info "PM2 reload: $PM2_APP_NAME (zero-downtime)"
  else
    # First deploy — start from backend ecosystem config
    cd "$BACKEND_DIR"
    pm2 start ecosystem.config.js --env "$DEPLOY_ENV"
    cd "$ROOT_DIR"
    info "PM2 start: $PM2_APP_NAME"
  fi
  pm2 save --force 2>/dev/null || true
fi

ROLLBACK_NEEDED=false

# Reload Nginx to pick up any static-file changes
if nginx -t 2>/dev/null; then
  nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || true
  info "Nginx reloaded"
else
  warn "Nginx config test failed — skipping reload (check: nginx -t)"
fi

# =============================================================================
step "Health check"
# =============================================================================

if [[ "$FRONTEND_ONLY" != "true" ]]; then
  sleep 4
  STATUS="$(curl -sf --max-time 10 "$HEALTH_URL" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" \
    2>/dev/null || echo 'error')"
  if [[ "$STATUS" == "healthy" ]]; then
    info "Health check OK ($STATUS) — $HEALTH_URL"
  else
    error "Health check failed ($STATUS) — check: pm2 logs $PM2_APP_NAME"
    exit 1
  fi
fi

if [[ "$BACKEND_ONLY" != "true" ]]; then
  check_url "root hub" "https://tc-gaming.live/"
  check_url "hub" "https://hub.tc-gaming.live/"
  check_url "trade" "https://trade.tc-gaming.live/"
  check_url "sports" "https://sports.tc-gaming.live/"
  check_url "admin" "https://admin.tc-gaming.live/"
fi

if [[ "$FRONTEND_ONLY" != "true" ]]; then
  check_url "public API health" "https://api.tc-gaming.live/health"
  check_url "public config brand" "https://api.tc-gaming.live/api/shared/config?project=hub&group=brand"
  check_url "public config colors" "https://api.tc-gaming.live/api/shared/config?project=hub&group=colors"
fi

# =============================================================================
step "Deploy complete"
# =============================================================================

info "Commit  : $NEW_COMMIT"
info "Time    : $TS"
info "PM2     : $(pm2 show "$PM2_APP_NAME" 2>/dev/null | grep 'status' | awk '{print $4}' || echo 'check pm2 list')"
echo ""
info "Useful commands:"
echo "    pm2 logs $PM2_APP_NAME"
echo "    pm2 monit"
echo "    tail -f $ROOT_DIR/data/logs/lkvip-api-out.log"
echo "    tail -f $ROOT_DIR/data/logs/backup.log"
echo "    tail -f $ROOT_DIR/data/logs/health.log"
echo "    curl -sf https://api.tc-gaming.live/health"
