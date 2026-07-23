#!/usr/bin/env bash
# =============================================================================
#  setup.sh — LKVIP GROUP VPS Initial Setup
#
#  Run ONCE as root on a fresh Ubuntu 22.04 LTS server.
#  Installs all required system dependencies and creates the MySQL databases.
#
#  Usage:
#    sudo bash source/scripts/setup.sh [--domain yourdomain.com]
#
#  After this script completes, run:
#    bash source/scripts/first-deploy.sh --domain yourdomain.com
#
#  What it does:
#    1. System update + essentials
#    2. Node.js 20 LTS (via NodeSource)
#    3. pnpm
#    4. MySQL 8
#    5. Redis 7
#    6. Nginx
#    7. PM2 (global)
#    8. Certbot (Let's Encrypt)
#    9. UFW firewall (22, 80, 443)
#   10. Create OS user lkvip-admin + file ownership + ulimit config
#   11. Create 6 MySQL databases + lkvip_db user
#   12. Save credentials to CREDENTIALS.txt
# =============================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_common.sh
source "$SCRIPT_DIR/_common.sh"

require_root

# ── Parse arguments ───────────────────────────────────────────────────────────
DOMAIN=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    *) log_warn "Unknown argument: $1"; shift ;;
  esac
done

# ── Constants ─────────────────────────────────────────────────────────────────
INSTALL_DIR="/var/www/lkvip"
CREDENTIALS_FILE="$INSTALL_DIR/CREDENTIALS.txt"
NODE_VERSION="20"
APP_USER="lkvip-admin"
DB_USER="lkvip_db"
DB_NAMES=("hub_db" "game_db" "trade_db" "dating_db" "sports_db" "admin_db")

# Generate a strong random password for the DB user
DB_PASSWORD="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)"

log_header "LKVIP GROUP — VPS Initial Setup"
log_info "Domain: ${DOMAIN:-<not set — configure Nginx manually>}"
log_info "Install dir: $INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — System update
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 1/12: System update & essentials"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip build-essential software-properties-common \
  ca-certificates gnupg lsb-release apt-transport-https \
  netcat-openbsd openssl
log_ok "System updated"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Node.js 20 LTS
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 2/12: Installing Node.js $NODE_VERSION LTS"
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_VERSION" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
fi
log_ok "Node.js $(node -v) installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — pnpm
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 3/12: Installing pnpm"
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm@latest
fi
log_ok "pnpm $(pnpm -v) installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — MySQL 8
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 4/12: Installing MySQL 8"
if ! command -v mysql &>/dev/null; then
  apt-get install -y mysql-server
  systemctl enable mysql
  systemctl start mysql
fi
wait_for_port 3306 "MySQL" 60
log_ok "MySQL $(mysqld --version 2>&1 | awk '{print $4}') installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Redis 7
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 5/12: Installing Redis 7"
if ! command -v redis-server &>/dev/null; then
  apt-get install -y redis-server
  # Set supervised to systemd
  sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
  systemctl enable redis-server
  systemctl restart redis-server
fi
wait_for_port 6379 "Redis" 30
log_ok "Redis $(redis-server --version | awk '{print $3}' | tr -d 'v=') installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Nginx
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 6/12: Installing Nginx"
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
fi
log_ok "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — PM2
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 7/12: Installing PM2"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2@latest
fi
log_ok "PM2 $(pm2 -v) installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — Certbot
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 8/12: Installing Certbot"
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi
log_ok "Certbot $(certbot --version 2>&1 | awk '{print $2}') installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 — UFW Firewall
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 9/12: Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
log_ok "UFW enabled — open ports: 22, 80, 443"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10 — Create OS user lkvip-admin + ownership + ulimits
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 10/12: Creating OS user '$APP_USER'"

# Create dedicated system user for the app process (no home dir login shell)
if ! id "$APP_USER" &>/dev/null; then
  adduser --system --group --no-create-home --shell /bin/bash "$APP_USER"
  # Allow passwordless sudo for specific ops commands (pm2 reload, systemctl)
  echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/pm2" \
    > "/etc/sudoers.d/lkvip-admin"
  chmod 440 "/etc/sudoers.d/lkvip-admin"
  log_ok "OS user '$APP_USER' created"
