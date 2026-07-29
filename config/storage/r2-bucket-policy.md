# Cloudflare R2 Bucket Policy & Setup Guide

## Overview

LKVIP sử dụng 2 R2 buckets:

| Bucket | Access | Mục đích |
|--------|--------|---------|
| `lkvip-assets` | Public CDN | Avatars, banners, product images, course thumbnails |
| `lkvip-backups` | Private | MySQL dumps, Supabase dumps, log archives |

---

## 1. Tạo Buckets

### Bước 1 — Log in Cloudflare Dashboard

1. Vào [dash.cloudflare.com](https://dash.cloudflare.com)
2. Chọn account → **R2 Object Storage** → **Create bucket**

### Bước 2 — Bucket `lkvip-assets` (public)

- **Name:** `lkvip-assets`
- **Location:** Automatic (global CDN)
- **Storage class:** Standard

Sau khi tạo:
1. **Settings → Public access → Allow Access** → Enable
2. **Custom domain → Add domain**: `assets.tc-gaming.live`
   - Cloudflare tự add CNAME record vì domain cùng Cloudflare account
3. Bật **Caching** (default 1 year cho immutable assets)

### Bước 3 — Bucket `lkvip-backups` (private)

- **Name:** `lkvip-backups`
- **Location:** Automatic
- **Storage class:** Standard
- **Public access:** DISABLED (default)

---

## 2. Tạo R2 API Token

1. Cloudflare Dashboard → **R2 → Manage R2 API Tokens → Create API Token**
2. **Permissions:** Object Read & Write
3. **Bucket access:** Select `lkvip-assets` AND `lkvip-backups`
4. Copy **Access Key ID** và **Secret Access Key** (hiển thị 1 lần)

Thêm vào `apps/backend/.env`:
```dotenv
S3_BUCKET=lkvip-assets
S3_REGION=auto
S3_ACCESS_KEY=<access_key_id>
S3_SECRET_KEY=<secret_access_key>
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
CDN_BASE_URL=https://assets.tc-gaming.live

ARCHIVE_ENABLED=true
ARCHIVE_BUCKET=lkvip-backups
ARCHIVE_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
ARCHIVE_S3_ACCESS_KEY_ID=<access_key_id>
ARCHIVE_S3_SECRET_ACCESS_KEY=<secret_access_key>
```

Find `ACCOUNT_ID`: Cloudflare Dashboard → right sidebar → **Account ID**.

---

## 3. CORS Configuration (lkvip-assets)

R2 Dashboard → `lkvip-assets` → **Settings → CORS policy → Add rule**

```json
[
  {
    "AllowedOrigins": [
      "https://tc-gaming.live",
      "https://hub.tc-gaming.live",
      "https://game.tc-gaming.live",
      "https://trade.tc-gaming.live",
      "https://dating.tc-gaming.live",
      "https://sports.tc-gaming.live",
      "https://admin.tc-gaming.live",
      "https://lkvip-hub.vercel.app",
      "https://lkvip-game.vercel.app",
      "https://lkvip-trading.vercel.app",
      "https://lkvip-dating.vercel.app",
      "https://lkvip-sports.vercel.app",
      "https://lkvip-admin.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

> `lkvip-backups` không cần CORS (backend-only access).

---

## 4. Lifecycle Rules (tự động xóa backups cũ)

R2 Dashboard → `lkvip-backups` → **Settings → Object lifecycle → Add rule**

| Rule | Prefix | Action | Days |
|------|--------|--------|------|
| Expire daily MySQL dumps | `db/mysql/` | Delete | 30 |
| Expire Supabase dumps | `db/supabase/` | Delete | 30 |
| Expire log archives | `logs/` | Delete | 90 |

---

## 5. Directory Structure

### `lkvip-assets/` (public CDN)

```
lkvip-assets/
├── avatars/
│   ├── hub/             → https://assets.tc-gaming.live/avatars/hub/<userId>.webp
│   ├── game/            → https://assets.tc-gaming.live/avatars/game/<userId>.webp
│   ├── dating/          → SIGNED URL only (private profile photos)
│   └── admin/           → https://assets.tc-gaming.live/avatars/admin/<userId>.webp
├── banners/
│   ├── hub/             → https://assets.tc-gaming.live/banners/hub/<slug>.webp
│   ├── game/            → https://assets.tc-gaming.live/banners/game/<slug>.webp
│   └── dating/          → https://assets.tc-gaming.live/banners/dating/<slug>.webp
├── products/
│   └── market/          → https://assets.tc-gaming.live/products/market/<id>_<n>.webp
├── courses/
│   └── academy/
│       └── <courseId>/  → thumbnail.webp, video_<lessonId>.mp4
├── receipts/
│   └── bankapp/         → SIGNED URL only (private receipts)
└── uploads/
    ├── hub/
    ├── game/
    ├── dating/          → SIGNED URL only
    └── market/
```

### `lkvip-backups/` (private)

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

---

## 6. Cache Headers (Cloudflare Transform Rules)

Thêm Transform Rule trong Cloudflare Dashboard → Rules → Transform Rules:

**Rule: Immutable static assets**
- Match: `starts_with(http.request.uri.path, "/avatars/") or starts_with(http.request.uri.path, "/banners/") or starts_with(http.request.uri.path, "/products/")`
- Header: `Cache-Control: public, max-age=31536000, immutable`

**Rule: Course videos (revalidate)**
- Match: `starts_with(http.request.uri.path, "/courses/")`
- Header: `Cache-Control: public, max-age=3600, s-maxage=86400`

---

## 7. WAF Rule — Block direct bucket access

Để bắt buộc traffic đi qua custom domain (không qua `*.r2.dev`):

Cloudflare Dashboard → Security → WAF → Custom Rules:
```
(http.host eq "pub-<hash>.r2.dev") → Block
```

---

## 8. Checklist Setup

- [ ] Bucket `lkvip-assets` tạo xong, public access enabled
- [ ] Custom domain `assets.tc-gaming.live` linked
- [ ] Bucket `lkvip-backups` tạo xong, public access disabled
- [ ] R2 API token tạo (Object Read & Write, cả 2 buckets)
- [ ] CORS rule thêm vào `lkvip-assets`
- [ ] Lifecycle rules thêm vào `lkvip-backups`
- [ ] `.env` cập nhật với S3_* và ARCHIVE_* vars
- [ ] `STORAGE_PROVIDER=s3` set trong production `.env`
- [ ] Test upload: `curl -X POST https://api.tc-gaming.live/api/hub/upload/avatar`
- [ ] Test CDN: `curl -I https://assets.tc-gaming.live/avatars/hub/test.webp`
