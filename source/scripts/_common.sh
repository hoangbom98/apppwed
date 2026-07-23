#!/usr/bin/env bash
# =============================================================================
#  _common.sh — LKVIP GROUP shared shell functions
#
#  Source this file in every LKVIP script:
#    source "$(dirname "$0")/_common.sh"
# =============================================================================

# ── Color palette ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Timestamp ─────────────────────────────────────────────────────────────────
_ts() { date '+%Y-%m-%d %H:%M:%S'; }

# ── Logging functions ─────────────────────────────────────────────────────────
log_ok()    { echo -e "${GREEN}✓${RESET}  $(_ts)  $*"; }
log_warn()  { echo -e "${YELLOW}⚠${RESET}  $(_ts)  $*" >&2; }
log_error() { echo -e "${RED}✗${RESET}  $(_ts)  $*" >&2; }
log_info()  { echo -e "${BLUE}ℹ${RESET}  $(_ts)  $*"; }
log_step()  { echo -e "${CYAN}▶${RESET}  $(_ts)  ${BOLD}$*${RESET}"; }
log_header(){ echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════${RESET}"; \
              echo -e "${BOLD}${BLUE}  $*${RESET}"; \
              echo -e "${BOLD}${BLUE}══════════════════════════════════════════${RESET}\n"; }

# ── Guard: must be run as root ────────────────────────────────────────────────
require_root() {
  if [[ "$EUID" -ne 0 ]]; then
    log_error "This script must be run as root (sudo $0)"
    exit 1
  fi
}

# ── Guard: required command must exist ───────────────────────────────────────
require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" &>/dev/null; then
    log_error "Required command not found: $cmd"
    exit 1
  fi
}

# ── Guard: .env file must exist and be non-empty ──────────────────────────────
check_env_file() {
  local env_file="${1:-/var/www/lkvip/source/backend/.env}"
  if [[ ! -f "$env_file" ]]; then
    log_error ".env file not found: $env_file"
    log_info  "Copy .env.example and fill in the values:"
    log_info  "  cp $(dirname "$env_file")/.env.example $env_file"
    exit 1
  fi
  if [[ ! -s "$env_file" ]]; then
    log_error ".env file is empty: $env_file"
    exit 1
  fi
}

# ── Interactive yes/no prompt ─────────────────────────────────────────────────
# Usage: confirm_prompt "Delete all data?" || exit 0
confirm_prompt() {
  local msg="${1:-Are you sure?}"
  local reply
  echo -e "${YELLOW}?${RESET}  $msg [y/N] " >&2
  read -r reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

# ── Load .env into current shell (safe: only KEY=VALUE lines) ─────────────────
load_env() {
  local env_file="${1:-/var/www/lkvip/source/backend/.env}"
  check_env_file "$env_file"
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$env_file" | grep -v '^$' | xargs)
  log_ok "Loaded .env from $env_file"
}

# ── Wait for a TCP port to be accepting connections ───────────────────────────
# Usage: wait_for_port 3306 "MySQL" 30
wait_for_port() {
  local port="$1"
  local name="${2:-service}"
  local timeout="${3:-60}"
  local elapsed=0
  log_info "Waiting for $name on port $port..."
  while ! nc -z 127.0.0.1 "$port" &>/dev/null; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [[ $elapsed -ge $timeout ]]; then
      log_error "Timeout waiting for $name (port $port) after ${timeout}s"
      exit 1
    fi
  done
  log_ok "$name is up on port $port"
}
