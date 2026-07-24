#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Safe deploy script for LKVIP GROUP backend
#
# Learned from BoYue rebuild-wap.sh pattern:
#   - Backup before deploy
#   - Protect uploads and sensitive files
#   - Auto-rollback on failure
#   - Zero-downtime restart via PM2
#
# Usage:
#   ./scripts/deploy.sh [--env production|staging] [--skip-backup] [--skip-build]
#
# Requirements: git, node, pnpm, pm2
# Run from: project root (/var/LKVIP)
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_DIRS=(
  "$ROOT_DIR/apps/game"
  "$ROOT_DIR/apps/hub"
  "$ROOT_DIR/apps/trading"
  "$ROOT_DIR/apps/dating"
  "$ROOT_DIR/apps/sports"
  "$ROOT_DIR/apps/admin-dashboard"
)
BACKUP_DIR="$ROOT_DIR/.backups"
PM2_APP_NAME="${PM2_APP_NAME:-lkvip-api}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
SKIP_BACKUP=false
SKIP_BUILD=false

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --env=*)        DEPLOY_ENV="${arg#*=}" ;;
    --skip-backup)  SKIP_BACKUP=true ;;
    --skip-build)   SKIP_BUILD=true ;;
  esac
done

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy]${NC} $*"; }
error()   { echo -e "${RED}[deploy]${NC} $*" >&2; }
step()    { echo -e "\n${GREEN}━━━ $* ━━━${NC}"; }

# ── Timestamp ─────────────────────────────────────────────────────────────────
TS="$(date +%Y%m%d_%H%M%S)"

# ── Rollback state ────────────────────────────────────────────────────────────
ROLLBACK_NEEDED=false
PREV_COMMIT=""

cleanup_on_failure() {
  if [[ "$ROLLBACK_NEEDED" == "true" && -n "$PREV_COMMIT" ]]; then
    error "Deploy failed — rolling back to $PREV_COMMIT"
    git -C "$ROOT_DIR" checkout "$PREV_COMMIT" -- . 2>/dev/null || true
    # Restart with previous code
    pm2 restart "$PM2_APP_NAME" 2>/dev/null || true
    error "Rollback complete. Check logs: pm2 logs $PM2_APP_NAME"
  fi
}
trap cleanup_on_failure ERR

# ─────────────────────────────────────────────────────────────────────────────
step "Pre-deploy checks"
# ─────────────────────────────────────────────────────────────────────────────

# 1. Must be in project root
if [[ ! -f "$ROOT_DIR/pnpm-workspace.yaml" ]]; then
  error "pnpm-workspace.yaml not found. Run from project root: /var/LKVIP"
  exit 1
fi

# 2. Check required tools
for cmd in git node pnpm pm2; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Required tool not found: $cmd"
    exit 1
  fi
done

# 3. Check .env exists
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  error "$BACKEND_DIR/.env not found. Create it from .env.example first."
  exit 1
fi

info "Environment: $DEPLOY_ENV"
info "Timestamp:   $TS"
info "Backend:     $BACKEND_DIR"

# ─────────────────────────────────────────────────────────────────────────────
step "Backup"
# ─────────────────────────────────────────────────────────────────────────────

PREV_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo '')"

if [[ "$SKIP_BACKUP" == "false" ]]; then
  mkdir -p "$BACKUP_DIR"

  # Backup uploads directory (preserve user-uploaded files)
  if [[ -d "$ROOT_DIR/data/uploads" ]]; then
    UPLOADS_BACKUP="$BACKUP_DIR/uploads_$TS.tar.gz"
    tar -czf "$UPLOADS_BACKUP" -C "$ROOT_DIR/data" uploads/ 2>/dev/null || true
    info "Uploads backed up → $UPLOADS_BACKUP"
  fi

  # Keep last 5 backups only
  ls -t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

  info "Previous commit: $PREV_COMMIT"
