# Vercel Setup — LKVIP Group Frontend Deployment

Deploy 6 SPA frontends to Vercel from the monorepo. Each app is a separate Vercel project.

---

## 1. Prerequisites

```bash
npm install -g vercel
vercel login          # authenticates via browser
```

Get your Vercel credentials:
- **Token**: [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token
- **Org ID**: Vercel Dashboard → Team Settings → General → Team ID

---

## 2. Create Vercel Projects (one-time)

Run for each app to link it to a Vercel project:

```bash
# From monorepo root
vercel --cwd apps/hub       --name lkvip-hub       --yes
vercel --cwd apps/game      --name lkvip-game      --yes
vercel --cwd apps/trading   --name lkvip-trading   --yes
vercel --cwd apps/dating    --name lkvip-dating    --yes
vercel --cwd apps/sports    --name lkvip-sports    --yes
vercel --cwd apps/admin-dashboard --name lkvip-admin --yes
```

After each command, Vercel writes a `.vercel/project.json` in the app directory.
**Note:** `.vercel/` is gitignored — copy the `projectId` values to GitHub Secrets.

### Get project IDs

```bash
cat apps/hub/.vercel/project.json       # → "projectId": "prj_xxxx"
cat apps/game/.vercel/project.json
cat apps/trading/.vercel/project.json
cat apps/dating/.vercel/project.json
cat apps/sports/.vercel/project.json
cat apps/admin-dashboard/.vercel/project.json
```

---

## 3. Configure Project Settings (Vercel Dashboard)

For **each** project, go to **Settings → General**:

| Setting | Value |
|---------|-------|
| Framework Preset | **Vite** |
| Root Directory | `apps/<name>` (e.g. `apps/hub`) |
| Build Command | `cd ../.. && pnpm turbo run build --filter=@lkvip/<name>` |
| Output Directory | `dist` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Node.js Version | **20.x** |

> The `vercel.json` in each app already sets these — Vercel reads them automatically.

---

## 4. Set Environment Variables (Vercel Dashboard)

Go to each project → **Settings → Environment Variables** and add:

### All 6 apps

| Variable | Example value | Scope |
|----------|---------------|-------|
| `VITE_API_URL` | `https://api.tc-gaming.live` | Production |
| `VITE_API_URL` | `https://api-dev.tc-gaming.live` | Preview |

### Hub, Game, Dating, Sports, Trading (public apps using Supabase)

| Variable | Where to get | Scope |
|----------|--------------|-------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | All |
| `VITE_SUPABASE_ANON_KEY` | Same page — anon/public key | All |

### Hub only

| Variable | Value |
|----------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings |
| `VITE_VAPID_PUBLIC_KEY` | From `npx web-push generate-vapid-keys` |

### Admin Dashboard

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.tc-gaming.live` |
| `VITE_ADMIN_SECRET` | Internal secret for extra auth layer |

---

## 5. Add GitHub Secrets

Go to **GitHub → Repo Settings → Secrets → Actions → New repository secret**:

| Secret name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | From step 1 |
| `VERCEL_ORG_ID` | Team ID from Vercel dashboard |
| `VERCEL_PROJECT_ID_HUB` | `projectId` from `apps/hub/.vercel/project.json` |
| `VERCEL_PROJECT_ID_GAME` | `projectId` from `apps/game/.vercel/project.json` |
| `VERCEL_PROJECT_ID_TRADING` | `projectId` from `apps/trading/.vercel/project.json` |
| `VERCEL_PROJECT_ID_DATING` | `projectId` from `apps/dating/.vercel/project.json` |
| `VERCEL_PROJECT_ID_SPORTS` | `projectId` from `apps/sports/.vercel/project.json` |
| `VERCEL_PROJECT_ID_ADMIN` | `projectId` from `apps/admin-dashboard/.vercel/project.json` |

---

## 6. Custom Domains (Production)

For each app, go to **Vercel Dashboard → Project → Settings → Domains**:

| App | Domain |
|-----|--------|
| Hub | `hub.tc-gaming.live` |
| Game | `game.tc-gaming.live` |
| Trading | `trade.tc-gaming.live` |
| Dating | `dating.tc-gaming.live` |
| Sports | `sports.tc-gaming.live` |
| Admin | `admin.tc-gaming.live` |

Then add CNAME records at your DNS provider:
```
hub.tc-gaming.live    CNAME  cname.vercel-dns.com
game.tc-gaming.live   CNAME  cname.vercel-dns.com
trade.tc-gaming.live  CNAME  cname.vercel-dns.com
dating.tc-gaming.live CNAME  cname.vercel-dns.com
sports.tc-gaming.live CNAME  cname.vercel-dns.com
admin.tc-gaming.live  CNAME  cname.vercel-dns.com
```

> **Note:** If you currently serve these subdomains from your VPS via Nginx, removing the
> Nginx blocks and switching DNS to Vercel will complete the migration.
> Keep `api.tc-gaming.live` pointing to your VPS — the backend stays on VPS.

---

## 7. CORS — Update Backend .env

After setting up custom domains, add Vercel URLs to `CORS_ORIGINS` in
`apps/backend/.env`:

```dotenv
# Production (custom domains)
CORS_ORIGINS=https://hub.tc-gaming.live,https://game.tc-gaming.live,https://trade.tc-gaming.live,https://dating.tc-gaming.live,https://sports.tc-gaming.live,https://admin.tc-gaming.live

# Add preview URLs during development (optional — be careful in prod)
# CORS_ORIGINS=...,https://lkvip-hub.vercel.app,https://lkvip-game.vercel.app,...
```

---

## 8. Deploy

### Via GitHub Actions (recommended)

Push to `main` — the workflow at `.github/workflows/deploy-vercel.yml`
automatically detects which apps changed and deploys only those.

Manual trigger: GitHub → Actions → "CD — Deploy Frontends to Vercel" → Run workflow
→ pick app and environment.

### Via CLI (local)

```bash
# Preview deploy all apps
./scripts/deploy-vercel.sh

# Production deploy all apps
./scripts/deploy-vercel.sh --prod

# Deploy only hub to production
./scripts/deploy-vercel.sh --prod --app hub

# Dry-run (print commands without executing)
./scripts/deploy-vercel.sh --prod --dry-run
```

---

## 9. Verify

After production deploy:

```bash
for url in \
  "https://hub.tc-gaming.live" \
  "https://game.tc-gaming.live" \
  "https://trade.tc-gaming.live" \
  "https://dating.tc-gaming.live" \
  "https://sports.tc-gaming.live" \
  "https://admin.tc-gaming.live"; do
  code=$(curl -o /dev/null -s -w "%{http_code}" "$url")
  echo "$code $url"
done
```

All should return `200`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails with "Cannot find package @lkvip/types" | Set **Root Directory** to `apps/<name>` and **Install Command** to `cd ../.. && pnpm install --frozen-lockfile` |
| `VITE_API_URL` is undefined in browser | Variable must be prefixed `VITE_` and set in Vercel dashboard (not just `.env.local`) |
| Blank page on hard refresh (404) | Check `vercel.json` has `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]` |
| API calls blocked by CORS | Add the Vercel deployment URL to `CORS_ORIGINS` in backend `.env` and reload PM2 |
| `CAPACITOR_BUILD` triggers wrong base URL | Never set `CAPACITOR_BUILD=true` in Vercel env vars — it is only for native builds |
