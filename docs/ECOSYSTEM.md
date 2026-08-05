# LKVIP Group — Platform Ecosystem Reference

> **Canonical reference** for the LKVIP monorepo at `/var/LKVIP`.
> Sourced from actual code — `apps/*/package.json`, `src/config/cron.ts`, `deploy.md`, `architecture.md`.
> Last updated: see git log.

---

## 1. App Catalogue

### Core Apps (monorepo workspace)

| # | Name | Package | Framework | Dev Port | Deployment |
|---|------|---------|-----------|----------|------------|
| 1 | Hub | `@lkvip/hub` | React 19 + Vite | 5173 | Vercel → `hub.tc-gaming.live` |
| 2 | Game | `@lkvip/game` | React 19 + Vite | 5174 | Vercel → `game.tc-gaming.live` |
| 3 | Trading | `@lkvip/trade` | React 19 + Vite | 5175 | Vercel → `trade.tc-gaming.live` |
| 4 | Dating | `@lkvip/dating` | React 19 + Vite | 5176 | Vercel → `dating.tc-gaming.live` |
| 5 | Sports | `@lkvip/sports` | React 19 + Vite | 5177 | Vercel → `sports.tc-gaming.live` |
| 6 | Admin Dashboard | `@lkvip/admin` | React 19 + Vite + Ant Design v6 | 5180 | Vercel → `admin.tc-gaming.live` |
| 7 | Banking | `@lkvip/banking` | React 19 + Vite | 5181 | Vercel |
| 8 | Invest | `@lkvip/invest` | Next.js 15 | 5182 | Vercel |
| 9 | Academy | `@lkvip/academy` | React 19 + Vite | 5184 | Vercel |
| 10 | Store | `@lkvip/store` | React 19 + Vite | 5185 | Vercel |
| 11 | Portal | `@lkvip/portal` | Next.js 15 (standalone) | 3010 | Vercel → `lkvip.group` |
| 12 | Backend API | `lkvip-backend` | Express.js 4 + Prisma + BullMQ | 5000 | VPS → `api.tc-gaming.live` |
| 13 | Mobile | `@lkvip/mobile` | Capacitor v7 (wraps Admin PWA) | — | Native app store |
| 14 | Mobile Native | `@lkvip/mobile-native` | Capacitor native shell | — | Native app store |
| 15 | Mobile Native Enterprise | `@lkvip/mobile-native-enterprise` | Capacitor enterprise shell | — | Internal |

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@lkvip/types` | Shared TypeScript interfaces (common, api, portal, store) |
| `@lkvip/constants` | Enums, currencies, roles, error codes, project IDs |
| `@lkvip/utils` | Crypto, date, money (decimal.js), OTP, slugify helpers |
| `@lkvip/api-client` | Axios auth client factory with auto token-refresh |
| `@lkvip/auth` | Shared auth hooks, `TokenManager` |
| `@lkvip/ui` | Shared React components, hooks, Zustand stores, PWA utils |
| `@lkvip/config` | Shared ESLint flat configs (browser + node) |
| `@lkvip/tsconfig` | Shared TypeScript config bases |
| `@lkvip/paylock-sdk` | License verification SDK (UMD/ESM/CJS) |
| `@lkvip/ai-skills` | AI-driven health-check & auto-fix tooling |
| `@lkvip/scripts-utils` | Shared CLI/build utilities |

### External Apps (not in workspace — isolated)

| App | Tech | Purpose |
|-----|------|---------|
| `apps/external/landing` | HTML/CSS/JS | Landing page |
| `apps/external/prodevs` | HTML/CSS/JS | Admin demo / corporate |
| `apps/external/social` | React Native | Social mobile app |
| `apps/external/anonymous-voice` | Node.js | Anonymous voice calls |
| `apps/external/graph-ai` | Python + Neo4j | Graph AI / RAG demo |

---

## 2. Deployment Topology

```
                        INTERNET
                           │
                    Cloudflare (CDN + WAF)
                    DDoS protection, SSL offload,
                    proxy for all *.tc-gaming.live
                           │
          ┌────────────────┴─────────────────┐
          │                                  │
   Vercel (11 projects)              VPS Ubuntu 22.04
   ─────────────────                  ──────────────
   hub.tc-gaming.live                 api.tc-gaming.live → PM2 lkvip-api (cluster, :5000)
   game.tc-gaming.live                portal.tc-gaming.live → PM2 lkvip-portal (fork, :3010)
   trade.tc-gaming.live               Nginx (reverse proxy + static files)
   dating.tc-gaming.live              MySQL 8 (6 schemas)
   sports.tc-gaming.live              Redis 7 (cache + BullMQ broker)
   admin.tc-gaming.live               Let's Encrypt SSL (certbot)
   lkvip.group (Portal)
   + Banking, Invest, Store, Academy
```

**Key rule**: Backend API stays on VPS. All SPA/SSG frontends are on Vercel. Never serve frontend files from VPS Nginx for Vercel-deployed apps.

---

## 3. Request Data Flow

```
[Browser]
   │  HTTPS
   ▼
