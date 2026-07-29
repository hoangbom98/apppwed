#!/usr/bin/env bash
# =============================================================================
# deploy-vercel.sh — Deploy all 6 LKVIP SPA frontends to Vercel
# =============================================================================
# Usage:
#   ./scripts/deploy-vercel.sh [OPTIONS] [APP...]
#
# Options:
#   --prod        Deploy to production (default: preview)
#   --app NAME    Deploy a single app (hub|game|trading|dating|sports|admin-dashboard)
#   --dry-run     Print commands without executing
#   --help        Show this help
#
# Environment variables required:
#   VERCEL_TOKEN        — Vercel personal access token
#   VERCEL_ORG_ID       — Vercel team/org ID (find in Project Settings → General)
#
# Per-app project IDs (set in CI secrets or locally):
#   VERCEL_PROJECT_ID_HUB
#   VERCEL_PROJECT_ID_GAME
#   VERCEL_PROJECT_ID_TRADING
#   VERCEL_PROJECT_ID_DATING
#   VERCEL_PROJECT_ID_SPORTS
#   VERCEL_PROJECT_ID_ADMIN
#
# First-time setup:
#   1. npm install -g vercel
#   2. vercel login
#   3. Run this script once WITHOUT --prod to link projects and get project IDs
#   4. Copy project IDs into the environment vars above
# =============================================================================

set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
info() { echo -e "${CYAN}→${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }

# ── Defaults ───────────────────────────────────────────────────────────────────
PROD=false
DRY_RUN=false
SELECTED_APPS=()
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Argument parsing ───────────────────────────────────────────────────────────
usage() {
  grep '^#' "$0" | sed 's/^# \{0,1\}//' | head -30
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)       PROD=true; shift ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --app)        SELECTED_APPS+=("$2"); shift 2 ;;
    --help|-h)    usage ;;
    hub|game|trading|dating|sports|admin-dashboard)
                  SELECTED_APPS+=("$1"); shift ;;
    *)            err "Unknown argument: $1"; exit 1 ;;
  esac
done

# ── App definitions: name → (dir, project_id_env_var, vite_env_prefix) ────────
declare -A APP_DIR=(
  [hub]="apps/hub"
  [game]="apps/game"
  [trading]="apps/trading"
  [dating]="apps/dating"
  [sports]="apps/sports"
  [admin-dashboard]="apps/admin-dashboard"
)
declare -A APP_PROJECT_ENV=(
  [hub]="VERCEL_PROJECT_ID_HUB"
  [game]="VERCEL_PROJECT_ID_GAME"
  [trading]="VERCEL_PROJECT_ID_TRADING"
  [dating]="VERCEL_PROJECT_ID_DATING"
  [sports]="VERCEL_PROJECT_ID_SPORTS"
  [admin-dashboard]="VERCEL_PROJECT_ID_ADMIN"
)
# Vercel display names (must match names used when linking the project)
declare -A APP_PROJECT_NAME=(
  [hub]="lkvip-hub"
  [game]="lkvip-game"
  [trading]="lkvip-trading"
  [dating]="lkvip-dating"
  [sports]="lkvip-sports"
  [admin-dashboard]="lkvip-admin"
)

ALL_APPS=(hub game trading dating sports admin-dashboard)
APPS=("${SELECTED_APPS[@]:-${ALL_APPS[@]}}")

# ── Pre-flight checks ──────────────────────────────────────────────────────────
info "Pre-flight checks..."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  err "VERCEL_TOKEN is not set. Export it or add to .env:"
  err "  export VERCEL_TOKEN=\$(vercel token)"
  exit 1
fi

if ! command -v vercel &>/dev/null; then
  err "Vercel CLI not found. Install with: npm install -g vercel"
  exit 1
fi

ok "Vercel CLI $(vercel --version 2>/dev/null | head -1) found"

DEPLOY_FLAG=""
if $PROD; then
  DEPLOY_FLAG="--prod"
  warn "Deploying to PRODUCTION"
else
  info "Deploying as preview (add --prod to deploy to production)"
fi

# ── run_cmd: respects --dry-run ────────────────────────────────────────────────
run_cmd() {
  if $DRY_RUN; then
    echo -e "${YELLOW}[dry-run]${RESET} $*"
  else
    eval "$@"
  fi
}

# ── Deploy function ────────────────────────────────────────────────────────────
deploy_app() {
  local app="$1"
  local dir="${REPO_ROOT}/${APP_DIR[$app]}"
  local project_name="${APP_PROJECT_NAME[$app]}"
  local project_id_env="${APP_PROJECT_ENV[$app]}"
  local project_id="${!project_id_env:-}"

  echo ""
  echo -e "${BOLD}━━━ Deploying: ${app} ━━━${RESET}"
  info "Directory : $dir"
  info "Project   : $project_name"

  if [[ ! -d "$dir" ]]; then
    err "Directory not found: $dir — skipping."
    return 1
  fi

  # Build the vercel deploy command
  local cmd="vercel"
  cmd+=" --cwd \"$REPO_ROOT\""          # run from monorepo root
  cmd+=" --token \"$VERCEL_TOKEN\""
  cmd+=" --yes"                          # non-interactive

  if [[ -n "$project_id" ]]; then
    cmd+=" --project \"$project_id\""
  else
    # Fallback: use project name (requires project to be linked first)
    warn "No project ID set for $app (${project_id_env} not set). Using name: $project_name"
    cmd+=" --name \"$project_name\""
  fi

  if [[ -n "${VERCEL_ORG_ID:-}" ]]; then
    cmd+=" --scope \"$VERCEL_ORG_ID\""
  fi

  cmd+=" $DEPLOY_FLAG"

  # vercel.json in each app dir sets buildCommand/outputDirectory
  # but we still pass --local-config explicitly for clarity
  cmd+=" --local-config \"${dir}/vercel.json\""

  info "Running: vercel deploy for $app"
  local output
  if $DRY_RUN; then
    echo -e "${YELLOW}[dry-run]${RESET} $cmd"
    return 0
  fi

  if output=$(eval "$cmd" 2>&1); then
    local deploy_url
    deploy_url=$(echo "$output" | grep -E '^https://' | tail -1)
    ok "Deployed $app → ${deploy_url:-<check Vercel dashboard>}"
    return 0
  else
    err "Deploy failed for $app:"
    echo "$output"
    return 1
  fi
}

# ── Main loop ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}LKVIP Vercel Deploy${RESET}"
echo -e "Mode   : $(if $PROD; then echo 'production'; else echo 'preview'; fi)"
echo -e "Apps   : ${APPS[*]}"
echo ""

FAILED=()
for app in "${APPS[@]}"; do
  if ! deploy_app "$app"; then
    FAILED+=("$app")
  fi
done

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━ Summary ━━━${RESET}"
TOTAL=${#APPS[@]}
FAIL_COUNT=${#FAILED[@]}
PASS_COUNT=$(( TOTAL - FAIL_COUNT ))
ok "$PASS_COUNT/$TOTAL apps deployed successfully"
if [[ $FAIL_COUNT -gt 0 ]]; then
  err "Failed apps: ${FAILED[*]}"
  exit 1
fi
echo ""
echo "View deployments: https://vercel.com/dashboard"
