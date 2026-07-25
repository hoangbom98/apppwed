# Deploy Guide — LKVIP GROUP @ tc-gaming.live

**VPS IP:** `104.248.146.203`  
**Deploy root:** `/var/LKVIP` (isolated — never touches `/var/www`)  
**OS:** Ubuntu 22.04

---

## Isolation Architecture

```
┌──────────────────────────────────────────────────────────┐
│  VPS 104.248.146.203                                      │
│                                                           │
│  ┌─────────────────────┐  ┌──────────────────────────┐   │
│  │  Other projects      │  │  LKVIP GROUP             │   │
│  │  /var/www/...        │  │  /var/LKVIP              │   │
│  │  user: www-data      │  │  user: lkvip             │   │
│  │  ports: 8788, 8789   │  │  port: 5000 (internal)   │   │
│  │  redis DB: 0, 1      │  │  redis DB: 2             │   │
│  │  mysql: own user     │  │  mysql: lkvip user       │   │
│  └─────────────────────┘  └──────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Nginx   :80 / :443  (shared, separate configs)  │    │
│  │  /etc/nginx/sites-enabled/tc-gaming              │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

| Component | Value |
|---|---|
| System user | `lkvip` |
| Project root | `/var/LKVIP` |
| API process | PM2 `lkvip-api` |
| Internal API port | `5000` on `127.0.0.1` only |
| Redis DB index | `2` (not 0 or 1) |
| MySQL user | `lkvip` (scoped to 6 lkvip databases only) |
| Nginx config | `/etc/nginx/sites-enabled/tc-gaming` |
| Logs | `/var/LKVIP/logs/` |
| Backups | `/var/LKVIP/.backups/` |
| Cron user | `lkvip` (isolated from other crontabs) |

---

## DNS Records (Cloudflare)

All A records point to `104.248.146.203`:

| Subdomain | → App |
|---|---|
| `tc-gaming.live` | Hub SPA |
| `www.tc-gaming.live` | → redirects to `tc-gaming.live` |
| `hub.tc-gaming.live` | Hub SPA |
| `api.tc-gaming.live` | Backend API (PM2 :5000) |
| `trade.tc-gaming.live` | Trading SPA |
| `sports.tc-gaming.live` | Sports SPA |
| `admin.tc-gaming.live` | Admin Dashboard |

> **Tip:** During SSL certificate issuance, temporarily set Cloudflare proxy to **DNS Only** (grey cloud). Re-enable proxying after `ssl-setup.sh` completes.

---

## Step 1 — First-time VPS Setup (run once as root)

```bash
# SSH into VPS
ssh root@104.248.146.203

# Clone the repo
git clone <repo-url> /var/LKVIP

# Run the isolation setup script
sudo bash /var/LKVIP/scripts/vps-setup.sh
```

This script:
- Creates the `lkvip` system user
- Sets up `/var/LKVIP` directory structure with correct ownership
- Installs Node.js 20, pnpm 9, PM2 (system-wide)
- Creates 6 isolated MySQL databases + dedicated `lkvip` DB user
- Configures Redis DB index 2 for isolation
- Links Nginx config for `tc-gaming.live`
- Configures UFW firewall (only 22/80/443 public; blocks 5000/3306/6379)
- Registers PM2 systemd startup for `lkvip` user

---

## Step 2 — Configure Environment

```bash
sudo -u lkvip bash
cd /var/LKVIP

cp config/env/.env.example apps/backend/.env
nano apps/backend/.env
```

Required changes for production:

```env
NODE_ENV=production
PORT=5000
APP_URL=https://api.tc-gaming.live

CORS_ORIGINS=https://tc-gaming.live,https://www.tc-gaming.live,https://hub.tc-gaming.live,https://trade.tc-gaming.live,https://sports.tc-gaming.live,https://admin.tc-gaming.live

# Get password from /var/LKVIP/config/.db-pass (root-only)
HUB_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/hub_db
GAME_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/game_db
TRADE_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/trade_db
DATING_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/dating_db
SPORTS_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/sports_db
ADMIN_DATABASE_URL=mysql://lkvip:<password>@127.0.0.1:3306/admin_db

