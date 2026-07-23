# Module Documentation — Multi-Project Ecosystem

**Version:** 2.0 · **Backend port:** 5000 · **All APIs prefix:** `/api`

---

## Table of Contents

1. [Hub](#1-hub)
2. [Game](#2-game)
3. [LKvip](#3-lkvip)
4. [Trade](#4-trade)
5. [Dating](#5-dating)
6. [Sports](#6-sports)
7. [Admin](#7-admin)
8. [Shared Infrastructure](#8-shared-infrastructure)

---

## 1. Hub

**Purpose:** Public portal — news, games directory, tools, websites directory, CMS pages, SEO, events, downloads.

**Frontend:** `source/frontend/hub/` · Port 5173 · Capacitor mobile support  
**Backend routes:** `source/backend/src/modules/hub/routes/index.js`  
**DB:** `hub_db` (`HUB_DATABASE_URL`)

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/hub/auth/register` | — | Register user |
| POST | `/api/hub/auth/login` | — | Login |
| POST | `/api/hub/auth/refresh-token` | — | Refresh JWT |
| GET | `/api/hub/games` | — | Game catalogue (cached 5m) |
| GET | `/api/hub/games/:slug` | — | Game detail (cached 10m) |
| GET | `/api/hub/categories` | — | Categories (cached 10m) |
| GET | `/api/hub/websites` | — | Websites directory (cached 5m) |
| GET | `/api/hub/tools` | — | Tools list (cached 5m) |
| GET | `/api/hub/news` | — | News list (cached 2m) |
| GET | `/api/hub/news/:slug` | — | News detail (cached 5m) |
| GET | `/api/hub/banners` | — | Banners (cached 5m) |
| GET | `/api/hub/menus/:location` | — | Menu by location (cached 10m) |
| GET | `/api/hub/search` | — | Full-text search |
| POST | `/api/hub/feedback` | — | Submit feedback |
| GET | `/api/hub/profile` | ✓ | Current user profile |
| PUT | `/api/hub/profile` | ✓ | Update profile |
| GET | `/api/hub/favorites` | ✓ | User favorites |
| GET | `/api/hub/events` | — | Events list |
| POST | `/api/hub/events/:id/register` | ✓ | Register for event |
| GET | `/api/hub/downloads` | — | Download links |
| GET | `/api/hub/admin/*` | ✓ admin | Admin CRUD for all content |

### Database Models
`User`, `Game`, `Category`, `Website`, `Tool`, `News`, `NewsComment`, `Page`, `Banner`, `Menu`, `Feedback`, `Notification`, `Favorite`, `SeoMeta`, `Event`, `EventRegistration`, `DownloadLink`, `Setting`

---

## 2. Game

**Purpose:** Online gaming platform — games catalogue, wallet, deposits, withdrawals, VIP, promotions, lottery, live sessions.

**Frontend:** `source/frontend/game/` · Port 5174 · Capacitor mobile support  
**Backend routes:** `source/backend/src/modules/game/routes/index.js`  
**DB:** `game_db` (`GAME_DATABASE_URL`)

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/game/auth/register` | — | Register |
| POST | `/api/game/auth/login` | — | Login |
| GET | `/api/game/games` | — | Games catalogue |
| GET | `/api/game/promotions` | — | Active promotions |
| GET | `/api/game/vip/levels` | — | VIP tier info |
| GET | `/api/game/wallet/balance` | ✓ | Balance |
| POST | `/api/game/wallet/deposit` | ✓ | Create deposit order |
| POST | `/api/game/wallet/withdraw` | ✓ | Create withdrawal |
| GET | `/api/game/vip/me` | ✓ | User VIP status |
| POST | `/api/game/sessions/launch` | ✓ | Launch game session |
| GET | `/api/game/launch` | ✓ | Advanced launch (provider resolve) |
| GET | `/api/game/lottery/types` | — | Lottery game types |
| POST | `/api/game/lottery/bet` | ✓ | Place lottery bet |
| POST | `/api/game/callbacks/gsc` | — | GSC provider callback |
| POST | `/api/game/callbacks/goldgate/*` | — | GoldGate callbacks |
| GET | `/api/game/admin/users` | ✓ admin | List game users |
| GET | `/api/game/admin/deposits` | ✓ admin | Pending deposits |

### Database Models
`User`, `Wallet`, `Transaction`, `DepositOrder`, `WithdrawOrder`, `Game`, `GameCategory`, `GameSession`, `VipLevel`, `UserVip`, `Promotion`, `PromotionClaim`, `Notification`, `LotteryType`, `LotteryDraw`, `LotteryBet`

---

## 3. LKvip

**Purpose:** LK VIP payment module — deposit / withdrawal / balance queries for VIP users. Shares `game_db` via projectResolver.

**Backend routes:** `source/backend/src/modules/lkvip/routes/`  
**DB:** `game_db` (same as game module — proxied via `projectResolver.js`)

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/lkvip/balance` | ✓ | VIP balance |
| POST | `/api/lkvip/deposit` | ✓ | VIP deposit |
| POST | `/api/lkvip/withdraw` | ✓ | VIP withdrawal |
| POST | `/api/lkvip/webhook` | — | Payment webhook (HMAC verified) |
| GET | `/api/lkvip/admin/*` | ✓ admin | Admin management |

---

## 4. Trade

**Purpose:** Binary/crypto trading platform — order book, orders, wallet, KYC, market data.

**Frontend:** `source/frontend/trade/` · Port 5177  
**Backend routes:** `source/backend/src/modules/trade/routes/index.js`  
**DB:** `trade_db` (`TRADE_DATABASE_URL`)

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/trade/auth/register` | — | Register |
| POST | `/api/trade/auth/login` | — | Login |
| GET | `/api/trade/pairs` | — | Trading pairs |
| GET | `/api/trade/pairs/:symbol/orderbook` | — | Order book |
| GET | `/api/trade/orders` | ✓ | User orders |
| POST | `/api/trade/orders` | ✓ | Place order |
| DELETE | `/api/trade/orders/:id` | ✓ | Cancel order |
| GET | `/api/trade/wallet` | ✓ | Multi-currency balances |
| POST | `/api/trade/wallet/deposit` | ✓ | Deposit |
| POST | `/api/trade/wallet/withdraw` | ✓ | Withdrawal |
| POST | `/api/trade/kyc` | ✓ | Submit KYC documents |
| GET | `/api/trade/admin/kyc/pending` | ✓ admin | Pending KYC queue |
| PUT | `/api/trade/admin/kyc/:userId/approve` | ✓ admin | Approve KYC |

### Database Models
`User`, `Wallet`, `Transaction`, `Order`, `TradePair`, `KycDocument`, `MarketTick`, `Notification`

---

## 5. Dating

**Purpose:** Social dating app — swipe/match, chat, live streaming, stories, gifts, gamification, VIP.

**Frontend:** `source/frontend/dating/` · Port 5176 · Capacitor + WebRTC  
**Backend routes:** `source/backend/src/modules/dating/routes/index.js`  
**DB:** `dating_db` (`DATING_DATABASE_URL`)  
**Socket.IO:** namespace `/dating`

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/dating/auth/send-otp` | — | Send OTP to phone |
| POST | `/api/dating/auth/verify-otp` | — | Verify OTP |
| POST | `/api/dating/auth/register` | — | Register with phone |
| GET | `/api/dating/match/candidates` | ✓ | Swipe candidates |
| POST | `/api/dating/match/like` | ✓ | Like / super-like |
| GET | `/api/dating/chat/rooms` | ✓ | Chat room list |
| POST | `/api/dating/chat/rooms/:id/messages` | ✓ | Send message |
| GET | `/api/dating/live` | — | Active live streams |
| POST | `/api/dating/live/start` | ✓ | Start stream |
| GET | `/api/dating/feed` | ✓ | Social feed |
| POST | `/api/dating/stories` | ✓ | Upload story |
| POST | `/api/dating/gifts/send` | ✓ | Send gift |
| GET | `/api/dating/vip/plans` | — | VIP plans |
| POST | `/api/dating/vip/subscribe` | ✓ | Subscribe VIP |
| GET | `/api/dating/wallet/balance` | ✓ | Coin/diamond balance |

### Database Models
`User`, `Match`, `Like`, `Message`, `ChatRoom`, `Story`, `StoryView`, `LiveStream`, `LiveMessage`, `Gift`, `GiftHistory`, `GamificationLevel`, `VipPlan`, `VipHistory`, `Wallet`, `Transaction`, `Notification`

---

## 6. Sports

**Purpose:** Sports news, live scores, betting, community, live streams, video highlights.

**Frontend:** `source/frontend/sports/` · Port 5178  
**Backend routes:** `source/backend/src/modules/sports/routes/index.js`  
**DB:** `sports_db` (`SPORTS_DATABASE_URL`)  
**Socket.IO:** namespace `/sports`

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sports/auth/register` | — | Register |
| POST | `/api/sports/auth/login` | — | Login |
| GET | `/api/sports/leagues` | — | Leagues list |
| GET | `/api/sports/matches` | — | Matches |
| GET | `/api/sports/matches/live` | — | Live matches |
| GET | `/api/sports/standings/:leagueId` | — | League standings |
| GET | `/api/sports/highlights` | — | Video highlights |
| GET | `/api/sports/news` | — | Sports articles |
| GET | `/api/sports/streams` | — | Live streams |
| POST | `/api/sports/streams` | ✓ | Start stream |
| POST | `/api/sports/betting/bets` | ✓ | Place bet |
| GET | `/api/sports/betting/my-bets` | ✓ | My bets |
| GET | `/api/sports/favorites` | ✓ | Favourites |
| POST | `/api/sports/favorites` | ✓ | Add favourite |
| GET | `/api/sports/search` | — | Search leagues/teams/matches |

### Database Models
`User`, `League`, `Team`, `Match`, `MatchEvent`, `Standing`, `Highlight`, `Article`, `ArticleComment`, `Post`, `PostComment`, `LiveStream`, `StreamChat`, `BettingEvent`, `BettingMarket`, `Bet`, `Favourite`, `Wallet`, `Notification`

---

## 7. Admin

**Purpose:** Super-admin cross-project management dashboard. Manages all 6 projects from a single panel.

**Frontend:** `source/frontend/admin-dashboard/` · Port 5180 (JSX, no TypeScript)  
**Backend routes:** `source/backend/src/modules/admin/routes/index.js`  
**DB:** `admin_db` (`ADMIN_DATABASE_URL`) — admin users, settings, audit logs  
**Guard:** All routes (except `/auth/login`, `/auth/refresh`) require `adminGuard`

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/auth/login` | — | Admin login |
| POST | `/api/admin/auth/refresh` | — | Refresh admin token |
| GET | `/api/admin/dashboard` | ✓ admin | Aggregated stats |
| GET | `/api/admin/users` | ✓ admin | Cross-project user list |
| PATCH | `/api/admin/users/:id/status` | ✓ admin | Ban / unban user |
| POST | `/api/admin/users/:id/balance` | ✓ admin | Adjust balance |
| GET | `/api/admin/finance/deposits` | ✓ admin | Pending deposits |
| PATCH | `/api/admin/finance/deposits/:id/approve` | ✓ admin | Approve deposit |
| GET | `/api/admin/finance/withdrawals` | ✓ admin | Pending withdrawals |
| PATCH | `/api/admin/finance/withdrawals/:id/approve` | ✓ admin | Approve withdrawal |
| GET | `/api/admin/settings` | ✓ admin | System settings |
| PUT | `/api/admin/settings/:key` | ✓ admin | Update setting |
| GET | `/api/admin/ui-config` | ✓ admin | UI / branding config |
| PUT | `/api/admin/ui-config` | ✓ admin | Bulk update UI config |
| GET | `/api/admin/logs/audit` | ✓ admin | Audit logs |
| GET | `/api/admin/announcements` | ✓ admin | Announcements |

### Database Models
`AdminUser`, `SystemLog`, `Setting`, `UiConfig`, `Announcement`

---

## 8. Shared Infrastructure

Located in `source/backend/src/shared/`.

### Middlewares

| File | Purpose |
|------|---------|
| `auth.js` | JWT Bearer token verification → `req.user` |
| `adminGuard.js` | Requires `role === 'admin' or 'super_admin'` |
| `projectResolver.js` | Sets `req.prisma` to correct DB client from URL path |
| `rateLimiter.js` | `publicLimiter` (60/min), `authLimiter` (10/min) |
| `httpCache.js` | Redis/memory HTTP response cache for public GETs |
| `auditLogger.js` | Logs admin mutations to audit log |
| `rbac.js` | Role-based access (isAdmin, isModerator helpers) |
| `upload.js` | Multer file upload (images, documents) |
| `validate.js` | Joi/yup request body validation |

### Services

| File | Purpose |
|------|---------|
| `authService.js` | hashPassword, comparePassword, generateTokens, verifyToken |
| `cacheService.js` | `get/set/del/remember/invalidate` — Redis + in-memory fallback |
| `walletService.js` | Balance operations, deposit/withdrawal processing |
| `notificationService.js` | Push notifications, in-app notification creation |
| `emailService.js` | Transactional emails (nodemailer / SMTP) |
| `paymentService.js` | Payment gateway adapter (VNPAY, MoMo, etc.) |
| `uploadService.js` | File save to disk/S3, avatar processing |
| `kycService.js` | KYC document processing |
| `loyaltyService.js` | Points, badges, streak rewards |
| `referralService.js` | Referral code tracking and rewards |
| `twoFactorService.js` | TOTP 2FA (speakeasy) |
| `logger.js` | Winston logger → `logs/` directory |

### Config

| File | Purpose |
|------|---------|
| `databases.js` | `getPrismaClient(project)` — returns PrismaClient for a DB |
| `redis.js` | ioredis client with in-memory fallback |
| `swagger.js` | Swagger UI at `/api/docs` |
| `cron.js` | node-cron scheduled jobs (VIP expiry, cache cleanup, audit log purge) |
| `socket.js` | `setIo/getIo/emitToUser/emitToRoom` — Socket.IO singleton |

### Socket.IO Namespaces

| Namespace | Module | Events |
|-----------|--------|--------|
| `/dating` | dating | `message`, `match`, `live:start`, `live:end`, `gift` |
| `/game` | game | `session:start`, `wallet:update` |
| `/sports` | sports | `score:update`, `match:event` |

---

## Environment Variables Quick Reference

See `.env.example` at the project root for all variables.

| Group | Variables |
|-------|-----------|
| **Databases** | `HUB_DATABASE_URL`, `GAME_DATABASE_URL`, `TRADE_DATABASE_URL`, `DATING_DATABASE_URL`, `SPORTS_DATABASE_URL`, `ADMIN_DATABASE_URL` |
| **JWT** | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| **Redis** | `REDIS_URL` (or `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD`) |
| **Server** | `PORT` (5000), `NODE_ENV`, `CORS_ORIGINS` |
| **Email** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` |
| **Payments** | `PAYMENT_SECRET_KEY`, `PAYMENT_MERCHANT_ID`, `VNPAY_*`, `MOMO_*` |
| **Features** | `ENABLE_2FA`, `ENABLE_REDIS_CACHE` |
