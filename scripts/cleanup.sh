#!/usr/bin/env bash
# =============================================================================
# cleanup.sh — Automated disk cleanup for LKVIP GROUP
#
# Chạy hàng ngày lúc 03:00 AM (sau backup.sh lúc 02:00):
#   0 3 * * * bash /var/LKVIP/scripts/cleanup.sh >> /var/LKVIP/data/logs/cleanup.log 2>&1
#
# Công việc thực hiện:
#   1. Xóa Winston app logs cũ hơn LOG_RETAIN_DAYS (default: 7)
#   2. Xóa Nginx access/error logs cũ hơn 7 ngày
#   3. Xóa PM2 log files cũ hơn 7 ngày
#   4. Xóa local MySQL backup dirs cũ hơn BACKUP_RETAIN_DAYS (default: 3)
#   5. Xóa upload temp files cũ hơn UPLOAD_RETAIN_HOURS (default: 24)
#   6. pnpm store prune (xóa packages không còn dùng)
#   7. pm2 flush (clear PM2 in-memory log buffer)
#   8. Gửi Telegram alert nếu disk usage vượt DISK_WARN_PCT (default: 80%)
#
# Usage:
#   sudo -u lkvip bash /var/LKVIP/scripts/cleanup.sh
#   bash /var/LKVIP/scripts/cleanup.sh --dry-run   # chỉ hiện sẽ xóa gì
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/backend/.env"
LOG_DIR="$ROOT_DIR/data/logs"
UPLOAD_DIR="$ROOT_DIR/data/uploads"
BACKUP_BASE="$ROOT_DIR/.backups"

LOG_RETAIN_DAYS="${LOG_RETAIN_DAYS:-7}"
BACKUP_RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-3}"
UPLOAD_RETAIN_HOURS="${UPLOAD_RETAIN_HOURS:-24}"
DISK_WARN_PCT="${DISK_WARN_PCT:-80}"
DRY_RUN=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[cleanup]${NC} $*"; }
warn()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[cleanup]${NC} $*"; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }
dry()   { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${CYAN}[dry-run]${NC} would delete: $*"; }

# ── Parse args ────────────────────────────────────────────────────────────────
for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]] && DRY_RUN=true
done

# ── Load Telegram vars từ .env ────────────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^TELEGRAM_ ]] || continue
    [[ -z "${!key+x}" ]] && export "$key"="${value//\"/}"
  done < <(grep -E '^TELEGRAM_' "$ENV_FILE" | sed 's/#.*//' | grep -v '^$')
fi

telegram_notify() {
  local message="$1"
  local token="${TELEGRAM_BOT_TOKEN:-}"
  local chat="${TELEGRAM_ADMIN_CHAT_ID:-}"
  [[ -z "$token" || -z "$chat" ]] && return 0
  curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -d chat_id="$chat" \
    -d parse_mode="HTML" \
    -d text="$message" \
    --max-time 10 >/dev/null 2>&1 || true
}

safe_delete() {
  local target="$1"
  if [[ "$DRY_RUN" == "true" ]]; then
    dry "$target"
  else
    rm -rf "$target"
  fi
}

# ── 1. Winston app logs ───────────────────────────────────────────────────────
step "1. App logs older than ${LOG_RETAIN_DAYS} days"
if [[ -d "$LOG_DIR" ]]; then
  count=0
  while IFS= read -r -d '' file; do
    safe_delete "$file"
    (( count++ )) || true
  done < <(find "$LOG_DIR" -name "*.log" -mtime "+${LOG_RETAIN_DAYS}" -print0 2>/dev/null)
  info "Removed $count app log file(s)"
else
  warn "Log dir not found: $LOG_DIR"
fi

# ── 2. Nginx logs ─────────────────────────────────────────────────────────────
step "2. Nginx logs older than 7 days"
count=0
while IFS= read -r -d '' file; do
  safe_delete "$file"
  (( count++ )) || true
done < <(find /var/log/nginx -name "*.log*" -mtime "+7" -print0 2>/dev/null)
info "Removed $count Nginx log file(s)"

# ── 3. PM2 log files ─────────────────────────────────────────────────────────
step "3. PM2 logs older than ${LOG_RETAIN_DAYS} days"
count=0
while IFS= read -r -d '' file; do
  safe_delete "$file"
  (( count++ )) || true
done < <(find "$HOME/.pm2/logs" -name "*.log" -mtime "+${LOG_RETAIN_DAYS}" -print0 2>/dev/null)
info "Removed $count PM2 log file(s)"

if [[ "$DRY_RUN" == "false" ]]; then
  pm2 flush >/dev/null 2>&1 && info "pm2 flush: in-memory log buffer cleared" || true
fi

# ── 4. Local MySQL backup dirs ────────────────────────────────────────────────
step "4. Local backup dirs older than ${BACKUP_RETAIN_DAYS} days"
if [[ -d "$BACKUP_BASE" ]]; then
  count=0
  while IFS= read -r -d '' dir; do
    warn "  removing: $(basename "$dir")"
    safe_delete "$dir"
    (( count++ )) || true
  done < <(find "$BACKUP_BASE" -mindepth 1 -maxdepth 1 -type d -mtime "+${BACKUP_RETAIN_DAYS}" -print0 2>/dev/null)
  info "Removed $count local backup dir(s)"
else
  info "Backup dir not found — skipping"
fi

# ── 5. Upload temp files ──────────────────────────────────────────────────────
step "5. Temp upload files older than ${UPLOAD_RETAIN_HOURS} hours"
if [[ -d "$UPLOAD_DIR" ]]; then
  count=0
  while IFS= read -r -d '' file; do
    safe_delete "$file"
    (( count++ )) || true
  done < <(find "$UPLOAD_DIR" -type f -mmin "+$((UPLOAD_RETAIN_HOURS * 60))" -print0 2>/dev/null)
  info "Removed $count temp upload file(s)"
else
  info "Upload dir not found — skipping"
fi

# ── 6. pnpm store prune ───────────────────────────────────────────────────────
step "6. pnpm store prune"
if [[ "$DRY_RUN" == "false" ]] && command -v pnpm &>/dev/null; then
  cd "$ROOT_DIR"
  pnpm store prune --force 2>&1 | tail -3 || true
  info "pnpm store pruned"
elif [[ "$DRY_RUN" == "true" ]]; then
  info "[dry-run] would run: pnpm store prune"
fi

# ── 7. Disk usage check + alert ───────────────────────────────────────────────
step "7. Disk usage check"
disk_pct=$(df -h / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
disk_avail=$(df -h / | awk 'NR==2 {print $4}')
info "Disk usage: ${disk_pct}%  |  Available: ${disk_avail}"

if [[ "$disk_pct" -ge "$DISK_WARN_PCT" ]]; then
  warn "⚠️  Disk usage ${disk_pct}% exceeds warning threshold ${DISK_WARN_PCT}%"
  telegram_notify "⚠️ <b>LKVIP Disk Warning</b> — $(date '+%Y-%m-%d %H:%M')
Disk usage: <b>${disk_pct}%</b> (available: ${disk_avail})
Server: <code>$(hostname)</code>
Action: check <code>df -h /</code> and consider cleanup or disk expansion."
fi

info "Cleanup complete."
