#!/usr/bin/env bash
# =============================================================================
# vps-setup.sh — First-time VPS isolation setup for LKVIP GROUP
#
# Run as root ONCE on a fresh Ubuntu 22.04 VPS (104.248.146.203).
# Creates a dedicated system user (lkvip), directory structure, MySQL
# databases, Redis isolation, firewall rules, and PM2 startup entry —
# all ISOLATED from any other project already on the server (e.g. BoYue).
#
# Isolation summary:
#   User     : lkvip  (separate from www-data / boyue)
#   Root dir : /var/LKVIP  (never touches /var/www)
#   API port : 5000 on 127.0.0.1 ONLY (Nginx proxies :80/:443)
#   MySQL    : shared service, but isolated databases + dedicated DB user
#   Redis    : shared service, DB index 2 (index 0=system, 1=boyue → 2=lkvip)
#   Nginx    : separate config file: /etc/nginx/sites-enabled/tc-gaming
#   PM2      : process name "lkvip-api" — won't collide with other PM2 apps
#   Logs     : /var/LKVIP/logs/ only
#   Cron     : crontab -u lkvip (separate from other users)
#
# Usage:
#   sudo bash scripts/vps-setup.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn()  { echo -e "${YELLOW}[setup]${NC} $*"; }
error() { echo -e "${RED}[setup]${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# ── Must run as root ──────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  error "Run as root: sudo bash scripts/vps-setup.sh"
  exit 1
fi

# ── Parse flags ───────────────────────────────────────────────────────────────
# Must be declared BEFORE set -u so ${DRY_RUN:-false} never triggers "unbound variable"
DRY_RUN=false
for _arg in "$@"; do
  [[ "$_arg" == "--dry-run" ]] && DRY_RUN=true
done
unset _arg

LKVIP_USER="lkvip"
LKVIP_HOME="/home/lkvip"          # Linux home dir for useradd -m
LKVIP_DIR="/var/LKVIP"            # project root — NOT the home dir
MYSQL_DB_PASS="${MYSQL_LKVIP_PASS:-$(openssl rand -base64 20 | tr -dc 'A-Za-z0-9' | head -c 20)}"

# =============================================================================
step "1 — System packages"
# =============================================================================
apt-get update -qq
apt-get install -y --no-install-recommends \
  nginx curl git dnsutils mysql-client redis-tools ufw awscli \
  certbot python3-certbot-nginx \
  build-essential

info "System packages installed"

# =============================================================================
step "1.5 — Swap file (4 GB) — safety net for 8 GB VPS"
# =============================================================================
# Swap bảo vệ khỏi OOM killer khi spike load ngắn (backup, build, traffic burst).
# 4 GB swap trên SSD có latency ~0.1ms — đủ an toàn.
# swappiness=10: chỉ dùng swap khi RAM còn < 10% free (không dùng proactively).
SWAP_FILE="/swapfile"
SWAP_SIZE_GB=4

if swapon --show | grep -q "$SWAP_FILE"; then
  info "Swap already active at $SWAP_FILE — skipping"
else
  if [[ "$DRY_RUN" == "true" ]]; then
    info "[dry-run] would create ${SWAP_SIZE_GB} GB swap at $SWAP_FILE"
  else
    info "Creating ${SWAP_SIZE_GB} GB swap at $SWAP_FILE..."

    # fallocate is instant on ext4/xfs; fallback to dd for btrfs/zfs
    if fallocate -l "${SWAP_SIZE_GB}G" "$SWAP_FILE" 2>/dev/null; then
      info "  fallocate: OK"
    else
      warn "  fallocate failed (btrfs?), using dd — may take a moment..."
      dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$(( SWAP_SIZE_GB * 1024 )) status=none
    fi

    chmod 600 "$SWAP_FILE"
    mkswap -q "$SWAP_FILE"
    swapon "$SWAP_FILE"
    info "  swap enabled: $(swapon --show --noheadings | grep "$SWAP_FILE")"

    # ── Persist swap across reboots ──────────────────────────────────────────
    if ! grep -qF "$SWAP_FILE" /etc/fstab; then
      echo "$SWAP_FILE  none  swap  sw  0  0" >> /etc/fstab
      info "  fstab: swap entry added"
    fi

    # ── vm.swappiness = 10 ───────────────────────────────────────────────────
    # Kernel prefers RAM; uses swap only when free RAM < 10%.
    sysctl -w vm.swappiness=10 >/dev/null
    if grep -q '^vm\.swappiness' /etc/sysctl.conf 2>/dev/null; then
      sed -i 's/^vm\.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
    else
      echo 'vm.swappiness=10' >> /etc/sysctl.conf
    fi
    info "  vm.swappiness=10 set"

    # ── vm.vfs_cache_pressure = 50 ───────────────────────────────────────────
    # Default 100 = aggressively reclaim dentry/inode cache.
    # 50 = keep dir/inode cache in RAM longer → fewer stat() calls from Nginx.
    sysctl -w vm.vfs_cache_pressure=50 >/dev/null
    if grep -q '^vm\.vfs_cache_pressure' /etc/sysctl.conf 2>/dev/null; then
      sed -i 's/^vm\.vfs_cache_pressure=.*/vm.vfs_cache_pressure=50/' /etc/sysctl.conf
    else
      echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    fi
    info "  vm.vfs_cache_pressure=50 set"

    # ── Disable Transparent Huge Pages (THP) ─────────────────────────────────
    # THP causes Redis latency spikes (memory compaction stalls).
    # Disable immediately and persist via a dedicated systemd service
    # (rc.local is not reliable on Ubuntu 22.04 with systemd).
    for _thp_path in \
      /sys/kernel/mm/transparent_hugepage/enabled \
      /sys/kernel/mm/transparent_hugepage/defrag; do
      [[ -f "$_thp_path" ]] && echo never > "$_thp_path" && \
        info "  THP disabled: $_thp_path"
    done
    unset _thp_path

    # Persist THP disable via systemd one-shot service (Ubuntu 22.04 compatible)
    if [[ ! -f /etc/systemd/system/disable-thp.service ]]; then
      cat > /etc/systemd/system/disable-thp.service <<'SYSTEMD_SVC'
[Unit]
Description=Disable Transparent Huge Pages (THP) — required for Redis
DefaultDependencies=no
After=sysinit.target local-fs.target
Before=redis-server.service mysql.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/sh -c \
  "echo never > /sys/kernel/mm/transparent_hugepage/enabled; \
   echo never > /sys/kernel/mm/transparent_hugepage/defrag"

[Install]
WantedBy=basic.target
SYSTEMD_SVC
      systemctl daemon-reload
      systemctl enable --now disable-thp.service
      info "  THP: systemd service installed and enabled"
    else
      info "  THP: disable-thp.service already exists — skipping"
    fi

    # Show final memory layout
    echo ""
    free -h
    swapon --show
    echo ""
    info "✓ Swap ${SWAP_SIZE_GB} GB created and active (vm.swappiness=10, THP disabled)"
  fi
fi

# =============================================================================
step "1.6 — Disable unused services (free RAM + reduce attack surface)"
# =============================================================================
# Each name must be a bare service name (no inline comments inside the array).
UNUSED_SERVICES=(
  apache2
  snapd
  multipathd
  unattended-upgrades
  avahi-daemon
  bluetooth
  cups
  ModemManager
)
# What each one is (for the log output):
declare -A SVC_DESC=(
  [apache2]="Web server — conflicts with Nginx on port 80/443"
  [snapd]="Snap daemon — ~100 MB RAM, not needed on VPS"
  [multipathd]="SAN/iSCSI multipath — irrelevant on cloud VPS"
  [unattended-upgrades]="Auto-upgrade daemon — can grab apt lock during deploys"
  [avahi-daemon]="mDNS/Bonjour — not needed on headless server"
  [bluetooth]="Bluetooth — no hardware on VPS"
  [cups]="Print spooler — not needed"
  [ModemManager]="Mobile modem manager — not needed"
)

for svc in "${UNUSED_SERVICES[@]}"; do
  # Check if the unit file exists at all (avoid 'failed to disable' noise)
  if systemctl list-unit-files --type=service 2>/dev/null | grep -q "^${svc}\.service"; then
    _desc="${SVC_DESC[$svc]:-}"
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
      systemctl stop "$svc" 2>/dev/null || true
      warn "  stopped : $svc  (${_desc})"
    fi
    systemctl disable --now "$svc" 2>/dev/null || true
    info "  disabled: $svc  (${_desc})"
  else
    info "  not installed: $svc — skip"
  fi
done
unset svc _desc
info "Unused services step complete"

# =============================================================================
step "2 — Dedicated system user: $LKVIP_USER"
# =============================================================================
if id "$LKVIP_USER" &>/dev/null; then
  warn "User '$LKVIP_USER' already exists — skipping creation"
else
  useradd -m -s /bin/bash "$LKVIP_USER"
  info "Created user: $LKVIP_USER"
fi

# =============================================================================
step "3 — Directory structure under $LKVIP_DIR"
# =============================================================================
# All project files live here — never under /var/www (BoYue territory)
mkdir -p \
  "$LKVIP_DIR/apps/backend/dist" \
  "$LKVIP_DIR/apps/hub/dist" \
  "$LKVIP_DIR/apps/game/dist" \
  "$LKVIP_DIR/apps/trading/dist" \
  "$LKVIP_DIR/apps/dating/dist" \
  "$LKVIP_DIR/apps/sports/dist" \
  "$LKVIP_DIR/apps/admin-dashboard/dist" \
  "$LKVIP_DIR/data/logs" \
  "$LKVIP_DIR/data/uploads" \
  "$LKVIP_DIR/data/.health-cooldown" \
  "$LKVIP_DIR/data/backups" \
  "$LKVIP_DIR/.backups" \
  "$LKVIP_DIR/config"

chown -R "$LKVIP_USER:$LKVIP_USER" "$LKVIP_DIR"
chmod 750 "$LKVIP_DIR"
# .health-cooldown: only lkvip user (health-check.sh writes timestamps there)
chmod 700 "$LKVIP_DIR/data/.health-cooldown"
info "Directories created and owned by $LKVIP_USER"

# =============================================================================
step "4 — Node.js 20 + pnpm + PM2 (system-wide)"
# =============================================================================
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  info "Node.js $(node -v) installed"
else
  info "Node.js $(node -v) already present"
fi

if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm@9
  info "pnpm $(pnpm -v) installed"
fi

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
  info "PM2 $(pm2 -v) installed"
fi

# =============================================================================
step "5 — MySQL: isolated databases + dedicated user"
# =============================================================================
if command -v mysql &>/dev/null && mysql -u root -e "SELECT 1" &>/dev/null 2>&1; then
  mysql -u root <<SQL
-- Databases (one per sub-project — never shared with BoYue)
CREATE DATABASE IF NOT EXISTS hub_db     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS admin_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dedicated DB user — only has access to lkvip databases
CREATE USER IF NOT EXISTS 'lkvip'@'localhost' IDENTIFIED BY '${MYSQL_DB_PASS}';
GRANT ALL PRIVILEGES ON hub_db.*    TO 'lkvip'@'localhost';
GRANT ALL PRIVILEGES ON game_db.*   TO 'lkvip'@'localhost';
GRANT ALL PRIVILEGES ON trade_db.*  TO 'lkvip'@'localhost';
GRANT ALL PRIVILEGES ON dating_db.* TO 'lkvip'@'localhost';
GRANT ALL PRIVILEGES ON sports_db.* TO 'lkvip'@'localhost';
GRANT ALL PRIVILEGES ON admin_db.*  TO 'lkvip'@'localhost';
FLUSH PRIVILEGES;
SQL
  info "MySQL databases and user 'lkvip' created"
  info "MySQL password saved → $LKVIP_DIR/config/.db-pass (root-readable only)"
  mkdir -p "$LKVIP_DIR/config"
  printf 'MYSQL_LKVIP_USER=lkvip\nMYSQL_LKVIP_PASS=%s\n' "$MYSQL_DB_PASS" \
    > "$LKVIP_DIR/config/.db-pass"
  chmod 600 "$LKVIP_DIR/config/.db-pass"
  chown root:root "$LKVIP_DIR/config/.db-pass"
else
  warn "MySQL not reachable as root — skipping DB creation. Run manually:"
  warn "  mysql -u root -p < apps/backend/init-databases.sql"
fi

# =============================================================================
step "6 — Redis isolation (DB index 2)"
# =============================================================================
# Redis is shared but we use SELECT 2 in the app config, keeping index 0 and
# 1 free for other tenants. No new Redis process is created to avoid wasting RAM.
info "Redis isolation: LKVIP uses DB index 2 (REDIS_URL=redis://127.0.0.1:6379/2)"
info "Set this in /var/LKVIP/apps/backend/.env before starting the app"

# =============================================================================
step "7 — Nginx http-level config (gzip, ssl cache, rate zones)"
# =============================================================================
# IMPORTANT: This VPS uses per-subdomain configs in sites-available/ (managed
# by Certbot). We do NOT create a new tc-gaming symlink — that would duplicate
# server_name blocks and break nginx -t.
#
# We only install lkvip-http.conf into conf.d/ which adds:
#   - Extended gzip_types (default nginx.conf has only bare "gzip on;")
#   - Modern ssl_ciphers
#   - Named ssl_session_cache (SSL_LKVIP — no conflict)
#   - Rate-limit zones lkvip_api + lkvip_auth
#   - Image format map

HTTP_CONF_SRC="$LKVIP_DIR/config/nginx/lkvip-http.conf"
HTTP_CONF_DST="/etc/nginx/conf.d/lkvip-http.conf"

if [[ -f "$HTTP_CONF_SRC" ]]; then
  cp "$HTTP_CONF_SRC" "$HTTP_CONF_DST"
  info "HTTP-level nginx config installed → $HTTP_CONF_DST"
else
  warn "lkvip-http.conf not found at $HTTP_CONF_SRC"
  warn "This is OK if you haven't cloned the repo yet — rerun after clone"
fi

# Remove default site if still enabled (not needed on production VPS)
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  rm /etc/nginx/sites-enabled/default
  info "Removed default nginx site"
fi

# Test config — show clear pass/fail
echo ""
info "Testing nginx config..."
if nginx -t 2>&1; then
  systemctl reload nginx
  info "✓ nginx -t PASS — nginx reloaded"
else
  error "✗ nginx -t FAILED — fix errors above before reloading"
  error "Common causes:"
  error "  • Duplicate directive: check /etc/nginx/conf.d/ for conflicts"
  error "  • Missing SSL cert: run scripts/ssl-setup.sh first"
  error "  • Duplicate server_name: remove conflicting sites-enabled symlinks"
  nginx -t 2>&1 || true
fi

# =============================================================================
step "8 — Firewall (UFW) — only 22/80/443 public; block internal ports"
# =============================================================================
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    comment 'SSH'
ufw allow 80/tcp    comment 'HTTP → HTTPS redirect'
ufw allow 443/tcp   comment 'HTTPS'

# Block direct external access to internal ports
# Port 5000 must NEVER be exposed — Nginx proxies it
ufw deny 5000/tcp   comment 'LKVIP API — internal only'
ufw deny 3306/tcp   comment 'MySQL — internal only'
ufw deny 6379/tcp   comment 'Redis — internal only'

ufw --force enable
info "UFW firewall configured"
ufw status numbered

# =============================================================================
step "9 — PM2 startup (run as lkvip user)"
# =============================================================================
# --hp must point to the USER's HOME directory, not the project root.
# PM2 writes its .pm2/ state dir there.
PM2_STARTUP=$(pm2 startup systemd -u "$LKVIP_USER" --hp "$LKVIP_HOME" 2>&1 | grep 'sudo' || true)
if [[ -n "$PM2_STARTUP" ]]; then
  eval "$PM2_STARTUP" || warn "PM2 startup command failed — run manually: $PM2_STARTUP"
  info "PM2 systemd startup registered for user $LKVIP_USER (home: $LKVIP_HOME)"
else
  warn "PM2 startup already configured or couldn't detect command"
fi
# Ensure PM2 home dir is accessible by lkvip
mkdir -p "$LKVIP_HOME/.pm2"
chown -R "$LKVIP_USER:$LKVIP_USER" "$LKVIP_HOME/.pm2" 2>/dev/null || true

# =============================================================================
step "10 — Log rotation for /var/LKVIP/data/logs"
# =============================================================================
# Covers both data/logs/ (PM2 + cron scripts) and logs/ (legacy, if present)
cat > /etc/logrotate.d/lkvip <<'LOGROTATE'
/var/LKVIP/data/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su lkvip lkvip
}
/var/LKVIP/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su lkvip lkvip
}
LOGROTATE
info "Log rotation configured → /etc/logrotate.d/lkvip"

