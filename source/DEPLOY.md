# LKVIP GROUP — Deploy Guide

## Fresh VPS (Ubuntu 22.04 LTS) — First Time

### Prerequisites
- Fresh Ubuntu 22.04 server with root access
- Git repo cloned or accessible
- Domain DNS records pointing to VPS IP

### Step 1 — System setup (run once as root)
```bash
sudo bash source/scripts/setup.sh --domain yourdomain.com
```
Creates: Node 20, MySQL 8, Redis 7, Nginx, PM2, Certbot, UFW (22/80/443),
OS user `lkvip-admin`, 6 MySQL databases, saves credentials to `CREDENTIALS.txt`.

### Step 2 — Copy credentials into .env
```bash
cp source/backend/.env.example source/backend/.env
# Paste DB passwords from CREDENTIALS.txt, then fill in all CHANGE_ME values
nano source/backend/.env
```
At minimum, set these before continuing:
```
JWT_SECRET              ← node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_REFRESH_SECRET      ← same command, different value
ENCRYPTION_KEY          ← node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_DEFAULT_PASSWORD  ← strong password for admin@lkvip.com
HUB_DATABASE_URL        ← copy from CREDENTIALS.txt
GAME_DATABASE_URL       ← copy from CREDENTIALS.txt
TRADE_DATABASE_URL      ← copy from CREDENTIALS.txt
DATING_DATABASE_URL     ← copy from CREDENTIALS.txt
SPORTS_DATABASE_URL     ← copy from CREDENTIALS.txt
ADMIN_DATABASE_URL      ← copy from CREDENTIALS.txt
CORS_ORIGINS            ← comma-separated frontend URLs
```

### Step 3 — Validate .env
```bash
bash source/scripts/check-env.sh
```

### Step 4 — First deploy
```bash
bash source/scripts/first-deploy.sh --domain yourdomain.com
```
Does: `pnpm install` → Prisma generate → migrate → seed → **tsc build** → build 6 SPAs → Nginx config → PM2 start.

### Step 5 — SSL
```bash
bash source/scripts/ssl-setup.sh --domain yourdomain.com
```

---

## Rolling Update (every deploy after first)

```bash
bash source/scripts/deploy.sh
```
Does: `git pull` → `pnpm install` → Prisma migrate → **tsc build** → build 6 SPAs → `pm2 reload` (zero-downtime).

### Deploy only backend (skip frontend rebuild)
```bash
bash source/scripts/deploy.sh --module backend
```

### Deploy only one frontend
```bash
bash source/scripts/deploy.sh --module game --skip-build=false
# or rebuild manually:
cd source && pnpm --filter @lkvip/game run build
```

### Rollback to previous commit
```bash
bash source/scripts/deploy.sh --rollback
```

---

## Cron / Backup

Install daily backup cron (run once after setup):
```bash
sudo bash source/scripts/cron-setup.sh
```
Installs: backup at 02:00 (as `lkvip-admin`), certbot renew at 03:00, log rotation Sundays.

Manual backup:
```bash
bash source/scripts/backup-db.sh
```

---

## Useful Commands

| Task | Command |
|------|---------|
| PM2 status | `pm2 status` |
| API logs | `pm2 logs lkvip-api --lines 100` |
| Restart API | `pm2 restart lkvip-api` |
| Zero-downtime reload | `pm2 reload lkvip-api --update-env` |
| Check all env vars | `bash source/scripts/check-env.sh` |
| Validate Nginx | `nginx -t` |
| Reload Nginx | `systemctl reload nginx` |
| Prisma status | `cd source/backend && npm run prisma:status:all` |
| Run seeds | `cd source/backend && npm run seed:all` |
| Backend typecheck | `cd source/backend && npm run type-check` |

---

## Directory Layout (production)

```
/var/www/lkvip/        ← INSTALL_DIR (owned by lkvip-admin)
├── CREDENTIALS.txt            ← DB passwords (chmod 600, do NOT commit)
└── source/
    ├── backend/
    │   ├── .env               ← secrets (chmod 600, do NOT commit)
    │   ├── dist/              ← compiled JS (from npm run build)
    │   └── ecosystem.config.js
    ├── frontend/
    │   ├── hub/dist/          ← built SPA served by Nginx
    │   ├── game/dist/
    │   ├── trade/dist/
    │   ├── dating/dist/
    │   ├── sports/dist/
    │   └── admin-dashboard/dist/
    ├── nginx/nginx.conf       ← Nginx template (domain patched at deploy time)
    └── scripts/
        ├── setup.sh           ← run once as root
        ├── first-deploy.sh    ← run once after setup
        ├── deploy.sh          ← run on every update
        ├── backup-db.sh       ← run by cron daily at 02:00
        ├── check-env.sh       ← pre-deploy validation
        ├── cron-setup.sh      ← install OS cron entries
        └── ssl-setup.sh       ← certbot SSL
```

---

## Port Map

| Service | Port | Note |
|---------|------|------|
| Node.js API | 5000 | PM2 cluster, internal only |
| MySQL | 3306 | localhost only |
| Redis | 6379 | localhost only |
| Nginx HTTP | 80 | redirects to HTTPS |
| Nginx HTTPS | 443 | SSL termination |
| SSH | 22 | UFW open |
