#!/usr/bin/env bash
# =============================================================================
# health-check.sh — Service health monitoring for LKVIP GROUP
#
# Chạy mỗi 5 phút qua cron:
#   */5 * * * * bash /var/LKVIP/scripts/health-check.sh >> /var/LKVIP/data/logs/health.log 2>&1
#
# Kiểm tra:
#   - API backend /health endpoint
#   - MySQL connectivity
#   - Redis connectivity
#   - PM2 process status
#   - Disk usage (warn > 80%, critical > 90%)
#   - RAM usage (warn > 85%)
#   - Nginx process
#
# Alert: Telegram Bot (TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID trong .env)
# Cooldown: 30 phút giữa các alert cùng loại (tránh spam)
#
# Usage:
#   bash /var/LKVIP/scripts/health-check.sh
#   bash /var/LKVIP/scripts/health-check.sh --verbose
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/apps/backend/.env"
LOG_DIR="$ROOT_DIR/data/logs"
COOLDOWN_DIR="$ROOT_DIR/data/.health-cooldown"   # stores last-alert timestamps
mkdir -p "$LOG_DIR" "$COOLDOWN_DIR"

# ── Config ────────────────────────────────────────────────────────────────────
API_URL="${API_URL:-http://127.0.0.1:5000}"
DISK_WARN_PCT="${DISK_WARN_PCT:-80}"
DISK_CRIT_PCT="${DISK_CRIT_PCT:-90}"
RAM_WARN_PCT="${RAM_WARN_PCT:-85}"
COOLDOWN_MINUTES="${COOLDOWN_MINUTES:-30}"       # min minutes between same alert
VERBOSE=false

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()    { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[OK]${NC}    $*"; }
fail()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[FAIL]${NC}  $*"; }
warn()  { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[WARN]${NC}  $*"; }
info()  { [[ "$VERBOSE" == "true" ]] && echo -e "$(date '+%Y-%m-%d %H:%M:%S') [INFO]  $*" || true; }

for arg in "$@"; do [[ "$arg" == "--verbose" ]] && VERBOSE=true; done

# ── Load .env (Telegram + DB creds) ──────────────────────────────────────────
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^(TELEGRAM_|REDIS_|DB_|MYSQL_) ]] || continue
    [[ -z "${!key+x}" ]] && export "$key"="${value//\"/}"
  done < <(grep -E '^(TELEGRAM_|REDIS_|DB_|MYSQL_)' "$ENV_FILE" | sed 's/#.*//' | grep -v '^$')
fi

# ── Cooldown helper ───────────────────────────────────────────────────────────
# Returns 0 (allow) if last alert for this key was > COOLDOWN_MINUTES ago
can_alert() {
  local key="$1"
  local stamp_file="$COOLDOWN_DIR/${key}.ts"
  local now
  now=$(date +%s)
  if [[ -f "$stamp_file" ]]; then
    local last
    last=$(cat "$stamp_file")
    local elapsed=$(( (now - last) / 60 ))
    [[ "$elapsed" -lt "$COOLDOWN_MINUTES" ]] && return 1
  fi
  echo "$now" > "$stamp_file"
  return 0
}

# ── Telegram notify ───────────────────────────────────────────────────────────
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

