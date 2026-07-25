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

LKVIP_USER="lkvip"
LKVIP_HOME="/home/lkvip"          # Linux home dir for useradd -m
LKVIP_DIR="/var/LKVIP"            # project root — NOT the home dir
MYSQL_DB_PASS="${MYSQL_LKVIP_PASS:-$(openssl rand -base64 20 | tr -dc 'A-Za-z0-9' | head -c 20)}"

# =============================================================================
step "1 — System packages"
# =============================================================================
apt-get update -qq
apt-get install -y --no-install-recommends \
  nginx curl git dnsutils mysql-client redis-tools ufw \
  certbot python3-certbot-nginx \
  build-essential

info "System packages installed"

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
  "$LKVIP_DIR/apps/trading/dist" \
  "$LKVIP_DIR/apps/sports/dist" \
  "$LKVIP_DIR/apps/admin-dashboard/dist" \
  "$LKVIP_DIR/logs" \
  "$LKVIP_DIR/.backups" \
  "$LKVIP_DIR/data/uploads"

chown -R "$LKVIP_USER:$LKVIP_USER" "$LKVIP_DIR"
chmod 750 "$LKVIP_DIR"
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
step "10 — Log rotation for /var/LKVIP/logs"
# =============================================================================
cat > /etc/logrotate.d/lkvip <<'LOGROTATE'
/var/LKVIP/logs/*.log {
    daily
    rotate 14
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
step "Setup complete"
# =============================================================================
echo ""
info "====================================================="
info "  LKVIP VPS isolation setup finished"
info "====================================================="
echo ""
info "Next steps:"
echo "  1. Clone the repo:"
echo "       sudo -u $LKVIP_USER git clone <repo> $LKVIP_DIR"
echo "       # OR if already cloned:"
echo "       chown -R $LKVIP_USER:$LKVIP_USER $LKVIP_DIR"
echo ""
echo "  2. Copy and fill the .env file:"
echo "       sudo -u $LKVIP_USER cp $LKVIP_DIR/config/env/.env.example \\"
echo "            $LKVIP_DIR/apps/backend/.env"
echo "       # Set PORT=5000, REDIS_URL=redis://127.0.0.1:6379/2"
echo "       # Set *_DATABASE_URL using mysql password from $LKVIP_DIR/config/.db-pass"
echo ""
echo "  3. Run the deploy script:"
echo "       sudo -u $LKVIP_USER bash $LKVIP_DIR/scripts/deploy.sh"
echo ""
echo "  4. Issue SSL certificates:"
echo "       sudo bash $LKVIP_DIR/scripts/ssl-setup.sh"
echo ""
echo "  5. Verify:"
echo "       pm2 status"
echo "       curl -sf http://localhost:5000/health"
echo "       sudo nginx -t"
echo ""
if [[ -f "$LKVIP_DIR/config/.db-pass" ]]; then
  warn "MySQL password stored at $LKVIP_DIR/config/.db-pass (chmod 600, root only)"
fi