[Cloudflare]
   │  cache hit → serve static asset (CDN)
   │  miss / API call →
   ├──► [Vercel Edge Network]
   │       └─ serves SPA HTML + JS chunks (immutable cache)
   │           └─ app calls VITE_API_URL (api.tc-gaming.live)
   │
   └──► [VPS: Nginx :443]
           └─ proxy_pass → PM2 lkvip-api :5000 (Express)
                   ├─ authenticate middleware (JWT + HTTP-only cookie)
                   ├─ projectAccessGuard
                   ├─ rateLimiter (Redis)
                   ├─ Service layer
                   │     ├─ MySQL 8 via Prisma (6 schemas)
                   │     ├─ Redis (cache, session, rate-limit)
                   │     ├─ BullMQ (14 async workers)
                   │     └─ Socket.IO (real-time to Vite SPAs)
                   └─ ApiResponse envelope → browser
```

---

## 4. Cron Jobs

All jobs run inside the backend process via `node-cron`. Source: [`apps/backend/src/config/cron.ts`](../apps/backend/src/config/cron.ts).

| Job | Schedule (UTC) | Purpose |
|-----|---------------|---------|
| `trade-price-feed` | Every 30 seconds | Fetch crypto prices from CoinGecko + forex from Alpha Vantage; emit via Socket.IO |
| `trade-liquidation` | Every 30 seconds | Check and liquidate under-margin trading positions |
| `robot-bet-tick` | Every 30 seconds | Simulate robot bets (`ENABLE_ROBOT_BETS=true` only) |
| `sports-live-scores` | Every 1 minute | Sync live match scores from ApiFootball; emit via Socket.IO |
| `clear-expired-cache` | Every 5 minutes | Flush expired Redis cache keys |
| `health-snapshot` | Every 10 minutes | Log memory + cache metrics to Winston |
| `keep-alive` | Every 14 minutes | Self-ping `/health/live` in production |
| `sports-news` | Every 30 minutes | Sync latest sports news (Vietnamese locale, 10 articles) |
| `batch-risk-scoring` | Every 30 minutes | Re-score 500 users through risk engine |
| `vip-expiry` | Every hour | Expire Dating VIP memberships past `endDate` |
| `purge-ip-blacklist` | Every 6 hours | Delete expired IP blacklist entries |
| `sports-fixtures` | Every 6 hours | Sync today + tomorrow fixtures from ApiFootball |
| `reset-daily-flags` | Daily 00:00 | Reset all `daily:*` Redis keys for check-in |
| `trade-profit-distribution` | Daily 00:05 | Distribute P2P investment profits to wallets |
| `game-yuebao-interest` | Daily 00:05 | Dispatch Yuebao daily interest to BullMQ |
| `agent-settlement-daily` | Daily 00:10 | Calculate previous-day agent commissions via BullMQ |
| `trade-mining-distribution` | Daily 01:00 | Distribute mining income to wallets |
| `game-rebate-settle` | Daily 01:00 | Mark previous-day calculated rebates as claimable |
| `adaptive-limits` | Daily 02:00 | Adjust per-user rate limits based on risk score |
| `trade-yuebao-settlement` | Daily 02:00 | Auto-settle matured Yuebao positions |
| `game-vip-check` | Daily 02:30 | Upgrade users who crossed a VIP deposit threshold |
| `clean-audit-logs` | Daily 03:00 | Delete audit logs older than 90 days (info/success only) |
| `sports-standings` | Daily 03:00 | Sync league standings from ApiFootball |
| `clean-security-logs` | Daily 04:00 | Delete security logs older than 30 days (low/medium severity) |
| `game-rebate-calculate` | Daily 23:55 | Calculate end-of-day rebates via BullMQ game-rebate queue |

---

## 5. BullMQ Workers (14 async workers)

Source: `apps/backend/src/modules/workers/`

| Worker file | Purpose |
|-------------|---------|
| `agent-settlement.worker.ts` | Daily commission calc for referring agents |
| `deposit-auto.worker.ts` | Auto-approve/reject pending deposits |
| `fraud-auto.worker.ts` | Automated fraud detection actions |
| `health-monitor.worker.ts` | System health checks via queue |
| `interest-payout.worker.ts` | Savings vault interest payouts |
| `lkvip-webhook-retry.worker.ts` | Retry failed payment gateway webhooks |
| `lottery-settlement.worker.ts` | Lottery round settlement |
| `rebate.worker.ts` | Game rebate calculation + settlement |
| `robot-bet.worker.ts` | Simulate betting activity (dev/staging) |
| `savingsVault-interest.worker.ts` | Vault-specific interest computation |
| `telegram-bot.worker.ts` | Telegram notification dispatch |
| `test.worker.ts` | Test/debug worker |
| `ticket-auto.worker.ts` | Auto-close/escalate support tickets |
| `withdraw-auto.worker.ts` | Auto-approve low-risk withdrawals |

---

## 6. Security Layers

| Layer | Mechanism |
|-------|-----------|
| **Network edge** | Cloudflare WAF — blocks known attack patterns, DDoS protection, bot management |
| **Transport** | TLS 1.2+ everywhere. Let's Encrypt certs auto-renewed via `certbot.timer` |
| **Server firewall** | UFW — only ports 22 (SSH key only), 80, 443 open. Fail2ban for SSH brute-force |
| **Application auth** | JWT (short-lived access token) + HTTP-only refresh cookie. 2FA via TOTP |
| **API protection** | Rate limiting per IP + per user (Redis). `projectAccessGuard` validates project scope |
| **Input validation** | Joi schemas on every backend endpoint before service call |
| **Database** | Prisma parameterised queries (no raw SQL in services). AES-256 for sensitive columns |
| **External apps** | Supabase Row Level Security (RLS) via `prisma/supabase/rls-policies.sql` |
| **Risk engine** | 15 detectors: fraud, bot, DDoS, brute-force, AML, compliance, geo, device-fingerprint, transaction monitor, security monitor |

---

## 7. Monitoring Stack

| Tool | Purpose | How to access |
|------|---------|---------------|
| **PM2** | Process management, auto-restart, cluster mode | `pm2 status` / `pm2 monit` on VPS |
| **PM2 logs** | Application stdout/stderr with rotation | `pm2 logs lkvip-api --lines 100` |
| **Winston** | Structured JSON logging inside Express | `/var/LKVIP/logs/lkvip-api-out.log` |
| **Prometheus** | Metrics endpoint (guarded by `METRICS_API_KEY`) | `GET /metrics` on backend |
| **Grafana** | Dashboards for request rate, DB query time, queue depth | `config/monitoring/grafana/` |
| **Sentry** | Runtime error tracking (frontend + backend) | Sentry dashboard |
| **Vercel Analytics** | Web Vitals per-page, real-user LCP/FID/CLS | Vercel dashboard per project |
| **Health check** | Returns DB + Redis + queue status | `GET /health` on backend |

---

## 8. CI/CD Pipeline

```
Push to main branch
  │
  ├── ci.yml        — lint (OXLint + ESLint) + typecheck + Vitest
  ├── deploy.yml    — build backend + SCP to VPS + pm2 reload lkvip-api
  ├── deploy-vercel.yml — detect changed apps (dorny/paths-filter)
  │     ├── deploy-hub        (if apps/hub/** or packages/** changed)
  │     ├── deploy-game       (if apps/game/** or packages/** changed)
  │     ├── deploy-trading    (if apps/trading/** or packages/** changed)
  │     ├── deploy-dating     (if apps/dating/** or packages/** changed)
  │     ├── deploy-sports     (if apps/sports/** or packages/** changed)
  │     ├── deploy-admin      (if apps/admin-dashboard/** or packages/** changed)
  │     ├── deploy-portal     (if apps/lkvipgroup-portal/** changed)
  │     ├── deploy-banking    (if apps/banking/** or packages/** changed)
  │     ├── deploy-invest     (if apps/invest/** or packages/** changed)
  │     ├── deploy-store      (if apps/lkvip-store/** or packages/** changed)
  │     └── deploy-academy    (if apps/academy/** or packages/** changed)
  └── prisma-check.yml — validate Prisma schemas on PR
```

**Manual deploy**: `./scripts/deploy-vercel.sh --prod` or GitHub Actions → workflow_dispatch.

---

## 9. Database Layout

| Schema | Database | Used by |
|--------|----------|---------|
| `admin` | `admin_db` | Admin Dashboard, risk engine, audit logs |
| `game` | `game_db` | Game, VIP, rebates, Yuebao |
| `hub` | `hub_db` | Hub CMS, news, banners |
| `trade` | `trade_db` | Trading, P2P, price history, orders |
| `dating` | `dating_db` | Dating profiles, matches, VIP memberships |
| `sports` | `sports_db` | Matches, leagues, live scores, fixtures |
| `supabase` | PostgreSQL (Supabase cloud) | Banking, Invest, Store, Academy (external apps with RLS) |

**Connection**: All MySQL schemas via `lkvip_db@127.0.0.1:3306`. Prisma client factory at `apps/backend/src/config/databases.ts` — never call `new PrismaClient()` directly.

---

## 10. Core Web Vitals Targets

| App | Metric | Target | Primary lever |
|-----|--------|--------|---------------|
| Hub | LCP | < 1.8s | Route splitting + lazy feed images |
| Game | LCP | < 2.0s | Preload banner + lazy thumbnails + separate recharts chunk |
| Trading | LCP | < 2.0s | Defer recharts chunk + fixed chart container height |
| Dating | LCP | < 2.2s | Fixed swipe-card height + lazy profile images |
| Sports | LCP | < 2.0s | Defer hls.js chunk + lazy below-fold images |
| All SPAs | CLS | < 0.08 | Explicit `width`/`height` on all `<img>` + Tailwind `aspect-*` containers |
| All SPAs | TTI | < 3.0s | `React.lazy` route-level splitting + Vite `manualChunks` |