else
  warn "Backup skipped (--skip-backup)"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Pull latest code"
# ─────────────────────────────────────────────────────────────────────────────

ROLLBACK_NEEDED=true

git -C "$ROOT_DIR" fetch --quiet origin
git -C "$ROOT_DIR" pull --ff-only origin main

NEW_COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
info "Updated: $PREV_COMMIT → $NEW_COMMIT"

# ─────────────────────────────────────────────────────────────────────────────
step "Install dependencies"
# ─────────────────────────────────────────────────────────────────────────────

cd "$ROOT_DIR"
pnpm install --frozen-lockfile --prod=false
info "Workspace dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
step "Database migrations"
# ─────────────────────────────────────────────────────────────────────────────

cd "$BACKEND_DIR"

# Run Prisma migrations for all schemas
for schema in prisma/hub/schema.prisma prisma/game/schema.prisma prisma/trade/schema.prisma \
              prisma/dating/schema.prisma prisma/sports/schema.prisma prisma/admin/schema.prisma; do
  if [[ -f "$schema" ]]; then
    info "Migrating $schema..."
    NODE_ENV="$DEPLOY_ENV" npx prisma migrate deploy --schema="$schema" 2>&1 \
      | grep -E "(Applied|New|error|Error)" || true
  fi
done

cd "$ROOT_DIR"

# ─────────────────────────────────────────────────────────────────────────────
step "Build backend"
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$SKIP_BUILD" == "false" ]]; then
  cd "$BACKEND_DIR"
  pnpm run build
  info "Backend build complete"
  cd "$ROOT_DIR"
else
  warn "Build skipped (--skip-build)"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Build frontends"
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$SKIP_BUILD" == "false" ]]; then
  cd "$ROOT_DIR"
  pnpm run build:frontends
  info "All frontend builds complete"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Restart services"
# ─────────────────────────────────────────────────────────────────────────────

# Protect uploads — restore from backup if git checkout wiped them
if [[ "$SKIP_BACKUP" == "false" && -f "${BACKUP_DIR}/uploads_${TS}.tar.gz" ]]; then
  UPLOADS_DIR="$ROOT_DIR/data/uploads"
  mkdir -p "$UPLOADS_DIR"
  tar -xzf "${BACKUP_DIR}/uploads_${TS}.tar.gz" -C "$ROOT_DIR/data" \
    --keep-old-files 2>/dev/null || true
  info "Uploads restored"
fi

# PM2 zero-downtime reload
if pm2 list | grep -q "$PM2_APP_NAME"; then
  pm2 reload "$PM2_APP_NAME" --update-env
  info "PM2 reload: $PM2_APP_NAME"
else
  # First deploy — start from root ecosystem.config.js
  cd "$ROOT_DIR"
  pm2 start ecosystem.config.js --env "$DEPLOY_ENV"
  info "PM2 start: $PM2_APP_NAME"
fi

# Save PM2 process list
pm2 save --force 2>/dev/null || true

ROLLBACK_NEEDED=false

# ─────────────────────────────────────────────────────────────────────────────
step "Health check"
# ─────────────────────────────────────────────────────────────────────────────

sleep 3  # Give server time to start

APP_URL="${APP_URL:-http://localhost:5000}"
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$APP_URL/health/live" || echo '000')"

if [[ "$HTTP_CODE" == "200" ]]; then
  info "Health check OK (HTTP $HTTP_CODE)"
else
  warn "Health check returned HTTP $HTTP_CODE — check pm2 logs"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "Deploy complete"
# ─────────────────────────────────────────────────────────────────────────────

info "Deployed commit: $NEW_COMMIT"
info "Timestamp: $TS"
info "PM2 status: $(pm2 show "$PM2_APP_NAME" 2>/dev/null | grep 'status' || echo 'check pm2 list')"
echo ""
info "View logs:    pm2 logs $PM2_APP_NAME"
info "Monitor:      pm2 monit"
