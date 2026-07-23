#!/usr/bin/env bash
# =============================================================================
#  deploy.sh — LKVIP GROUP Rolling Deploy
#
#  Zero-downtime deploy: git pull → pnpm install → prisma migrate →
#  build frontends → pm2 reload with automatic rollback on failure.
#
#  Usage:
#    bash source/scripts/deploy.sh [options]
#
#  Options:
#    --module  <all|backend|hub|game|trade|dating|sports|admin>
#                        What to deploy (default: all)
#    --branch  <name>    Git branch to deploy (default: main)
#    --skip-build        Skip frontend rebuild
#    --rollback          Roll back to last known-good commit
#    --auto-rollback     Automatically rollback if PM2 reload fails
#    --env     <path>    Path to .env (default: /var/www/lkvip/source/backend/.env)
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

# ── Defaults ──────────────────────────────────────────────────────────────────
MODULE="all"
BRANCH="main"
SKIP_BUILD=false
ROLLBACK=false
AUTO_ROLLBACK=false
ENV_FILE="/var/www/lkvip/source/backend/.env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --module)        MODULE="$2";        shift 2 ;;
    --branch)        BRANCH="$2";        shift 2 ;;
    --env)           ENV_FILE="$2";      shift 2 ;;
    --skip-build)    SKIP_BUILD=true;    shift ;;
    --rollback)      ROLLBACK=true;      shift ;;
    --auto-rollback) AUTO_ROLLBACK=true; shift ;;
    *) log_warn "Unknown argument: $1";  shift ;;
  esac
done

# ── Paths ─────────────────────────────────────────────────────────────────────
INSTALL_DIR="/var/www/lkvip"
SOURCE_DIR="$INSTALL_DIR/source"
BACKEND_DIR="$SOURCE_DIR/backend"
ROLLBACK_SHA_FILE="$INSTALL_DIR/.deploy-sha"

require_cmd git
require_cmd pnpm
require_cmd pm2

# ── Rollback mode ─────────────────────────────────────────────────────────────
if [[ "$ROLLBACK" == true ]]; then
  log_header "LKVIP GROUP — Rollback"
  if [[ ! -f "$ROLLBACK_SHA_FILE" ]]; then
    log_error "No rollback SHA found at $ROLLBACK_SHA_FILE"
    exit 1
  fi
  PREV_SHA="$(cat "$ROLLBACK_SHA_FILE")"
  log_warn "Rolling back to commit: $PREV_SHA"
  cd "$INSTALL_DIR"
  git checkout "$PREV_SHA"
  cd "$BACKEND_DIR"
  pnpm install --frozen-lockfile
  npm run prisma:deploy:all
  pm2 reload lkvip-api --update-env
  log_ok "Rollback to $PREV_SHA complete"
  exit 0
fi

# ── Normal deploy ─────────────────────────────────────────────────────────────
log_header "LKVIP GROUP — Deploy (module=$MODULE branch=$BRANCH)"

check_env_file "$ENV_FILE"

# Save current SHA before pulling
cd "$INSTALL_DIR"
CURRENT_SHA="$(git rev-parse HEAD)"
echo "$CURRENT_SHA" > "$ROLLBACK_SHA_FILE"
log_info "Rollback SHA saved: $CURRENT_SHA"

# ── Git pull ───────────────────────────────────────────────────────────────────
log_step "1. Git pull (branch=$BRANCH)"
git fetch origin
git pull origin "$BRANCH"
NEW_SHA="$(git rev-parse HEAD)"
log_ok "Updated: $CURRENT_SHA → $NEW_SHA"

# ── Install dependencies ───────────────────────────────────────────────────────
log_step "2. pnpm install --frozen-lockfile"
cd "$SOURCE_DIR"
pnpm install --frozen-lockfile
log_ok "Dependencies up-to-date"

# ── Prisma ────────────────────────────────────────────────────────────────────
if [[ "$MODULE" == "all" || "$MODULE" == "backend" ]]; then
  log_step "3. Prisma generate + migrate deploy"
  cd "$BACKEND_DIR"
  npm run prisma:generate
  npm run prisma:deploy:all
  log_ok "Prisma clients regenerated, migrations applied"

  log_step "3b. Build TypeScript → dist/"
  npm run build
  log_ok "Backend compiled"
else
  log_info "3. Skipping Prisma + build (module=$MODULE)"
fi

# ── Build frontends ───────────────────────────────────────────────────────────
if [[ "$SKIP_BUILD" == false ]]; then
  log_step "4. Building frontend(s)"

  # Map CLI module name → pnpm package name (@lkvip/admin is the package for admin-dashboard dir)
  declare -A FRONTEND_FILTER=(
    [hub]="@lkvip/hub"
    [game]="@lkvip/game"
    [trade]="@lkvip/trade"
    [dating]="@lkvip/dating"
    [sports]="@lkvip/sports"
    [admin]="@lkvip/admin"
  )

  # List of (dir → package) pairs for --module all
  declare -A APP_PKG_MAP=(
    [hub]="@lkvip/hub"
    [game]="@lkvip/game"
    [trade]="@lkvip/trade"
    [dating]="@lkvip/dating"
    [sports]="@lkvip/sports"
    [admin-dashboard]="@lkvip/admin"
  )

  cd "$SOURCE_DIR"
  if [[ "$MODULE" == "all" ]]; then
    for APP in hub game trade dating sports admin-dashboard; do
      PKG="${APP_PKG_MAP[$APP]}"
      log_info "  Building $APP ($PKG)..."
      pnpm --filter "$PKG" run build 2>&1 | tail -2
    done
    log_ok "All 6 frontends built"
  elif [[ -n "${FRONTEND_FILTER[$MODULE]+x}" ]]; then
    FILTER="${FRONTEND_FILTER[$MODULE]}"
    log_info "  Building $MODULE ($FILTER)..."
    pnpm --filter "$FILTER" run build
    log_ok "$MODULE built"
  else
    log_info "  No frontend to build for module=$MODULE"
  fi
else
  log_info "4. Skipping frontend build (--skip-build)"
fi

# ── PM2 reload ────────────────────────────────────────────────────────────────
if [[ "$MODULE" == "all" || "$MODULE" == "backend" ]]; then
  log_step "5. pm2 reload lkvip-api"
  cd "$BACKEND_DIR"

  if [[ "$AUTO_ROLLBACK" == true ]]; then
    # Try reload; on failure restore previous commit and restart
    if ! pm2 reload lkvip-api --update-env; then
      log_error "PM2 reload failed — initiating automatic rollback to $CURRENT_SHA"
      git checkout "$CURRENT_SHA"
      pnpm install --frozen-lockfile
      pm2 reload lkvip-api --update-env || pm2 restart lkvip-api
      log_warn "Rolled back to $CURRENT_SHA"
      exit 2
    fi
  else
    pm2 reload lkvip-api --update-env
  fi

  log_ok "API server reloaded (zero-downtime)"
else
  log_info "5. Skipping PM2 reload (module=$MODULE, backend not touched)"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
log_header "Deploy Complete"
echo -e "  Deployed commit: ${GREEN}$NEW_SHA${RESET}"
echo -e "  Module:          ${GREEN}$MODULE${RESET}"
echo ""
log_info "pm2 status"
pm2 list --no-color | grep "lkvip-api" || true
