#!/bin/bash
# =============================================================================
#  vps-setup.sh — First-time VPS preparation for LKVIP GROUP
#  Target : Ubuntu 22.04 LTS
#  Run as : root  (or sudo)
#  Usage  : bash /var/LKVIP/scripts/vps-setup.sh
#
#  Installs:
#    - Nginx, MySQL 8, Redis 7, Node.js 20, pnpm 9, PM2
#    - UFW firewall rules (80/443 open; 3306/5000/6379 internal only)
#    - Swap file (4 GB)
#    - Log rotation via PM2
#    - Symlinks Nginx configs
# =============================================================================
set -euo pipefail

DEPLOY_DIR="/var/LKVIP"
LOG_DIR="$DEPLOY_DIR/data/logs"
UPLOADS_DIR="$DEPLOY_DIR/data/uploads"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  LKVIP GROUP — VPS First-Time Setup"
echo "  Target: Ubuntu 22.04  Deploy: $DEPLOY_DIR"
echo "═══════════════════════════════════════════════════════"

# ── 1. System packages ────────────────────────────────────────────────────────
echo ""
echo "▶ [1/8] apt update & install packages"
apt update -y && apt upgrade -y
apt install -y nginx mysql-server redis-server curl git \
    certbot python3-certbot-nginx \
    build-essential ufw unzip htop

# ── 2. Node.js 20 ─────────────────────────────────────────────────────────────
echo ""
echo "▶ [2/8] Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version

# ── 3. pnpm 9 + PM2 ───────────────────────────────────────────────────────────
echo ""
echo "▶ [3/8] pnpm 9 + PM2"
npm install -g pnpm@9 pm2
pnpm --version
pm2 --version

# ── 4. Swap file (4 GB) ────────────────────────────────────────────────────────
echo ""
echo "▶ [4/8] Swap 4 GB"
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "  ✔ Swap created"
else
  echo "  ✔ Swap already exists — skipping"
fi

# ── 5. UFW Firewall ────────────────────────────────────────────────────────────
echo ""
echo "▶ [5/8] UFW firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "  ✔ UFW: 22 (SSH), 80, 443 open"
echo "  ✔ Ports 3306/5000/6379 are internal-only (no public ufw rule)"

# ── 6. MySQL databases & user ─────────────────────────────────────────────────
echo ""
echo "▶ [6/8] MySQL databases"
systemctl start mysql
systemctl enable mysql

mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS admin_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS hub_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS fortress_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL

echo "  ⚠  Databases created. Now run manually:"
echo "     mysql -u root"
echo "     CREATE USER 'lkvip_db'@'127.0.0.1' IDENTIFIED BY '<strong-password>';"
echo "     GRANT ALL PRIVILEGES ON admin_db.*   TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON game_db.*    TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON hub_db.*     TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON trade_db.*   TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON dating_db.*  TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON sports_db.*  TO 'lkvip_db'@'127.0.0.1';"
echo "     GRANT ALL PRIVILEGES ON fortress_db.* TO 'lkvip_db'@'127.0.0.1';"
echo "     FLUSH PRIVILEGES;"

# ── 7. Redis ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ [7/8] Redis"
systemctl start redis-server
systemctl enable redis-server
echo "  ✔ Redis running on 127.0.0.1:6379"

# ── 8. Nginx + deploy dir ─────────────────────────────────────────────────────
echo ""
echo "▶ [8/8] Nginx configuration"

mkdir -p "$LOG_DIR" "$UPLOADS_DIR"
chmod 755 "$LOG_DIR" "$UPLOADS_DIR"

# Link HTTP conf
if [ -f "$DEPLOY_DIR/config/nginx/lkvip-http.conf" ]; then
  cp "$DEPLOY_DIR/config/nginx/lkvip-http.conf" /etc/nginx/conf.d/lkvip-http.conf
  echo "  ✔ lkvip-http.conf installed"
fi

# Symlink main site config
if [ -f "$DEPLOY_DIR/config/nginx/tc-gaming.conf" ]; then
  ln -sf "$DEPLOY_DIR/config/nginx/tc-gaming.conf" /etc/nginx/sites-enabled/tc-gaming
  rm -f /etc/nginx/sites-enabled/default
  echo "  ✔ tc-gaming.conf symlinked"
fi

nginx -t && systemctl reload nginx
echo "  ✔ Nginx OK"

# ── PM2 startup ───────────────────────────────────────────────────────────────
echo ""
echo "▶ PM2 startup on boot"
pm2 startup | tail -1 | bash || true
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅  VPS setup complete!"
echo ""
echo "  NEXT STEPS:"
echo "  1. Configure .env:"
echo "     cp $DEPLOY_DIR/apps/backend/.env.example $DEPLOY_DIR/apps/backend/.env"
echo "     nano $DEPLOY_DIR/apps/backend/.env"
echo ""
echo "  2. Configure portal .env:"
echo "     cp $DEPLOY_DIR/apps/lkvipgroup-portal/.env.example \\"
echo "        $DEPLOY_DIR/apps/lkvipgroup-portal/.env"
echo "     nano $DEPLOY_DIR/apps/lkvipgroup-portal/.env"
echo ""
echo "  3. Issue SSL certificates:"
echo "     bash $DEPLOY_DIR/scripts/ssl-setup.sh"
echo ""
echo "  4. Run first deploy:"
echo "     bash $DEPLOY_DIR/scripts/first-deploy.sh"
echo "═══════════════════════════════════════════════════════"
