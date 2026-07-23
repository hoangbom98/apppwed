#!/usr/bin/env bash
# =============================================================================
#  cron-setup.sh — LKVIP GROUP OS-level Cron Setup
#
#  Installs crontab entries for:
#    - Daily database backups (02:00 AM) — run as lkvip-admin
#    - Weekly log rotation (03:00 AM Sunday)
#    - Certbot auto-renewal check (03:00 AM daily via systemd or cron fallback)
#
#  Usage:
#    sudo bash source/scripts/cron-setup.sh [options]
#
#  Options:
#    --backup-dir   <path>   Backup output directory (default: /var/backups/lkvip-db)
#    --log-dir      <path>   Log output directory (default: /var/log/lkvip)
#    --user         <name>   OS user who owns the backup cron (default: lkvip-admin)
#    --list                  List current LKVIP cron jobs and exit
#    --remove                Remove all LKVIP cron entries
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

require_root

# ── Arguments ─────────────────────────────────────────────────────────────────
BACKUP_DIR="/var/backups/lkvip-db"
LOG_DIR="/var/log/lkvip"
CRON_USER="lkvip-admin"
LIST_ONLY=false
REMOVE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir) BACKUP_DIR="$2"; shift 2 ;;
    --log-dir)    LOG_DIR="$2";    shift 2 ;;
    --user)       CRON_USER="$2";  shift 2 ;;
    --list)       LIST_ONLY=true;  shift ;;
    --remove)     REMOVE=true;     shift ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

SCRIPTS_DIR="/var/www/lkvip/source/scripts"
BACKUP_LOG="$LOG_DIR/backup.log"

# ── List mode ─────────────────────────────────────────────────────────────────
if [[ "$LIST_ONLY" == true ]]; then
  log_info "current LKVIP cron jobs:"
  crontab -u "$CRON_USER" -l 2>/dev/null | grep -E "lkvip" || echo "  (none found)"
  exit 0
fi

# ── Remove mode ───────────────────────────────────────────────────────────────
if [[ "$REMOVE" == true ]]; then
  log_warn "Removing all LKVIP cron entries for user: $CRON_USER"
  (crontab -u "$CRON_USER" -l 2>/dev/null | grep -v -E "lkvip") | crontab -u "$CRON_USER" -
  log_ok "LKVIP cron entries removed"
  exit 0
fi

# ── Setup ─────────────────────────────────────────────────────────────────────
log_header "LKVIP GROUP — Cron Setup"

# Validate that the cron user exists on this system
if ! id "$CRON_USER" &>/dev/null; then
  log_error "OS user '$CRON_USER' does not exist. Run setup.sh first, then re-run this script."
  exit 1
fi

mkdir -p "$BACKUP_DIR" "$LOG_DIR"
chmod 750 "$BACKUP_DIR" "$LOG_DIR"
# Grant ownership of backup/log dirs to the cron user
chown "$CRON_USER":"$CRON_USER" "$BACKUP_DIR" "$LOG_DIR"

# Get current crontab (ignore error if empty)
EXISTING_CRON="$(crontab -u "$CRON_USER" -l 2>/dev/null || true)"

# ── Define cron jobs ──────────────────────────────────────────────────────────
# Format: "schedule" "label" "command"

LKVIP_JOBS=(
  "0 2 * * *|lkvip-db-backup|bash $SCRIPTS_DIR/backup-db.sh --dir $BACKUP_DIR >> $BACKUP_LOG 2>&1"
  "0 3 * * *|lkvip-certbot-renew|certbot renew --quiet --post-hook 'systemctl reload nginx' >> $LOG_DIR/certbot.log 2>&1"
  "30 3 * * 0|lkvip-log-rotate|find $LOG_DIR -name '*.log' -mtime +30 -delete"
)

# ── Install each job (skip if already present) ───────────────────────────────
NEW_CRON="$EXISTING_CRON"
INSTALLED=0
SKIPPED=0

for JOB_DEF in "${LKVIP_JOBS[@]}"; do
  SCHEDULE="$(echo "$JOB_DEF" | cut -d'|' -f1)"
  LABEL="$(echo "$JOB_DEF" | cut -d'|' -f2)"
  CMD="$(echo "$JOB_DEF" | cut -d'|' -f3)"

  CRON_LINE="$SCHEDULE    $CMD    # $LABEL"

  if echo "$EXISTING_CRON" | grep -q "$LABEL"; then
    log_info "SKIP (already exists): $LABEL"
    SKIPPED=$((SKIPPED + 1))
  else
    NEW_CRON="${NEW_CRON}"$'\n'"$CRON_LINE"
    log_ok "ADDED: $LABEL ($SCHEDULE)"
    INSTALLED=$((INSTALLED + 1))
  fi
done

# Write updated crontab
printf '%s\n' "$NEW_CRON" | crontab -u "$CRON_USER" -
log_ok "Crontab updated for user: $CRON_USER"

# ── Summary ───────────────────────────────────────────────────────────────────
log_header "Cron Setup Complete"
echo -e "  Jobs installed: ${GREEN}$INSTALLED${RESET}"
echo -e "  Jobs skipped:   ${YELLOW}$SKIPPED${RESET} (already existed)"
echo ""
log_info "View jobs:    crontab -u $CRON_USER -l"
log_info "Backup logs:  tail -f $BACKUP_LOG"
log_info "Remove jobs:  sudo bash $SCRIPTS_DIR/cron-setup.sh --remove"