# Redis DB index 2 — isolated from other projects
REDIS_URL=redis://127.0.0.1:6379/2

# Generate strong secrets:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
ENCRYPTION_KEY=<64-char hex>
```

---

## Step 3 — First Deploy

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh
```

This runs:
1. Pre-deploy checks (correct dir, port conflict detection, Node version)
2. Backup uploads
3. `git pull --ff-only origin main`
4. `pnpm install --frozen-lockfile`
5. Prisma migrations for all 6 schemas
6. Backend TypeScript build (`tsc`)
7. Frontend Vite builds (hub, trading, sports, admin-dashboard)
8. PM2 zero-downtime reload / first start
9. Nginx reload
10. Health check on `http://127.0.0.1:5000/health`

---

## Step 4 — SSL Certificates

```bash
# Temporarily set Cloudflare proxy to "DNS Only" (grey cloud) for all 7 records
sudo bash /var/LKVIP/scripts/ssl-setup.sh
# Re-enable Cloudflare proxy after success
```

---

## Step 5 — GitHub Actions CI/CD (automatic deploys)

Add these secrets to the GitHub repository (`Settings → Secrets → Actions`):

| Secret | Value |
|---|---|
| `VPS_HOST` | `104.248.146.203` |
| `VPS_USER` | `lkvip` |
| `VPS_SSH_KEY` | Private key of the `lkvip` user |
| `VPS_PORT` | `22` |

Generate and register SSH key:

```bash
# On your local machine:
ssh-keygen -t ed25519 -C "lkvip-deploy" -f ~/.ssh/lkvip_deploy

# On the VPS as lkvip user:
mkdir -p /var/LKVIP/.ssh
cat ~/.ssh/lkvip_deploy.pub >> /var/LKVIP/.ssh/authorized_keys  # wrong path!
# Correct:
sudo -u lkvip mkdir -p /home/lkvip/.ssh
cat ~/.ssh/lkvip_deploy.pub | sudo -u lkvip tee -a /home/lkvip/.ssh/authorized_keys
sudo chmod 600 /home/lkvip/.ssh/authorized_keys

# Copy private key content → GitHub Secret VPS_SSH_KEY:
cat ~/.ssh/lkvip_deploy
```

Every push to `main` now auto-deploys.

---

## Port Conflict Resolution

If another project on the VPS already uses port `5000`:

1. Edit `apps/backend/.env` — change `PORT=5000` to e.g. `PORT=5001`
2. Edit `config/nginx/tc-gaming.conf` — update the upstream block:
   ```nginx
   upstream lkvip_api {
       server 127.0.0.1:5001;   # ← new port
   }
   ```
3. Edit `apps/backend/ecosystem.config.js` — update `PORT: 5001`
4. Redeploy: `sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh`

---

## Day-to-Day Operations

```bash
# View running processes
pm2 status

# Live logs
pm2 logs lkvip-api --lines 100

# Restart (graceful)
pm2 reload lkvip-api --update-env

# Backend only (no frontend rebuild)
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --backend-only

# Frontend only (no PM2 restart)
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --frontend-only

# Skip backup (faster, use when no user uploads)
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --skip-backup

# Health check
curl -sf https://api.tc-gaming.live/health | python3 -m json.tool

# Nginx status
nginx -t && systemctl status nginx

# SSL renewal check
certbot renew --dry-run
systemctl status certbot.timer
```

---

## Firewall Summary

```
22/tcp   → SSH                  (public)
80/tcp   → HTTP → HTTPS redirect (public, Nginx)
443/tcp  → HTTPS                (public, Nginx)
5000/tcp → LKVIP API             (BLOCKED externally, internal only)
3306/tcp → MySQL                 (BLOCKED externally)
6379/tcp → Redis                 (BLOCKED externally)
```

Public traffic flows: `Client → Cloudflare CDN → Nginx :443 → PM2 :5000`
