# Storage Allocation — Supabase, Cloudflare R2 & VPS Host

Hướng dẫn này quy định chính xác **dữ liệu nào lưu ở đâu** trong hệ sinh thái LKVIP Group.

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│  Bộ nhớ có cấu trúc (quan hệ, ACID) → Supabase (external apps)     │
│  File tĩnh, ảnh, video, backup       → Cloudflare R2               │
│  Core data, giao dịch nhanh, cache   → VPS MySQL + Redis            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. VPS Host — MySQL + Redis

### Dữ liệu lưu trên MySQL (VPS)

| Database | Nội dung |
|----------|---------|
| `hub_db` | Users, posts, articles, comments, notifications |
| `game_db` | Bets, jackpots, game sessions, robot accounts |
| `trade_db` | Orders, positions, wallets, price snapshots |
| `dating_db` | Profiles, matches, swipes, gifts, conversations |
| `sports_db` | Fixtures, standings, bets, live scores |
| `admin_db` | Admin users, audit log, system settings |

**Lý do:** Tần suất ghi cao (game loop, price feed, swipes), low latency, không bị giới hạn
bandwidth như Supabase, gần backend hơn → không có round-trip network overhead.

### Dữ liệu lưu trên Redis (VPS)

| Key pattern | Nội dung | TTL |
|-------------|---------|-----|
| `session:<userId>` | JWT session | 2h |
| `rl:<ip>:<route>` | Rate limiting counter | 60s |
| `price:<symbol>` | Giá real-time (Binance/CoinGecko) | 30s |
| `jackpot:<gameId>` | Jackpot pool amount | no TTL |
| `match:<userId>` | Dating match candidates | 5m |
| `queue:*` | BullMQ job queues | managed by BullMQ |

### Dữ liệu lưu trên local filesystem (tạm thời)

| Path | Nội dung | Hành động |
|------|---------|-----------|
| `data/uploads/` | File user upload trước khi xử lý | Process → upload R2 → xóa local |
| `data/backups/` | mysqldump trước khi upload R2 | Upload R2 → xóa local (giữ 3 ngày) |
| `data/logs/` | Winston + PM2 logs | Archive weekly → upload R2 → xóa local |

---

## 2. Cloudflare R2 — Object Storage

### Bucket: `lkvip-assets` (public CDN)

Bật public access trên paths sau:

```
lkvip-assets/
├── avatars/
│   ├── hub/          ← avatar Hub users
│   ├── game/         ← avatar game players
│   ├── dating/       ← profile photos (KHÔNG public — dùng signed URLs)
│   └── admin/        ← avatar admin users
├── banners/
│   ├── hub/          ← banners bài viết, trang chủ
│   ├── game/         ← banners promotion game
│   └── dating/       ← banners sự kiện dating
├── products/
│   └── market/       ← ảnh sản phẩm Market
├── courses/
│   └── academy/      ← thumbnail + video khóa học
├── receipts/
│   └── bankapp/      ← receipt nạp/rút (KHÔNG public — dùng signed URLs)
└── uploads/          ← file user upload đã được xử lý
    ├── hub/
    ├── game/
    ├── dating/       ← ảnh dating đã resize (KHÔNG public — dùng signed URLs)
    └── market/
```

### Bucket: `lkvip-backups` (private — KHÔNG public)

```
lkvip-backups/
├── db/
│   ├── mysql/
│   │   └── YYYY-MM-DD/
│   │       ├── hub_db.sql.gz
│   │       ├── game_db.sql.gz
│   │       ├── trade_db.sql.gz
│   │       ├── dating_db.sql.gz
│   │       ├── sports_db.sql.gz
│   │       └── admin_db.sql.gz
│   └── supabase/
│       └── YYYY-MM-DD/
│           └── supabase_dump.sql.gz
└── logs/
    └── YYYY-WW/
        ├── lkvip-api-out.log.gz
        └── lkvip-api-err.log.gz
```

**Env vars liên quan:**
```dotenv
# Bucket public assets (avatars, banners, products)
STORAGE_PROVIDER=s3
S3_BUCKET=lkvip-assets
S3_REGION=auto
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY=<r2_token_access_key>
S3_SECRET_KEY=<r2_token_secret_key>
CDN_BASE_URL=https://assets.tc-gaming.live

# Bucket private backups
ARCHIVE_ENABLED=true
ARCHIVE_BUCKET=lkvip-backups
ARCHIVE_S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
ARCHIVE_S3_ACCESS_KEY_ID=<r2_token_access_key>
ARCHIVE_S3_SECRET_ACCESS_KEY=<r2_token_secret_key>
```

### Upload path convention (theo module)

| Module / App | R2 path pattern |
|---|---|
| Hub user avatar | `avatars/hub/<userId>.<ext>` |
| Game player avatar | `avatars/game/<userId>.<ext>` |
| Dating profile photo | `avatars/dating/<userId>_<n>.<ext>` |
| Hub banner | `banners/hub/<slug>.<ext>` |
| Game promotion banner | `banners/game/<slug>.<ext>` |
| Market product image | `products/market/<productId>_<n>.<ext>` |
| Academy video | `courses/academy/<courseId>/video_<lessonId>.mp4` |
| Academy thumbnail | `courses/academy/<courseId>/thumb.<ext>` |
| BankApp receipt | `receipts/bankapp/<txnId>.<ext>` |
| User upload (general) | `uploads/<app>/<userId>/<uuid>.<ext>` |

---

## 3. Supabase — External Apps PostgreSQL