# =============================================================================
step "11 — PM2 log rotation module"
# =============================================================================
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 50M  2>/dev/null || true
pm2 set pm2-logrotate:retain 14     2>/dev/null || true
info "pm2-logrotate configured"

# =============================================================================
step "12 — MySQL tuning config"
# =============================================================================
# Copy lkvip-tuning.cnf to MySQL conf.d so it's loaded on next MySQL restart.
# Does NOT restart MySQL automatically — administrator must confirm timing.
MYSQL_TUNING_SRC="$LKVIP_DIR/config/mysql/lkvip-tuning.cnf"
MYSQL_TUNING_DST="/etc/mysql/mysql.conf.d/lkvip-tuning.cnf"

if [[ -f "$MYSQL_TUNING_SRC" ]]; then
  cp "$MYSQL_TUNING_SRC" "$MYSQL_TUNING_DST"
  chmod 644 "$MYSQL_TUNING_DST"
  info "MySQL tuning config installed → $MYSQL_TUNING_DST"
  info "  innodb_buffer_pool_size = 2G"
  info "  max_connections         = 200"
  info "  performance_schema      = OFF  (~400 MB saved)"
  warn "⚠  MySQL restart needed to apply: sudo systemctl restart mysql"
  warn "   Run this manually AFTER setup to avoid downtime on a live server."
