# LKVIP Group — Ecosystem Summary & Frontend Performance

## Overview

This plan documents the actual LKVIP monorepo architecture, how each sub-project operates, and
lays out the actionable work needed to consolidate the ecosystem summary documentation and
achieve the Core Web Vitals targets discussed by the team.

The monorepo lives at `/var/LKVIP` and is a pnpm + Turborepo workspace containing **15 core apps**
and **11 shared packages**. Frontend apps (Hub, Game, Trading, Dating, Sports + 6 secondary apps)
are already deployed on **Vercel** via a per-app project model. The backend (Express + Prisma +
BullMQ) runs on a VPS via PM2.

**Scope**: Three workstreams —
1. Fix the `vercel.json` `cd../..` spacing bug in Dating, Sports, and Admin Dashboard
2. Write accurate ecosystem documentation (`docs/ECOSYSTEM.md`)
3. Apply concrete frontend performance optimisations (route splitting, lazy loading, image fixes) to the 5 core SPAs

---

## Architecture Reality Check (grounded in actual code)

| Layer | Actual implementation |
|---|---|
| Frontend hosting | Vercel — 11 separate projects, each with `vercel.json` |
| CI/CD for frontends | `.github/workflows/deploy-vercel.yml` — path-filtered, parallel deploy jobs |
| Backend | PM2 `lkvip-api` (cluster) on VPS, `api.tc-gaming.live → localhost:5000` |
| Portal | PM2 `lkvip-portal` (fork) on VPS, `portal.tc-gaming.live → localhost:3010` |
| Database | 6 MySQL schemas on VPS + Supabase/PostgreSQL for external apps |
| Cache/Queue | Redis 7 + BullMQ (14 workers) |
| Build tool | Turborepo 2.0 — task caching across all workspaces |
| Linting | OXLint (all Vite SPAs), ESLint (Admin Dashboard + backend) |
| Mobile | Capacitor v7 wraps Hub, Game, Trading, Dating, Sports as native apps |
| PWA | vite-plugin-pwa on all Vite SPAs (already configured) |

---

## Sub-Tasks

---

### Sub-Task 1 — Fix `vercel.json` spacing bug in Dating, Sports, Admin Dashboard

**Status**: `[ ] pending`

**Intent**
The `installCommand` and `buildCommand` in `apps/dating/vercel.json`, `apps/sports/vercel.json`,
and `apps/admin-dashboard/vercel.json` are missing the space after `cd`
(e.g. `"cd../.. && ..."` instead of `"cd ../.. && ..."`). This is a latent shell error that would
cause Vercel to fail on a clean install if triggered via CLI.

**Expected Outcomes**
- `apps/dating/vercel.json` has `"installCommand": "cd ../.. && pnpm install --frozen-lockfile"`
- `apps/sports/vercel.json` has `"installCommand": "cd ../.. && pnpm install --frozen-lockfile"`
- `apps/admin-dashboard/vercel.json` has `"installCommand": "cd ../.. && pnpm install --frozen-lockfile"`
- Same fix applied to `buildCommand` in all three files

**Todo List**
1. Open `apps/dating/vercel.json` — fix `cd../..` → `cd ../..` in `installCommand` and `buildCommand`
2. Open `apps/sports/vercel.json` — same fix
3. Open `apps/admin-dashboard/vercel.json` — same fix

**Relevant Context**
- `apps/dating/vercel.json` — lines 4-5
- `apps/sports/vercel.json` — lines 4-5
- `apps/admin-dashboard/vercel.json` — lines 4-5
- Compare against the correct format in `apps/hub/vercel.json` and `apps/game/vercel.json`

---

### Sub-Task 2 — Write Official Ecosystem Documentation

**Status**: `[ ] pending`

**Intent**
Create `docs/ECOSYSTEM.md` as the canonical reference for the LKVIP platform — app catalogue,
deployment topology, data-flow, cron jobs, security layers, and monitoring. This replaces the
informal summary discussed in chat.

**Expected Outcomes**
- `docs/ECOSYSTEM.md` exists with accurate app catalogue (15 core apps, all with correct ports and deployment targets)
- Deployment topology section explains VPS vs Vercel split and which subdomains point where
- Data-flow section describes the path: Browser → Cloudflare → Vercel (frontend) / VPS Nginx (API)
- Cron jobs table sourced from actual BullMQ worker files
- Security and monitoring sections sourced from deploy.md and architecture.md