Chỉ dùng Supabase cho **external apps** (không phải 6 core apps).
6 core apps (Hub, Game, Trading, Dating, Sports, Admin) LUÔN dùng MySQL VPS.

### Apps dùng Supabase

| App | Tables cần tạo | RLS |
|-----|---------------|-----|
| **BankApp** | `users`, `accounts`, `transactions`, `cards`, `kyc_documents` | ✅ bắt buộc |
| **Academy** | `courses`, `lessons`, `enrollments`, `progress`, `certificates` | ✅ bắt buộc |
| **Invest** | `packages`, `investments`, `returns`, `wallet` | ✅ bắt buộc |
| **Market** | `products`, `categories`, `orders`, `order_items`, `cart` | ✅ bắt buộc |
| **Chat** | `rooms`, `members`, `messages`, `attachments` | ✅ bắt buộc |
| **Todo** | `tasks`, `labels`, `task_labels`, `assignments` | ✅ bắt buộc |
| **Expense Tracker** | `expenses`, `categories`, `budgets`, `recurring` | ✅ bắt buộc |

> SQL cho tất cả RLS policies đã được tạo tại:
> `apps/backend/prisma/supabase/rls-policies.sql`

### Supabase Auth

Mỗi external app dùng **Supabase Auth** thay vì custom JWT:
- Sign up/sign in qua `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()`
- Backend verify JWT bằng `authenticateSupabase` middleware (đã implement)
- RLS policy dùng `auth.uid()` để filter dữ liệu theo user

### Supabase Storage

External apps upload file qua Supabase Storage (không dùng R2 trực tiếp):
- Bucket `lkvip-uploads` trong Supabase project
- Backend dùng `STORAGE_PROVIDER=supabase` khi serve external apps
- File lớn (video Academy) → vẫn upload R2, chỉ lưu URL trong Supabase table

---

## 4. Decision Matrix — Chọn nơi lưu

```
Câu hỏi:
├── Cần ACID / quan hệ nhiều bảng?
│   ├── App core (Hub/Game/Trade/Dating/Sports/Admin)? → MySQL VPS
│   └── App external (BankApp/Academy/Invest/Market/Chat/Todo/Expense)? → Supabase
│
├── Là file tĩnh (ảnh, video, PDF)?
│   ├── Public (avatar, banner, product image) → R2 lkvip-assets (public)
│   └── Private (receipt, document, dating photo) → R2 lkvip-assets + signed URL
│
├── Là backup?
│   └── → R2 lkvip-backups (private)
│
├── Cần latency < 5ms?
│   └── → Redis VPS (cache, session, rate-limit, queue)
│
└── Là log / telemetry?
    ├── Hot (< 7 ngày) → local filesystem (data/logs/)
    └── Cold (> 7 ngày) → R2 lkvip-backups/logs/ (compressed)
```

---

## 5. Image Upload Flow (Production)

```
User → Frontend → POST /api/<app>/upload
  ↓
Backend (multer in-memory, 10 MB limit)
  ↓
Resize với sharp:
  - Avatar:  200×200 (thumb) + 600×600 (full)
  - Banner:  1200×400 (webp)
  - Product: 400×400 (thumb) + 800×800 (full)
  ↓
Upload lên R2 (storageAdapter.upload)
  - path: avatars/<app>/<userId>.webp
  - contentType: image/webp
  - CacheControl: public, max-age=31536000, immutable
  ↓
Lưu URL vào MySQL / Supabase:
  - MySQL: UPDATE hub_users SET avatar_url = $url WHERE id = $userId
  - Supabase: UPDATE profiles SET avatar_url = $url WHERE id = auth.uid()
  ↓
Return CDN URL → Frontend hiển thị
```

**Không lưu binary file trong database.** Chỉ lưu URL string.

---

## 6. Private File Access Flow

Với files private (receipts, dating photos, KYC documents):

```
Frontend → GET /api/files/signed?path=receipts/bankapp/txn_123.pdf
  ↓
Backend:
  1. Verify user auth (JWT)
  2. Verify ownership (txn belongs to this user)
  3. Call storageAdapter.getSignedUrl(path, 900)  ← 15 phút
  4. Return { url: "https://..." }
  ↓
Frontend redirect sang signed URL → R2 serve file
```

Middleware `verifySignedUrl` tại:
`apps/backend/src/shared/middlewares/core/verifySignedUrl.ts`

---

## 7. Backup Flow (Tự động qua cron)

```
Cron: 02:00 UTC hàng ngày (scripts/backup.sh)
  ↓
Step 1: mysqldump từng database → gzip → data/backups/YYYY-MM-DD/
Step 2: Nếu ARCHIVE_ENABLED=true → upload lên R2 lkvip-backups/db/mysql/YYYY-MM-DD/
Step 3: Xóa local backups cũ hơn BACKUP_RETENTION_DAYS ngày
Step 4: Xóa R2 backups cũ hơn BACKUP_R2_RETENTION_DAYS ngày
Step 5: Nếu disk > 85% → Telegram alert
```

---

## 8. Giới hạn và khi nào nâng cấp

| Dịch vụ | Free tier | Nâng cấp khi |
|---------|-----------|--------------|
| **Supabase** | 500 MB DB, 1 GB Storage, 50k MAU | > 400 MB hoặc > 40k MAU |
| **R2** | 10 GB storage, 1M Class A ops/tháng | > 8 GB storage |
| **VPS MySQL** | 160 GB SSD | Disk > 70% |
| **Redis** | 1 GB RAM (config) | `used_memory` > 800 MB |

Monitor hàng ngày bằng `scripts/health-check.sh` (cron 09:00, 21:00 UTC).
