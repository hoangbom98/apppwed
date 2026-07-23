#!/usr/bin/env bash
# =============================================================================
#  check-env.sh — LKVIP GROUP Environment Variable Validation
#
#  Validates all required environment variables in the .env file.
#  Bash counterpart of `lkvip env` (TypeScript CLI command).
#  Use this as a pre-deploy sanity check or in CI/CD pipelines.
#
#  Usage:
#    bash source/scripts/check-env.sh [--env /path/to/.env]
#
#  Exit codes:
#    0 — all required variables are set
#    1 — one or more required variables missing or invalid
# =============================================================================
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

# ── Arguments ─────────────────────────────────────────────────────────────────
ENV_FILE="/var/www/lkvip/source/backend/.env"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_FILE="$2"; shift 2 ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

check_env_file "$ENV_FILE"

log_header "LKVIP GROUP — Environment Check"
log_info "Checking: $ENV_FILE"

ERRORS=0
WARNINGS=0

# ── Helper functions ──────────────────────────────────────────────────────────
# Get value of a var from .env
_get() { grep -E "^${1}=" "$ENV_FILE" | head -1 | cut -d= -f2- || echo ""; }

# Check: variable must be set and non-empty
check_required() {
  local VAR="$1"
  local VAL
  VAL="$(_get "$VAR")"
  if [[ -z "$VAL" ]]; then
    log_error "MISSING:  $VAR"
    ERRORS=$((ERRORS + 1))
  else
    log_ok    "OK:       $VAR"
  fi
}

# Check: variable must match a minimum length (secrets)
check_secret() {
  local VAR="$1"
  local MIN_LEN="${2:-32}"
  local VAL
  VAL="$(_get "$VAR")"
  if [[ -z "$VAL" ]]; then
    log_error "MISSING:  $VAR"
    ERRORS=$((ERRORS + 1))
  elif [[ "${#VAL}" -lt "$MIN_LEN" ]]; then
    log_error "TOO_SHORT: $VAR (min ${MIN_LEN} chars, got ${#VAL})"
    ERRORS=$((ERRORS + 1))
  else
    log_ok    "OK:       $VAR (${#VAL} chars)"
  fi
}

# Check: variable must be a valid URL
check_url() {
  local VAR="$1"
  local VAL
  VAL="$(_get "$VAR")"
  if [[ -z "$VAL" ]]; then
    log_error "MISSING:  $VAR"
    ERRORS=$((ERRORS + 1))
  elif [[ ! "$VAL" =~ ^(https?|mysql|redis):// ]]; then
    log_error "INVALID URL: $VAR = $VAL"
    ERRORS=$((ERRORS + 1))
  else
    log_ok    "OK:       $VAR"
  fi
}

# Check: optional variable (warning only)
check_optional() {
  local VAR="$1"
  local VAL
  VAL="$(_get "$VAR")"
  if [[ -z "$VAL" ]]; then
    log_warn  "OPTIONAL: $VAR (not set)"
    WARNINGS=$((WARNINGS + 1))
  else
    log_ok    "OK:       $VAR"
  fi
}

# ── Required checks ───────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}── Server ──────────────────────────────────────────${RESET}"
check_required "NODE_ENV"
check_required "PORT"
check_url      "APP_URL"

echo ""
echo -e "${BOLD}── JWT ──────────────────────────────────────────────${RESET}"
check_secret   "JWT_SECRET" 32
check_secret   "JWT_REFRESH_SECRET" 32
check_required "JWT_EXPIRES_IN"
check_required "JWT_REFRESH_EXPIRES_IN"

echo ""
echo -e "${BOLD}── Databases ────────────────────────────────────────${RESET}"
check_url "HUB_DATABASE_URL"
check_url "GAME_DATABASE_URL"
check_url "TRADE_DATABASE_URL"
check_url "DATING_DATABASE_URL"
check_url "SPORTS_DATABASE_URL"
check_url "ADMIN_DATABASE_URL"

echo ""
echo -e "${BOLD}── Redis ────────────────────────────────────────────${RESET}"
check_url "REDIS_URL"

echo ""
echo -e "${BOLD}── Security ─────────────────────────────────────────${RESET}"
check_secret "ENCRYPTION_KEY" 32
check_required "CORS_ORIGINS"
check_secret "METRICS_API_KEY" 16

echo ""
echo -e "${BOLD}── Optional (warnings) ──────────────────────────────${RESET}"
check_optional "SMTP_HOST"
check_optional "SMTP_USER"
check_optional "SMTP_PASS"
check_optional "MOMO_PARTNER_CODE"
check_optional "ZALOPAY_APP_ID"
check_optional "VNPAY_TMN_CODE"
check_optional "GSC_API_KEY"
check_optional "GOLDGATE_CLIENT_ID"
check_optional "TCGAMING_MERCHANT_CODE"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────"
if [[ $ERRORS -gt 0 ]]; then
  log_error "FAILED: $ERRORS error(s), $WARNINGS warning(s)"
  echo ""
  exit 1
else
  log_ok    "PASSED: 0 errors, $WARNINGS warning(s)"
  echo ""
fi
