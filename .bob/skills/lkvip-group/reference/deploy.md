# VPS Deployment & CI/CD — LKVIP Group

Target: Ubuntu 22.04 VPS. Subdomains: `api`, `hub`, `game`, `trade`, `dating`, `sports`, `admin` — all under `lkvip.com`.

---

## 1 — First-Time VPS Preparation

```bash
ssh root@<vps-ip>

apt update && apt upgrade -y
apt install -y nginx mysql-server redis-server curl git

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# pnpm + PM2
npm install -g pnpm pm2

# MySQL hardening
mysql_secure_installation
```

Create databases and a dedicated app user:
```sql
CREATE DATABASE admin_db;
CREATE DATABASE game_db;
CREATE DATABASE hub_db;
CREATE DATABASE trade_db;
CREATE DATABASE dating_db;
CREATE DATABASE sports_db;

CREATE USER 'lkvip'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON admin_db.* TO 'lkvip'@'localhost';
-- repeat for all 6 databases
FLUSH PRIVILEGES;
```

---

## 2 — Deploy Application

```bash
git clone <repo> /var/www/lkvip-group
cd /var/www/lkvip-group

pnpm install
cp backend/.env.example backend/.env.production
# Fill in production DATABASE_URL, JWT secrets, Redis URL, gateway keys
nano backend/.env.production

pnpm run build

cd backend
pnpm run prisma:migrate:all
pnpm run prisma:seed:all
```

---

## 3 — PM2 Ecosystem Config

File: `backend/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'lkvip-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
  }],
};
```

```bash
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

---

## 4 — Nginx Configuration

### API (reverse proxy)

File: `/etc/nginx/sites-available/api.lkvip.com`

```nginx
server {
    listen 443 ssl http2;
    server_name api.lkvip.com;

    ssl_certificate     /etc/letsencrypt/live/api.lkvip.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lkvip.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
server { listen 80; server_name api.lkvip.com; return 301 https://$host$request_uri; }
```

### SPA Frontend (one block per subdomain)

```nginx
server {
    listen 443 ssl http2;
    server_name hub.lkvip.com;      # change per SPA

    ssl_certificate     /etc/letsencrypt/live/hub.lkvip.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hub.lkvip.com/privkey.pem;

    root /var/www/lkvip-group/frontend/hub/dist;   # change per SPA
    index index.html;
    try_files $uri $uri/ /index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
server { listen 80; server_name hub.lkvip.com; return 301 https://$host$request_uri; }
```

Repeat for: `game`, `trading`, `dating`, `sports`, `admin-dashboard`.

```bash
ln -s /etc/nginx/sites-available/api.lkvip.com /etc/nginx/sites-enabled/
# ... repeat for each subdomain config
nginx -t
systemctl reload nginx
```

---

## 5 — SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx \
  -d api.lkvip.com \
  -d hub.lkvip.com \
  -d game.lkvip.com \
  -d trade.lkvip.com \
  -d dating.lkvip.com \
  -d sports.lkvip.com \
  -d admin.lkvip.com
```

Renewal is automatic via the certbot systemd timer. Verify: `systemctl status certbot.timer`.

---

## 6 — GitHub Actions CI/CD

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
      - run: pnpm install
      - run: pnpm run build

      - name: Copy files to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "."
          target: "/var/www/lkvip-group"

      - name: Migrate & restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/lkvip-group
            pnpm install --frozen-lockfile
            pnpm run prisma:migrate:all
            pm2 reload lkvip-backend
            nginx -t && nginx -s reload
```

Required GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.

---

## 7 — Monitoring & Logging

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14

# View live logs
pm2 logs lkvip-backend --lines 100
```

Backend uses `winston` + `winston-daily-rotate-file`. Log files land in `backend/logs/`.

Health check endpoint (returns DB + Redis + queue status): `GET /health`
