#!/usr/bin/env bash
# =============================================================================
#  backup-db.sh — LKVIP GROUP MySQL Database Backup
#
#  Dumps all 6 MySQL databases, gzips each file, and rotates old backups
#  according to BACKUP_RETENTION_DAYS.
#
#  Usage:
#    bash source/scripts/backup-db.sh [options]
#
#  Options:
#    --dir        <path>   Backup output directory (default: /var/backups/lkvip-db)
#    --retention  <days>   Days to keep backups (default: reads BACKUP_RETENTION_DAYS from .env)
#    --env        <path>   Path to .env (default: /var/www/lkvip/source/backend/.env)
#    --db         <name>   Backup single database only
#
#  Cron example (run by cron-setup.sh):
#    0 2 * * * root bash /var/www/lkvip/source/scripts/backup-db.sh >> /var/log/lkvip-backup.log 2>&1
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

# ── Parse arguments ───────────────────────────────────────────────────────────
BACKUP_DIR="/var/backups/lkvip-db"
ENV_FILE="/var/www/lkvip/source/backend/.env"
SINGLE_DB=""
RETENTION_DAYS=""   # loaded from .env if not passed

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)       BACKUP_DIR="$2";    shift 2 ;;
    --retention) RETENTION_DAYS="$2"; shift 2 ;;
    --env)       ENV_FILE="$2";      shift 2 ;;
    --db)        SINGLE_DB="$2";     shift 2 ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

# ── Load .env variables ───────────────────────────────────────────────────────
check_env_file "$ENV_FILE"

# Extract DB credentials from .env
DB_HOST=$(grep -E '^DB_HOST='     "$ENV_FILE" | head -1 | cut -d= -f2- || echo "127.0.0.1")
DB_PORT=$(grep -E '^DB_PORT='     "$ENV_FILE" | head -1 | cut -d= -f2- || echo "3306")
DB_USER=$(grep -E '^DB_USERNAME=' "$ENV_FILE" | head -1 | cut -d= -f2- || echo "lkvip_db")
DB_PASS=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2- || echo "")

if [[ -z "$RETENTION_DAYS" ]]; then
  RETENTION_DAYS=$(grep -E '^BACKUP_RETENTION_DAYS=' "$ENV_FILE" | head -1 | cut -d= -f2- || echo "30")
fi

require_cmd mysqldump
require_cmd gzip

# ── Prepare output directory ──────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"

# Databases to back up
if [[ -n "$SINGLE_DB" ]]; then
  DBS=("$SINGLE_DB")
else
  DBS=("hub_db" "game_db" "trade_db" "dating_db" "sports_db" "admin_db")
fi

log_header "LKVIP Database Backup"
log_info "Timestamp:  $TIMESTAMP"
log_info "Output dir: $BACKUP_DIR"
log_info "Retention:  ${RETENTION_DAYS} days"
log_info "Databases:  ${DBS[*]}"

# ── Backup loop ───────────────────────────────────────────────────────────────
TOTAL_SIZE=0
FAILED=0

for DB in "${DBS[@]}"; do
  OUTFILE="$BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz"
  log_step "Backing up $DB → $(basename "$OUTFILE")"

  if mysqldump \
      -h "$DB_HOST" \
      -P "$DB_PORT" \
      -u "$DB_USER" \
      -p"$DB_PASS" \
      --single-transaction \
      --routines \
      --triggers \
      --set-gtid-purged=OFF \
      "$DB" 2>/dev/null \
    | gzip -9 > "$OUTFILE"; then

    SIZE=$(du -sh "$OUTFILE" | cut -f1)
    log_ok "$DB → $SIZE"
    TOTAL_SIZE=$((TOTAL_SIZE + $(du -b "$OUTFILE" | cut -f1)))
  else
    log_error "Failed to back up $DB"
    FAILED=$((FAILED + 1))
    rm -f "$OUTFILE"
  fi
done

# ── Rotation: delete backups older than RETENTION_DAYS ───────────────────────
log_step "Rotating backups older than ${RETENTION_DAYS} days"
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
log_ok "Deleted $DELETED expired backup(s)"

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL_HUMAN="$(numfmt --to=iec "$TOTAL_SIZE" 2>/dev/null || echo "${TOTAL_SIZE}B")"
echo ""
log_info "Backup directory: $BACKUP_DIR"
log_info "Files written:    $((${#DBS[@]} - FAILED))"
log_info "Total size:       $TOTAL_HUMAN"

if [[ $FAILED -gt 0 ]]; then
  log_error "$FAILED database(s) failed to back up"
  exit 1
fi

log_ok "Backup complete"