else
  warn "MySQL tuning config not found at $MYSQL_TUNING_SRC"
  warn "Clone the repo first, then re-run this step or copy manually:"
  warn "  sudo cp $MYSQL_TUNING_SRC $MYSQL_TUNING_DST && sudo systemctl restart mysql"
fi

# =============================================================================
step "13 — Cron jobs (backup · cleanup · health-check)"
# =============================================================================
# Registered under user 'lkvip' (created in step 2).
# add_cron is idempotent: skips if the line already exists.
CRON_USER="$LKVIP_USER"
CRON_FILE="/tmp/lkvip-crontab-$$"

# Dump current crontab for lkvip user (empty file if none yet)
crontab -l -u "$CRON_USER" 2>/dev/null > "$CRON_FILE" || true

add_cron() {
  local entry="$1"
  local label="$2"
  if grep -qF "$entry" "$CRON_FILE" 2>/dev/null; then
    info "  already registered: $label"
  else
    echo "$entry" >> "$CRON_FILE"
    info "  added: $label"
    info "    → $entry"
  fi
}

# ── 3 automated jobs ─────────────────────────────────────────────────────────
#   02:00 daily  — MySQL dump → gzip → upload R2 (backup.sh)
#   03:00 daily  — log/temp cleanup + pnpm prune + disk alert (cleanup.sh)
#   every 5 min  — API/MySQL/Redis/Nginx/disk/RAM health check (health-check.sh)