**Todo List**
1. List `apps/backend/src/modules/workers/` to get the exact worker names and their cron schedules
2. Read `apps/backend/src/config/` for any cron config files
3. Write `docs/ECOSYSTEM.md` with sections:
   - App Catalogue (table: name, package, framework, port, deployment target)
   - Deployment Topology (VPS backend + 11 Vercel frontends)
   - Request Data-Flow (browser → CDN → frontend/API → DB)
   - Cron Jobs (job, schedule, purpose)
   - Security Layers (Cloudflare, UFW, JWT, rate-limit, Prisma RLS)
   - Monitoring Stack (PM2, Sentry, Prometheus, Grafana, UptimeRobot)

**Relevant Context**
- `apps/backend/src/modules/workers/` — BullMQ workers
- `.bob/skills/lkvip-group/reference/deploy.md` — VPS topology
- `.bob/skills/lkvip-group/reference/architecture.md` — monorepo layout
- `config/vercel/SETUP.md` — Vercel project names and custom domains

---

### Sub-Task 3 — Route-Level Code Splitting (Core 5 SPAs)

**Status**: `[ ] pending`

**Intent**
Apply `React.lazy` + `Suspense` at the route level for all 5 core SPAs (Hub, Game, Trading,
Dating, Sports). This is the single highest-impact change for TTI and TBT — the initial JS bundle
loaded on first paint shrinks to only the entry route's code.

**Expected Outcomes**
- Each app's router file uses `React.lazy(() => import('./pages/...'))` for all non-entry routes
- A `<Suspense fallback={...}>` wraps the route tree (use the existing `<Loader />` or skeleton component from `@lkvip/ui` if available)
- `vite.config.ts` in each app has `build.rollupOptions.output.manualChunks` separating vendor libraries into their own chunks
- `pnpm turbo run build --filter=@lkvip/hub --filter=@lkvip/game --filter=@lkvip/trade --filter=@lkvip/dating --filter=@lkvip/sports` succeeds with no TypeScript errors

**Todo List**
1. For each of the 5 apps, grep for the routing entrypoint:
   `grep -rl "createBrowserRouter\|<Routes\|<BrowserRouter" apps/<app>/src --include="*.tsx"`
2. In each routing file, replace static page imports with `React.lazy` dynamic imports
3. Wrap the `<RouterProvider>` or `<Routes>` with `<Suspense fallback={<PageLoader />}>`
4. In each `vite.config.ts`, add or update `build.rollupOptions.output.manualChunks` to split:
   - `vendor-react`: react, react-dom, react-router-dom
   - `vendor-charts`: recharts (Game, Trading)
   - `vendor-motion`: framer-motion (Game, Dating)
   - `vendor-hls`: hls.js (Sports)
5. Run `pnpm turbo run build --filter=...` and confirm `dist/assets/` contains separate chunk files

**Relevant Context**
- `apps/hub/src/` — routing + entry
- `apps/game/src/` — routing + recharts + framer-motion
- `apps/trading/src/` — routing + recharts + socket.io-client
- `apps/dating/src/` — routing + framer-motion + socket.io-client
- `apps/sports/src/` — routing + hls.js
- `apps/hub/vite.config.ts` — already has cacheDir and PWA; add manualChunks here
- `packages/ui/src/` — check for shared `<Loader>` or skeleton component to use as Suspense fallback

---

### Sub-Task 4 — Image Optimisation (lazy loading + CLS fix)

**Status**: `[ ] pending`

**Intent**
Add `loading="lazy"` to below-the-fold `<img>` elements and explicit `width`/`height` (or Tailwind
`aspect-*` classes) to all images across the 5 SPAs. This eliminates CLS from images loading
without reserved space and reduces bandwidth on initial page load.

**Expected Outcomes**
- All `<img>` tags have `loading="lazy"` except the first above-the-fold hero image (which gets `fetchpriority="high"`)
- All `<img>` tags have `width` + `height` attributes or a Tailwind `aspect-*` container class
- CLS improves from ~0.12–0.18 to target < 0.08 in Lighthouse
- If `@lkvip/ui` has a shared `<Image>` component, it is used instead of raw `<img>`

