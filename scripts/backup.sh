#!/usr/bin/env bash
# =============================================================================
# backup.sh — Automated Database Backup for LKVIP GROUP
#
# Backs up all 6 MySQL databases to /var/LKVIP/.backups/<YYYY-MM-DD>/
# Compresses each dump with gzip, then removes backups older than RETAIN_DAYS.
# Optionally uploads compressed backups to Cloudflare R2 (set ARCHIVE_ENABLED=true).
# Sends a Telegram notification on success or failure.
#
# Schedule via cron (as user lkvip):
#   0 2 * * * bash /var/LKVIP/scripts/backup.sh >> /var/LKVIP/logs/backup.log 2>&1
#
# Manual restore test:
#   bash /var/LKVIP/scripts/backup.sh --restore-test
#   (Creates a temporary DB, restores latest backup, then drops the temp DB)
#
# R2 upload prerequisites (when ARCHIVE_ENABLED=true):
#   apt-get install -y awscli   # or: pip3 install awscli
#   Then set in apps/backend/.env:
#     ARCHIVE_ENABLED=true
#     ARCHIVE_BUCKET=lkvip-backups
#     ARCHIVE_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
#     ARCHIVE_S3_ACCESS_KEY_ID=<R2 Access Key>
#     ARCHIVE_S3_SECRET_ACCESS_KEY=<R2 Secret Key>
#     BACKUP_R2_RETENTION_DAYS=30   (optional, default 30)
#
# Required env vars (loaded from apps/backend/.env if not already set):
#   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD
#   TELEGRAM_BOT_TOKEN, TELEGRAM_ALERT_CHAT_ID  (optional, for notifications)
#
# Usage:
#   sudo -u lkvip bash /var/LKVIP/scripts/backup.sh
#   sudo -u lkvip bash /var/LKVIP/scripts/backup.sh --restore-test
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_BASE="$ROOT_DIR/.backups"
ENV_FILE="$ROOT_DIR/apps/backend/.env"
LOG_FILE="$ROOT_DIR/logs/backup.log"
RETAIN_DAYS=7          # keep backups for 7 days; adjust as needed
TS="$(date +%Y-%m-%d_%H%M%S)"
TODAY="$(date +%Y-%m-%d)"
BACKUP_DIR="$BACKUP_BASE/$TODAY"
RESTORE_TEST=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[backup]${NC} $*"; }
warn()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[backup]${NC} $*"; }
error() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[backup]${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --restore-test) RESTORE_TEST=true ;;
  esac
done

# ── Load env vars if not already set ─────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  # Only load relevant prefixes; never eval the full .env
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^(MYSQL_|TELEGRAM_|DB_|ARCHIVE_|BACKUP_R2_) ]] || continue
    [[ -z "${!key+x}" ]] && export "$key"="${value//\"/}"
  done < <(grep -E '^(MYSQL_|TELEGRAM_|DB_|ARCHIVE_|BACKUP_R2_)' "$ENV_FILE" | sed 's/#.*//' | grep -v '^$')
fi

# ── MySQL connection params ───────────────────────────────────────────────────
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"

# Six LKVIP databases
DATABASES=(
  "lkvip_admin"
  "lkvip_game"
  "lkvip_trade"
  "lkvip_dating"
  "lkvip_sports"
  "lkvip_hub"
)

# ── Telegram notification helper ──────────────────────────────────────────────
telegram_notify() {
  local message="$1"
  local token="${TELEGRAM_BOT_TOKEN:-}"
  local chat="${TELEGRAM_ALERT_CHAT_ID:-}"
  [[ -z "$token" || -z "$chat" ]] && return 0   # skip if not configured
  curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -d chat_id="$chat" \
    -d parse_mode="HTML" \
    -d text="$message" \
    --max-time 10 >/dev/null 2>&1 || true
}

# ── Trap: notify on failure ───────────────────────────────────────────────────
FAILED_DBS=()
trap 'on_exit' EXIT

