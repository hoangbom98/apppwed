# KJC Platform — VPS Deployment Guide

**Stack:** Ubuntu 22.04 · Node.js 20 · MySQL 8 · Redis 7 · Nginx · PM2 · Let's Encrypt

Toàn bộ hạ tầng chạy **trên một VPS duy nhất**. Không Docker. Không cloud PaaS.

---

## Architecture

```
Internet (HTTPS 443)
        │
   [Nginx]  ←─ SSL termination, gzip, rate limiting, static files
        │
        ├── hub.domain.com       → serve dist/ (React SPA)
        ├── game.domain.com      → serve dist/ (React SPA)
        ├── trade.domain.com     → serve dist/ (React SPA)
        ├── dating.domain.com    → serve dist/ (React SPA)
        ├── sports.domain.com    → serve dist/ (React SPA)
        ├── admin.domain.com     → serve dist/ (React SPA)
        └── api.domain.com       → proxy → 127.0.0.1:5000
                                         ↓
                              [PM2 Cluster: Node.js server.js]
                              [  ×(CPU cores) instances      ]
                                    ↙           ↘
                           [MySQL 8]        [Redis 7]
                       127.0.0.1:3306    127.0.0.1:6379
```

---

## Server requirements

| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2–4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

Providers tested: **Hetzner CX11** ($5/mo), DigitalOcean Droplet, Vultr.

---

## Prerequisites (DNS)

Before running setup.sh, point **7 A-records** at your server IP:

```
hub.yourdomain.com    →  <SERVER_IP>
game.yourdomain.com   →  <SERVER_IP>
trade.yourdomain.com  →  <SERVER_IP>
dating.yourdomain.com →  <SERVER_IP>
sports.yourdomain.com →  <SERVER_IP>
admin.yourdomain.com  →  <SERVER_IP>
api.yourdomain.com    →  <SERVER_IP>
```

Wait for DNS propagation before running certbot (usually < 5 minutes on most registrars).

---

## Step 1 — Clone repo on VPS

```bash
# SSH into VPS as root
ssh root@<SERVER_IP>

git clone https://github.com/your-user/kjc-platform.git /var/LKVIP
cd /var/LKVIP
```

---

## Step 2 — Initial VPS setup

```bash
# Installs: Node 20, MySQL 8, Redis 7, Nginx, PM2, UFW, certbot
# Creates: 6 databases, webadmin MySQL user, UFW rules, SSL certificates
bash config/scripts/setup.sh yourdomain.com admin@yourdomain.com
```

This takes ~5 minutes. At the end, MySQL credentials are saved to:
```
/var/LKVIP/CREDENTIALS.txt   (chmod 600)
```

---

## Step 3 — Configure environment

```bash
# Copy template and fill in values
cp /var/LKVIP/apps/backend/.env.example \
   /var/LKVIP/apps/backend/.env

# Edit .env — paste DB credentials from CREDENTIALS.txt
nano /var/LKVIP/apps/backend/.env
```

Minimum required changes in `.env`:

| Variable | Value |
|---|---|
| `APP_URL` | `https://api.yourdomain.com` |
| `CORS_ORIGINS` | `https://hub.yourdomain.com,...` |
| `*_DATABASE_URL` | From `CREDENTIALS.txt` |
| `REDIS_URL` | `redis://127.0.0.1:6379` |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same command, different output |
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_DEFAULT_PASSWORD` | A strong password |

Verify all required vars are set:
```bash
bash scripts/check-env.sh apps/backend/.env
```

---

## Step 4 — First deploy

```bash
# Installs deps, runs migrations, seeds data, builds 6 frontends, starts PM2
bash scripts/first-deploy.sh yourdomain.com
```

This takes 5–15 minutes depending on VPS speed (npm installs + 6 frontend builds).

Output at the end:
```
  API    : https://api.yourdomain.com/health
  Hub    : https://hub.yourdomain.com
  Admin  : https://admin.yourdomain.com
  ...
```

---

## Step 5 — Verify

```bash
# Backend health
curl https://api.yourdomain.com/health
# → {"status":"healthy","redis":"connected",...}

# PM2 status
pm2 status
pm2 logs api-server --lines 50

# Nginx status
systemctl status nginx
```

---

## Subsequent deploys

```bash
cd /var/LKVIP

# Full deploy (git pull + build all + pm2 reload)
bash scripts/deploy.sh

# Backend only (zero-downtime reload)
bash scripts/deploy.sh --module=backend

# Rebuild one frontend only
bash scripts/deploy.sh --module=hub

# Backend hot reload without rebuilding frontends
bash scripts/deploy.sh --skip-build
```

---

## PM2 management

```bash
pm2 status                            # overview
pm2 logs api-server --lines 100      # tail logs
pm2 monit                             # real-time monitoring
pm2 reload api-server --update-env   # zero-downtime reload
pm2 restart api-server               # hard restart (brief downtime)
bash scripts/start.sh stop    # stop
bash scripts/start.sh start   # start
```

---

## Database backup

```bash
# Manual backup (all 6 databases)
bash scripts/backup.sh

# Backups are saved to: /var/backups/mysql/YYYYMMDD/
# Retention: 30 days (configurable via BACKUP_RETENTION_DAYS in .env)

# Install automated cron backups (02:00, 08:00, 14:00, 20:00 daily)
sudo bash scripts/cron-setup.sh

# Restore a database
bash scripts/restore.sh /var/backups/mysql/20260801/hub_db_20260801_020000.sql.gz hub_db
```

---

## SSL renewal

Certbot auto-renews every 60 days via systemd timer. Verify:
```bash
certbot renew --dry-run
systemctl status certbot.timer
```

Re-run manually if needed:
```bash
bash config/scripts/ssl-setup.sh yourdomain.com admin@yourdomain.com
```

---

## Nginx management

```bash
# Test config
nginx -t

# Reload (no downtime)
systemctl reload nginx

# Full restart
systemctl restart nginx

# View access/error logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## File structure on VPS

```
/var/LKVIP/
├── source/
│   ├── backend/          ← Node.js app (PM2 runs server.js)
│   │   ├── .env          ← Production secrets (chmod 600)
│   │   ├── uploads/      ← User uploaded files
│   │   └── ...
│   ├── frontend/
│   │   ├── hub/dist/     ← Built SPA (served by Nginx)
│   │   ├── game/dist/
│   │   └── ...
│   ├── nginx/
│   │   └── nginx.conf    ← Nginx config (symlinked to sites-enabled/)
│   └── scripts/
│       ├── setup.sh      ← Run once
│       ├── first-deploy.sh
│       ├── deploy.sh     ← Run on every update
│       └── ...
├── CREDENTIALS.txt       ← Delete after copying to .env!
/var/backups/mysql/       ← Database backups
/var/log/pm2/             ← PM2 logs
/var/log/website-admin/   ← Backup/cron logs
```