**Todo List**
1. Check `packages/ui/src/` for an existing `<Image>` or `<LazyImage>` component
2. Search for raw `<img` tags: `grep -rn "<img " apps/hub/src apps/game/src apps/trading/src apps/dating/src apps/sports/src --include="*.tsx"`
3. For each `<img>` found, add `loading="lazy"` (or `fetchpriority="high"` for the one hero image per page)
4. Add `width` and `height` attributes matching the image's natural aspect ratio (see `reference/image-standards.md`)
5. For game thumbnails / dating profile photos in lists — ensure a fixed-height Tailwind container wraps the image
6. Run `pnpm turbo run build --filter=...` and confirm no TS errors introduced

**Relevant Context**
- `.bob/skills/lkvip-group/reference/image-standards.md` — required dimensions per image type
- `packages/ui/src/` — shared UI components
- Game app: banner images and game card thumbnails are the primary CLS sources
- Dating app: profile swipe cards are the primary CLS source

---

### Sub-Task 5 — Update Skill Reference Files

**Status**: `[ ] pending`

**Intent**
Add a troubleshooting entry for the `cd../..` spacing bug to `deploy.md` so future developers
know the fix, and verify `architecture.md`'s Vercel app list matches the actual workflow.

**Expected Outcomes**
- `deploy.md` Troubleshooting section has a row for the `cd` spacing bug
- `architecture.md` Vercel-deployed apps list matches all 11 projects in `deploy-vercel.yml`
- No other changes to these files

**Todo List**
1. Open `.bob/skills/lkvip-group/reference/deploy.md` — add a Troubleshooting section after Section 8 (if not present) with entry: `vercel.json installCommand fails` → `Fix: add space after cd: "cd ../.. && ..."`
2. Open `.bob/skills/lkvip-group/reference/architecture.md` — find the "Vercel-deployed apps" list under Frontend Standards
3. Compare against `deploy-vercel.yml` jobs (hub, game, trading, dating, sports, portal, banking, invest, store, academy, admin) — add any missing apps to the list

**Relevant Context**
- `.bob/skills/lkvip-group/reference/deploy.md`
- `.bob/skills/lkvip-group/reference/architecture.md`
- `.github/workflows/deploy-vercel.yml` — canonical list of 11 Vercel-deployed apps

---

## Deployment Flow (no changes required — already working)

```
Push to main
  - GitHub Actions ci.yml: lint + typecheck + test
  - GitHub Actions deploy.yml: build + SCP + PM2 reload (backend only)
  - GitHub Actions deploy-vercel.yml: path-filtered, 11 parallel Vercel deploys
      - detect changed apps via dorny/paths-filter
      - per-app jobs via amondnet/vercel-action@v25
          - pnpm install --frozen-lockfile
          - pnpm turbo run build --filter=@lkvip/<app>
          - vercel deploy --prod
```

## Vercel Project Domain Mapping

| App | Vercel project | Custom domain |
|---|---|---|
| Hub | lkvip-hub | hub.tc-gaming.live |
| Game | lkvip-game | game.tc-gaming.live |
| Trading | lkvip-trading | trade.tc-gaming.live |
| Dating | lkvip-dating | dating.tc-gaming.live |
| Sports | lkvip-sports | sports.tc-gaming.live |
| Admin | lkvip-admin | admin.tc-gaming.live |
| Portal | lkvipgroup-portal | lkvip.group |
| Banking | lkvip-banking | TBD |
| Invest | lkvip-invest | TBD |
| Store | lkvip-store | TBD |
| Academy | lkvip-academy | TBD |

## Core Web Vitals Targets

| App | Current LCP | Target LCP | Primary lever |
|---|---|---|---|
| Hub | ~2.5s | < 1.8s | Route splitting + lazy feed images |
| Game | ~2.8s | < 2.0s | Preload banner + lazy thumbnails + recharts chunk |
| Trading | ~3.5s | < 2.0s | Defer recharts + socket chunk + fixed chart height |
| Dating | ~3.0s | < 2.2s | Fixed card height + lazy profile images |
| Sports | ~3.2s | < 2.0s | Defer hls.js chunk + lazy images below fold |