on_exit() {
  local exit_code=$?
  if [[ $exit_code -ne 0 || ${#FAILED_DBS[@]} -gt 0 ]]; then
    local failed_list="${FAILED_DBS[*]:-unknown}"
    error "Backup completed WITH ERRORS. Failed DBs: $failed_list"
    telegram_notify "🔴 <b>LKVIP Backup FAILED</b> — $(date '+%Y-%m-%d %H:%M:%S')
Failed databases: <code>$failed_list</code>
Server: $(hostname)
Run: <code>pm2 logs lkvip-api --lines 50</code>"
  else
    if [[ "$RESTORE_TEST" != "true" ]]; then
      info "All backups completed successfully."
      telegram_notify "✅ <b>LKVIP Backup OK</b> — $(date '+%Y-%m-%d %H:%M:%S')
Backed up: <code>${#DATABASES[@]} databases</code>
Retained: last ${RETAIN_DAYS} days
Path: <code>$BACKUP_DIR</code>"
    fi
  fi
}

# ── Ensure backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

MYSQL_OPTS="-h$MYSQL_HOST -P$MYSQL_PORT -u$MYSQL_USER"
[[ -n "$MYSQL_PASSWORD" ]] && MYSQL_OPTS="$MYSQL_OPTS -p$MYSQL_PASSWORD"

if [[ "$RESTORE_TEST" == "true" ]]; then
  # ── Restore test mode ─────────────────────────────────────────────────────
  step "Restore test — finding latest backup of lkvip_admin"
  LATEST=$(find "$BACKUP_BASE" -name "lkvip_admin_*.sql.gz" | sort -r | head -1)
  if [[ -z "$LATEST" ]]; then
    error "No backup found for lkvip_admin. Run a normal backup first."
    exit 1
  fi
  info "Latest backup: $LATEST"
  TEST_DB="lkvip_restore_test_$(date +%s)"

  step "Creating temporary test database: $TEST_DB"
  mysql $MYSQL_OPTS -e "CREATE DATABASE \`$TEST_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

  step "Restoring backup into $TEST_DB"
  gunzip -c "$LATEST" | mysql $MYSQL_OPTS "$TEST_DB" 2>/dev/null
  TABLE_COUNT=$(mysql $MYSQL_OPTS -se "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$TEST_DB';" 2>/dev/null || echo 0)

  step "Dropping temporary test database"
  mysql $MYSQL_OPTS -e "DROP DATABASE \`$TEST_DB\`;" 2>/dev/null

  if [[ "$TABLE_COUNT" -gt 0 ]]; then
    info "✅ Restore test PASSED — $TABLE_COUNT tables restored from backup"
    telegram_notify "✅ <b>LKVIP Restore Test PASSED</b> — $(date '+%Y-%m-%d %H:%M:%S')
Database: <code>lkvip_admin</code>
Tables restored: <code>$TABLE_COUNT</code>
Backup file: <code>$(basename "$LATEST")</code>"
  else
    error "Restore test FAILED — 0 tables found after restore"
    telegram_notify "🔴 <b>LKVIP Restore Test FAILED</b> — $(date '+%Y-%m-%d %H:%M:%S')
Backup: <code>$(basename "$LATEST")</code>"
    exit 1
  fi
  exit 0
fi

# ── R2 upload helper ──────────────────────────────────────────────────────────
# Uses the AWS CLI (s3api-compatible) pointed at the Cloudflare R2 endpoint.
# Called once per dump file immediately after a successful mysqldump.
upload_to_r2() {
  local local_file="$1"       # e.g. /var/LKVIP/.backups/2025-07-29/lkvip_admin_…sql.gz
  local r2_key="$2"           # e.g. backups/db/mysql/2025-07-29/lkvip_admin_…sql.gz

  local bucket="${ARCHIVE_BUCKET:-}"
  local endpoint="${ARCHIVE_S3_ENDPOINT:-}"
  local access_key="${ARCHIVE_S3_ACCESS_KEY_ID:-}"
  local secret_key="${ARCHIVE_S3_SECRET_ACCESS_KEY:-}"

  if [[ -z "$bucket" || -z "$endpoint" || -z "$access_key" || -z "$secret_key" ]]; then
    warn "  [R2] ARCHIVE_* vars not set — skipping upload for $(basename "$local_file")"
    return 0
  fi

  if ! command -v aws &>/dev/null; then
    warn "  [R2] aws CLI not found — skipping upload. Install: apt-get install -y awscli"
    return 0
  fi

  AWS_ACCESS_KEY_ID="$access_key" \
  AWS_SECRET_ACCESS_KEY="$secret_key" \
  aws s3 cp "$local_file" "s3://${bucket}/${r2_key}" \
    --endpoint-url "$endpoint" \
    --region "${ARCHIVE_S3_REGION:-auto}" \
    --no-progress \
    --quiet 2>&1 && info "  [R2] ✓ uploaded → ${r2_key}" \
                 || warn "  [R2] ✗ upload failed for $(basename "$local_file")"
}

# ── R2 remote retention cleanup ───────────────────────────────────────────────
# Deletes R2 objects under backups/db/mysql/ older than BACKUP_R2_RETENTION_DAYS.
purge_r2_old_backups() {
  local bucket="${ARCHIVE_BUCKET:-}"
  local endpoint="${ARCHIVE_S3_ENDPOINT:-}"
  local access_key="${ARCHIVE_S3_ACCESS_KEY_ID:-}"
  local secret_key="${ARCHIVE_S3_SECRET_ACCESS_KEY:-}"
  local retention_days="${BACKUP_R2_RETENTION_DAYS:-30}"
  local prefix="backups/db/mysql/"

  [[ -z "$bucket" || -z "$endpoint" || -z "$access_key" || -z "$secret_key" ]] && return 0
  ! command -v aws &>/dev/null && return 0

  local cutoff_ts
  cutoff_ts=$(date -d "-${retention_days} days" +%s 2>/dev/null \
              || date -v "-${retention_days}d" +%s 2>/dev/null)  # Linux / macOS
  [[ -z "$cutoff_ts" ]] && return 0

  step "Purging R2 backups older than ${retention_days} days (prefix: ${prefix})"

  local objects
  objects=$(AWS_ACCESS_KEY_ID="$access_key" \
            AWS_SECRET_ACCESS_KEY="$secret_key" \
            aws s3api list-objects-v2 \
              --bucket "$bucket" \
              --prefix "$prefix" \
              --endpoint-url "$endpoint" \
              --region "${ARCHIVE_S3_REGION:-auto}" \
              --query 'Contents[].{Key:Key,LastModified:LastModified}' \
              --output text 2>/dev/null || true)

  local deleted_count=0
  while IFS=$'\t' read -r key last_modified; do
    [[ -z "$key" ]] && continue
    local obj_ts
    obj_ts=$(date -d "$last_modified" +%s 2>/dev/null \
             || date -j -f "%Y-%m-%dT%H:%M:%S" "${last_modified%%.*}" +%s 2>/dev/null || echo 0)
    if [[ "$obj_ts" -lt "$cutoff_ts" ]]; then
      AWS_ACCESS_KEY_ID="$access_key" \
      AWS_SECRET_ACCESS_KEY="$secret_key" \
      aws s3api delete-object \
        --bucket "$bucket" \
        --key "$key" \
        --endpoint-url "$endpoint" \
        --region "${ARCHIVE_S3_REGION:-auto}" \
        --quiet 2>/dev/null && warn "  [R2] removed old backup: $key" \
                             || warn "  [R2] failed to remove: $key"
      (( deleted_count++ )) || true
    fi
  done <<< "$objects"

  info "[R2] Remote purge done — ${deleted_count} object(s) removed."
}

# ── Normal backup mode ────────────────────────────────────────────────────────
step "Starting backup — $TS"
info "Target directory: $BACKUP_DIR"
ARCHIVE_ENABLED="${ARCHIVE_ENABLED:-false}"
[[ "$ARCHIVE_ENABLED" == "true" ]] && info "[R2] Upload enabled — bucket: ${ARCHIVE_BUCKET:-<not set>}"

TOTAL_SIZE=0

for DB in "${DATABASES[@]}"; do
  DUMP_FILE="$BACKUP_DIR/${DB}_${TS}.sql.gz"
  info "Backing up: $DB → $(basename "$DUMP_FILE")"

  if mysqldump $MYSQL_OPTS \
      --single-transaction \
      --routines \
      --triggers \
      --skip-lock-tables \
      "$DB" 2>/dev/null | gzip -9 > "$DUMP_FILE"; then
    FILE_SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
    info "  ✓ $DB — $FILE_SIZE"

    # ── Upload to R2 immediately after successful dump ──────────────────────
    if [[ "$ARCHIVE_ENABLED" == "true" ]]; then
      R2_KEY="backups/db/mysql/${TODAY}/$(basename "$DUMP_FILE")"
      upload_to_r2 "$DUMP_FILE" "$R2_KEY"
    fi
  else
    error "  ✗ $DB — dump FAILED"
    FAILED_DBS+=("$DB")
    rm -f "$DUMP_FILE"
  fi
done

# ── Purge old local backups ───────────────────────────────────────────────────
step "Purging local backups older than $RETAIN_DAYS days"
DELETED=$(find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d -mtime "+$RETAIN_DAYS" -print)
if [[ -n "$DELETED" ]]; then
  echo "$DELETED" | while read -r old_dir; do
    warn "  Removing old local backup: $(basename "$old_dir")"
    rm -rf "$old_dir"
  done
else
  info "  No old local backups to remove."
fi

# ── Purge old remote backups on R2 ───────────────────────────────────────────
if [[ "$ARCHIVE_ENABLED" == "true" ]]; then
  purge_r2_old_backups
fi

# ── Summary ───────────────────────────────────────────────────────────────────
KEPT=$(find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d | wc -l)
info "Local backup directories retained: $KEPT"

if [[ ${#FAILED_DBS[@]} -gt 0 ]]; then
  exit 1
fi