else
  log_info "OS user '$APP_USER' already exists — skipping creation"
fi

# Ensure install dir exists and is owned by lkvip-admin
mkdir -p "$INSTALL_DIR"
chown -R "$APP_USER":"$APP_USER" "$INSTALL_DIR"
log_ok "Ownership set: $INSTALL_DIR → $APP_USER:$APP_USER"

# ── /etc/security/limits.conf — raise open-file limits for lkvip-admin ─────────
LIMITS_MARKER="# lkvip-admin ulimits"
if ! grep -q "$LIMITS_MARKER" /etc/security/limits.conf; then
  cat >> /etc/security/limits.conf <<LIMITS

$LIMITS_MARKER
$APP_USER soft nofile 65536
$APP_USER hard nofile 65536
$APP_USER soft nproc  4096
$APP_USER hard nproc  4096
LIMITS
  log_ok "Open-file limits set for $APP_USER (nofile=65536, nproc=4096)"
else
  log_info "limits.conf entries for $APP_USER already present — skipping"
fi

# Also ensure PAM uses limits.conf (required on some Ubuntu images)
if ! grep -q "pam_limits.so" /etc/pam.d/common-session 2>/dev/null; then
  echo "session required pam_limits.so" >> /etc/pam.d/common-session
  log_ok "pam_limits.so added to /etc/pam.d/common-session"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 11 — Create MySQL databases and user
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 11/12: Creating MySQL databases and user"

# Build SQL to create all 6 databases + grant user
SQL=""
SQL+="CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';"$'\n'
for DB_NAME in "${DB_NAMES[@]}"; do
  SQL+="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"$'\n'
  SQL+="GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';"$'\n'
done
SQL+="FLUSH PRIVILEGES;"

mysql -u root <<< "$SQL"
log_ok "Created databases: ${DB_NAMES[*]}"
log_ok "MySQL user '${DB_USER}'@'127.0.0.1' created with privileges"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 12 — Save credentials
# ═══════════════════════════════════════════════════════════════════════════════
log_step "Step 12/12: Saving credentials"

cat > "$CREDENTIALS_FILE" <<EOF
# LKVIP GROUP — Generated Credentials
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# IMPORTANT: Keep this file secure. Do NOT commit to version control.

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Database URLs (paste into .env)
HUB_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/hub_db?connection_limit=8
GAME_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/game_db?connection_limit=12
TRADE_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/trade_db?connection_limit=8
DATING_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/dating_db?connection_limit=8
SPORTS_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/sports_db?connection_limit=6
ADMIN_DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/admin_db?connection_limit=10

# Redis
REDIS_URL=redis://127.0.0.1:6379
EOF
chmod 600 "$CREDENTIALS_FILE"
chown "$APP_USER":"$APP_USER" "$CREDENTIALS_FILE"
log_ok "Credentials saved to $CREDENTIALS_FILE"

# ── Summary ───────────────────────────────────────────────────────────────────
log_header "Setup Complete!"
echo ""
echo -e "  ${GREEN}Node.js${RESET}    $(node -v)"
echo -e "  ${GREEN}pnpm${RESET}       $(pnpm -v)"
echo -e "  ${GREEN}MySQL${RESET}      running on port 3306"
echo -e "  ${GREEN}Redis${RESET}      running on port 6379"
echo -e "  ${GREEN}Nginx${RESET}      running on port 80/443"
echo -e "  ${GREEN}PM2${RESET}        $(pm2 -v)"
echo -e "  ${GREEN}UFW${RESET}        enabled (22, 80, 443)"
echo -e "  ${GREEN}lkvip-admin${RESET}  OS user created, owns $INSTALL_DIR"
echo ""
log_info "Credentials saved to: $CREDENTIALS_FILE"
echo ""
log_info "Next step: Clone your repository and run first-deploy.sh"
echo -e "  ${BOLD}cd $INSTALL_DIR${RESET}"
echo -e "  ${BOLD}sudo -u $APP_USER git clone <repo-url> .${RESET}"
echo -e "  ${BOLD}sudo -u $APP_USER bash source/scripts/first-deploy.sh --domain yourdomain.com${RESET}"
