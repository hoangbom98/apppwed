# VPS Deployment & CI/CD — LKVIP Group

Target: Ubuntu 22.04 VPS.
Deploy path: `/var/LKVIP`
Production domain: `tc-gaming.live`
Subdomains: `api`, `hub`, `game`, `trade`, `dating`, `sports`, `admin` — all under `tc-gaming.live`.
PM2 process name: **`lkvip-api`** (not `lkvip-backend`).

---

## 1 — First-Time VPS Preparation

```bash
ssh root@<vps-ip>

apt update && apt upgrade -y
apt install -y nginx mysql-server redis-server curl git

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# pnpm 9+ + PM2
npm install -g pnpm pm2

# MySQL hardening
mysql_secure_installation
```

Create databases and a dedicated app user:
```sql
CREATE DATABASE admin_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE game_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE hub_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE trade_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE dating_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE sports_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'lkvip_db'@'127.0.0.1' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON admin_db.*  TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON game_db.*   TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON hub_db.*    TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON trade_db.*  TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON dating_db.* TO 'lkvip_db'@'127.0.0.1';
GRANT ALL PRIVILEGES ON sports_db.* TO 'lkvip_db'@'127.0.0.1';
FLUSH PRIVILEGES;
```

---

## 2 — Deploy Application

```bash
git clone <repo> /var/LKVIP
cd /var/LKVIP

pnpm install

cp apps/backend/.env.example apps/backend/.env
# Fill in production DATABASE_URL, JWT secrets, Redis URL, gateway keys
nano apps/backend/.env

# Build shared packages first (types → constants → utils)
pnpm run build:packages

# Build all frontend SPAs
pnpm run build:frontends

# Build backend
pnpm --filter lkvip-backend run build

# Run all Prisma migrations
pnpm run prisma:deploy

# Seed data (first deploy only)
pnpm --filter lkvip-backend run seed:all
```

---

## 3 — PM2 Ecosystem Config

File: `apps/backend/ecosystem.config.js` (already committed to repo)
Also available at: `config/pm2/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name:      'lkvip-api',           // ← use this name in all pm2 commands
    script:    'dist/server.js',
    cwd:       __dirname,             // apps/backend/
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    kill_timeout: 30000,
    out_file: '/var/LKVIP/logs/lkvip-api-out.log',
    err_file: '/var/LKVIP/logs/lkvip-api-err.log',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      APP_URL: 'https://api.tc-gaming.live',
    },
  }],
};
```

```bash
cd /var/LKVIP/apps/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

---

## 4 — Nginx Configuration

Nginx configs are committed to `config/nginx/`. Copy to `/etc/nginx/sites-available/`.

### API (reverse proxy)

File: `/etc/nginx/sites-available/api.tc-gaming.live`

```nginx
server {
    listen 443 ssl http2;
    server_name api.tc-gaming.live;

    ssl_certificate     /etc/letsencrypt/live/tc-gaming.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tc-gaming.live/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
server { listen 80; server_name api.tc-gaming.live; return 301 https://$host$request_uri; }
```

### SPA Frontend (one block per subdomain)

```nginx
server {
    listen 443 ssl http2;
    server_name hub.tc-gaming.live;   # change per SPA

    ssl_certificate     /etc/letsencrypt/live/tc-gaming.live/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tc-gaming.live/privkey.pem;

    root /var/LKVIP/apps/hub/dist;    # change per SPA
    index index.html;
    try_files $uri $uri/ /index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
server { listen 80; server_name hub.tc-gaming.live; return 301 https://$host$request_uri; }
```

SPA dist paths:
| SPA | dist path |
|---|---|
| Hub | `/var/LKVIP/apps/hub/dist` |
| Game | `/var/LKVIP/apps/game/dist` |
| Trading | `/var/LKVIP/apps/trading/dist` |
| Dating | `/var/LKVIP/apps/dating/dist` |
| Sports | `/var/LKVIP/apps/sports/dist` |
| Admin Dashboard | `/var/LKVIP/apps/admin-dashboard/dist` |

```bash
nginx -t
systemctl reload nginx
```

---

## 5 — SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx \
  -d tc-gaming.live \
  -d api.tc-gaming.live \
  -d hub.tc-gaming.live \
  -d game.tc-gaming.live \
  -d trade.tc-gaming.live \
  -d dating.tc-gaming.live \
  -d sports.tc-gaming.live \
  -d admin.tc-gaming.live
```

Renewal is automatic via the certbot systemd timer. Verify: `systemctl status certbot.timer`.

---

## 6 — Routine Deployment (after first deploy)

```bash
cd /var/LKVIP
git pull

pnpm install --frozen-lockfile
pnpm run build:packages
pnpm run build:frontends
pnpm --filter lkvip-backend run build

pnpm run prisma:deploy

pm2 reload lkvip-api --update-env
nginx -t && nginx -s reload
```

---

## 7 — GitHub Actions CI/CD

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build:packages
      - run: pnpm run build:frontends
      - run: pnpm --filter lkvip-backend run build

      - name: Copy files to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "."
          target: "/var/LKVIP"

      - name: Migrate & restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/LKVIP
            pnpm install --frozen-lockfile
            pnpm run prisma:deploy
            pm2 reload lkvip-api --update-env
            nginx -t && nginx -s reload
```

Required GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

---

## 8 — Monitoring & Logging

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14

# View live logs
pm2 logs lkvip-api --lines 100

# Monitor processes
pm2 monit
pm2 status
```

Log files: `/var/LKVIP/logs/lkvip-api-out.log` and `/var/LKVIP/logs/lkvip-api-err.log`.
Prometheus metrics: `GET /metrics` (protected by `METRICS_API_KEY` env var).
Health check: `GET /health` — returns DB + Redis + queue status.

Prometheus config: `config/monitoring/prometheus.yml`
Grafana dashboards: `config/monitoring/grafana/`