alert() {
  local key="$1"
  local message="$2"
  fail "$message"
  if can_alert "$key"; then
    telegram_notify "🔴 <b>LKVIP Alert</b> — $(date '+%Y-%m-%d %H:%M')
${message}
Server: <code>$(hostname)</code>"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

ISSUES=0

# ── 1. API health endpoint ─────────────────────────────────────────────────────
http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${API_URL}/health" 2>/dev/null || echo "000")
if [[ "$http_status" == "200" ]]; then
  ok "API /health → HTTP ${http_status}"
else
  alert "api_down" "API backend DOWN (${API_URL}/health → HTTP ${http_status})
Fix: <code>pm2 restart lkvip-api</code>"
  (( ISSUES++ )) || true
fi

# ── 2. PM2 process ────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null; then
  pm2_status=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
api = [p for p in procs if p.get('name') == 'lkvip-api']
if not api:
    print('NOT_FOUND')
else:
    statuses = [p.get('pm2_env', {}).get('status', '') for p in api]
    bad = [s for s in statuses if s != 'online']
    print('DEGRADED:' + ','.join(bad) if bad else 'OK:' + str(len(api)) + ' online')
" 2>/dev/null || echo "ERROR")

  if [[ "$pm2_status" == NOT_FOUND* || "$pm2_status" == DEGRADED* || "$pm2_status" == ERROR* ]]; then
    alert "pm2_down" "PM2 lkvip-api process issue: <code>${pm2_status}</code>
Fix: <code>pm2 restart lkvip-api</code> or <code>pm2 start config/pm2/ecosystem.config.js --env production</code>"
    (( ISSUES++ )) || true
  else
    ok "PM2 lkvip-api → ${pm2_status}"
  fi
fi

# ── 3. MySQL ──────────────────────────────────────────────────────────────────
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${DB_USERNAME:-root}"
MYSQL_PASS="${DB_PASSWORD:-}"

mysql_ok=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" \
  ${MYSQL_PASS:+-p"$MYSQL_PASS"} \
  -e "SELECT 1;" 2>/dev/null | grep -c "1" || echo "0")

if [[ "$mysql_ok" -ge 1 ]]; then
  ok "MySQL → connected"
else
  alert "mysql_down" "MySQL is DOWN or unreachable
Fix: <code>sudo systemctl restart mysql</code>"
  (( ISSUES++ )) || true
fi

# ── 4. Redis ──────────────────────────────────────────────────────────────────
REDIS_URL_ENV="${REDIS_URL:-redis://127.0.0.1:6379}"
REDIS_HOST=$(echo "$REDIS_URL_ENV" | sed 's|.*@||;s|redis://||;s|:.*||')
REDIS_PORT=$(echo "$REDIS_URL_ENV" | sed 's|.*:||;s|/.*||')
REDIS_PASS=$(echo "$REDIS_URL_ENV" | grep -oP '(?<=:)[^@]+(?=@)' || true)

redis_ping=$(redis-cli -h "${REDIS_HOST:-127.0.0.1}" -p "${REDIS_PORT:-6379}" \
  ${REDIS_PASS:+-a "$REDIS_PASS"} \
  --no-auth-warning PING 2>/dev/null || echo "FAILED")

if [[ "$redis_ping" == "PONG" ]]; then
  ok "Redis → PONG"
else
  alert "redis_down" "Redis is DOWN (got: <code>${redis_ping}</code>)
Fix: <code>sudo systemctl restart redis-server</code>"
  (( ISSUES++ )) || true
fi

# ── 5. Nginx ──────────────────────────────────────────────────────────────────
if systemctl is-active --quiet nginx 2>/dev/null; then
  ok "Nginx → running"
else
  alert "nginx_down" "Nginx is NOT running
Fix: <code>sudo systemctl start nginx</code>"
  (( ISSUES++ )) || true
fi

# ── 6. Disk usage ─────────────────────────────────────────────────────────────
disk_pct=$(df / | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
disk_avail=$(df -h / | awk 'NR==2 {print $4}')
info "Disk: ${disk_pct}% used, ${disk_avail} available"

if [[ "$disk_pct" -ge "$DISK_CRIT_PCT" ]]; then
  alert "disk_critical" "⚠️ CRITICAL Disk usage: <b>${disk_pct}%</b> (${disk_avail} left)
Actions:
• <code>bash /var/LKVIP/scripts/cleanup.sh</code>
• <code>du -sh /var/LKVIP/* | sort -rh | head -10</code>"
  (( ISSUES++ )) || true
elif [[ "$disk_pct" -ge "$DISK_WARN_PCT" ]]; then
  if can_alert "disk_warn"; then
    warn "Disk usage ${disk_pct}% exceeds warn threshold ${DISK_WARN_PCT}%"
    telegram_notify "⚠️ <b>LKVIP Disk Warning</b> — $(date '+%Y-%m-%d %H:%M')
Disk: <b>${disk_pct}%</b> used (${disk_avail} available)
Run: <code>bash /var/LKVIP/scripts/cleanup.sh</code>"
  fi
else
  ok "Disk → ${disk_pct}% used (${disk_avail} available)"
fi

# ── 7. RAM usage ──────────────────────────────────────────────────────────────
ram_total=$(free -m | awk 'NR==2 {print $2}')
ram_used=$(free -m  | awk 'NR==2 {print $3}')
ram_avail=$(free -m | awk 'NR==2 {print $7}')
ram_pct=$(( ram_used * 100 / ram_total ))
info "RAM: ${ram_pct}% used (${ram_used}MB / ${ram_total}MB, ${ram_avail}MB available)"

if [[ "$ram_pct" -ge "$RAM_WARN_PCT" ]]; then
  alert "ram_high" "⚠️ High RAM usage: <b>${ram_pct}%</b> (${ram_avail}MB free)
Check: <code>pm2 monit</code> or <code>free -h</code>
Top consumers: <code>ps aux --sort=-%mem | head -8</code>"
  (( ISSUES++ )) || true
else
  ok "RAM → ${ram_pct}% used (${ram_avail}MB free)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ "$ISSUES" -gt 0 ]]; then
  fail "Health check complete — ${ISSUES} issue(s) detected"
  exit 1
else
  ok "All checks passed ($(date '+%H:%M:%S'))"
fi