add_cron \
  "0 2 * * * bash $LKVIP_DIR/scripts/backup.sh >> $LKVIP_DIR/data/logs/backup.log 2>&1" \
  "backup.sh  (daily 02:00)"

add_cron \
  "0 3 * * * bash $LKVIP_DIR/scripts/cleanup.sh >> $LKVIP_DIR/data/logs/cleanup.log 2>&1" \
  "cleanup.sh (daily 03:00)"

add_cron \
  "*/5 * * * * bash $LKVIP_DIR/scripts/health-check.sh >> $LKVIP_DIR/data/logs/health.log 2>&1" \
  "health-check.sh (every 5 min)"

# Install the crontab
crontab -u "$CRON_USER" "$CRON_FILE"
rm -f "$CRON_FILE"

info "Cron jobs installed for user '$CRON_USER'"
info "  Verify: crontab -l -u $CRON_USER"

# =============================================================================
step "Setup complete"
# =============================================================================

# ── Measure actual RAM usage right now (post-setup, before app starts) ────────
_ram_total=$(free -m | awk 'NR==2{print $2}')
_ram_used=$(free -m  | awk 'NR==2{print $3}')
_ram_free=$(free -m  | awk 'NR==2{print $7}')
_swap_total=$(free -m | awk 'NR==3{print $2}')
_disk_used=$(df -h / | awk 'NR==2{print $3}')
_disk_avail=$(df -h / | awk 'NR==2{print $4}')
_disk_pct=$(df -h / | awk 'NR==2{gsub(/%/,"",$5); print $5}')

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        LKVIP VPS — Setup Complete                       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}── Resource Budget (4 vCPU / 8 GB RAM) ─────────────────────${NC}"
printf "  %-28s %s\n" "MySQL innodb_buffer_pool:"  "2.0 GB  (step 12 — restart required)"
printf "  %-28s %s\n" "Redis maxmemory:"           "1.0 GB  (step 13 — see Redis note below)"
printf "  %-28s %s\n" "PM2 lkvip-api (2×700M):"   "1.4 GB  (ecosystem.config.js)"
printf "  %-28s %s\n" "Nginx:"                     "~0.2 GB"
printf "  %-28s %s\n" "OS / other:"                "~1.4 GB"
printf "  %-28s %s\n" "Swap (safety net):"         "${_swap_total} MB active  ← absorbs spike load"
printf "  %-28s %s\n" "Headroom:"                  "~2 GB   ← alert if free RAM < 500 MB"
echo ""
echo -e "${CYAN}── Current VPS state (pre-app) ─────────────────────────────${NC}"
printf "  %-28s %s\n" "RAM used / total:"    "${_ram_used} MB / ${_ram_total} MB  (${_ram_free} MB free)"
printf "  %-28s %s\n" "Disk used / avail:"   "${_disk_used} / ${_disk_avail}  (${_disk_pct}% used)"
printf "  %-28s %s\n" "Swap:"                "$(swapon --show --noheadings 2>/dev/null | awk '{print $1, $3}' || echo 'none')"
printf "  %-28s %s\n" "THP:"                 "$(cat /sys/kernel/mm/transparent_hugepage/enabled 2>/dev/null || echo 'unknown')"
printf "  %-28s %s\n" "vm.swappiness:"       "$(sysctl -n vm.swappiness 2>/dev/null || echo 'unknown')"
printf "  %-28s %s\n" "vm.vfs_cache_pressure:" "$(sysctl -n vm.vfs_cache_pressure 2>/dev/null || echo 'unknown')"
echo ""
echo -e "${CYAN}── Cron jobs registered (user: ${LKVIP_USER}) ──────────────────${NC}"
echo "  02:00 daily    backup.sh      → mysqldump × 6 + upload R2"
echo "  03:00 daily    cleanup.sh     → logs + temp files + pnpm prune"
echo "  every 5 min    health-check.sh → API/MySQL/Redis/Nginx/disk/RAM"
echo ""
echo -e "${CYAN}── Scaling thresholds ───────────────────────────────────────${NC}"
printf "  %-32s %s\n" "CPU > 80% sustained 1h:"    "Upgrade to 6 vCPU  or pm2 scale lkvip-api 3"
printf "  %-32s %s\n" "RAM free < 500 MB:"         "Upgrade to 16 GB RAM"
printf "  %-32s %s\n" "Disk > 85%:"                "Run cleanup.sh  or expand disk to 320 GB"
printf "  %-32s %s\n" "MySQL connections > 150:"   "Increase max_connections in lkvip-tuning.cnf"
printf "  %-32s %s\n" "Redis memory > 800 MB:"     "Increase maxmemory in lkvip-redis.conf to 1.5g"
echo ""
echo -e "${CYAN}── Manual steps required after this script ─────────────────${NC}"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 1. Clone / pull the repo:"
echo "       sudo -u $LKVIP_USER git clone <repo-url> $LKVIP_DIR"
echo "       # OR if repo already cloned:"
echo "       chown -R $LKVIP_USER:$LKVIP_USER $LKVIP_DIR"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 2. Fill in the .env file:"
echo "       sudo -u $LKVIP_USER cp $LKVIP_DIR/apps/backend/.env.example \\"
echo "            $LKVIP_DIR/apps/backend/.env"
echo "       # Key vars to set:"
echo "       #   PORT=5000"
echo "       #   REDIS_URL=redis://:CHANGE_ME_redis_password@127.0.0.1:6379/2"
echo "       #   HUB_DATABASE_URL=mysql://lkvip_db:PASS@127.0.0.1:3306/hub_db?connection_limit=8"
echo "       #   (repeat for GAME_, TRADE_, DATING_, SPORTS_, ADMIN_ DATABASE_URL)"
echo "       #   STORAGE_PROVIDER=s3"
echo "       #   S3_BUCKET=lkvip-assets  S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com"
echo "       #   ARCHIVE_ENABLED=true    ARCHIVE_BUCKET=lkvip-backups"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 3. Apply Redis tuning config:"
echo "       sudo mkdir -p /etc/redis/conf.d"
echo "       sudo cp $LKVIP_DIR/config/redis/lkvip-redis.conf /etc/redis/conf.d/lkvip.conf"
echo "       echo 'include /etc/redis/conf.d/lkvip.conf' | sudo tee -a /etc/redis/redis.conf"
echo "       sudo systemctl restart redis-server"
echo "       redis-cli ping  # should return PONG"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 4. Restart MySQL to apply tuning (step 12):"
echo "       sudo systemctl restart mysql"
echo "       mysql -u root -e \"SHOW VARIABLES LIKE 'innodb_buffer_pool_size';\""
echo "       # Expected: 2147483648 (= 2 GB)"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 5. Deploy the app:"
echo "       sudo -u $LKVIP_USER bash $LKVIP_DIR/scripts/deploy.sh"
echo ""
echo -e "  ${YELLOW}[REQUIRED]${NC} 6. Issue SSL certificates:"
echo "       sudo bash $LKVIP_DIR/scripts/ssl-setup.sh"
echo ""
echo -e "  [optional] 7. Final verification:"
echo "       pm2 status"
echo "       curl -sf http://localhost:5000/health && echo OK"
echo "       free -h && swapon --show"
echo "       crontab -l -u $LKVIP_USER"
echo "       sudo nginx -t"
echo "       bash $LKVIP_DIR/scripts/health-check.sh --verbose"
echo ""

if [[ -f "$LKVIP_DIR/config/.db-pass" ]]; then
  warn "MySQL password → $LKVIP_DIR/config/.db-pass (chmod 600, root-only)"
fi

unset _ram_total _ram_used _ram_free _swap_total _disk_used _disk_avail _disk_pct
