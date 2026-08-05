# Chuẩn Hóa Toàn Bộ Dự Án — Loại Bỏ MongoDB & Đúng Logic Ban Đầu
## LKVIP Group — Standardization Plan v2

---

## Top-Level Overview

**Goal:** Rà soát và chuẩn hóa toàn bộ monorepo theo đúng logic ban đầu:
- **Core platform** (hub, game, trading, dating, sports, banking, invest, store, academy, admin-dashboard, portal) → **MySQL 8 + Prisma** duy nhất, không MongoDB.
- **External apps** (`apps/external/`) → vẫn giữ MongoDB vì đây là isolated reference apps (không kết nối core), nhưng phải **bảo mật** đúng cách (xóa credentials cứng, fallback key).
- **Portal** (`apps/lkvipgroup-portal`) → xóa hoàn toàn MONGODB_URI khỏi config, chỉ dùng PostgreSQL (FORTRESS_DATABASE_URL).
- **Config & Env** → chuẩn hóa toàn bộ `.env.example` của core apps nhất quán.

**Scope:** Tập trung vào những gì SAI với logic ban đầu, không refactor bừa bãi.
**Out of scope:** Migration DB schema, TypeScript strict upgrade, Socket.IO Redis adapter (những việc lớn cần riêng).

**Root cause:** Một số file config (`lkvipgroup-portal/.env.example`) còn tham chiếu MongoDB legacy; external apps có hardcoded credentials; `academy/.env.example` thiếu production vars; `docs/STANDARDIZATION.md` còn pending tasks chưa implement.

---

## Sub-Tasks

---

### Sub-Task 1 — Xóa MongoDB khỏi lkvipgroup-portal config

**Status:** `[x] done` ✅ — portal .env.example đã được cập nhật (external change)

**Intent:**
`apps/lkvipgroup-portal/.env.example` hiện có `MONGODB_URI=mongodb://localhost:27017/fortress` được comment là "local dev / legacy" — nhưng portal thực tế dùng PostgreSQL qua `FORTRESS_DATABASE_URL`. Dòng này tạo confusion và sai logic ban đầu. Comment còn ghi nhầm "MySQL" thay vì "PostgreSQL".

**Expected Outcomes:**
- `apps/lkvipgroup-portal/.env.example` KHÔNG còn bất kỳ dòng nào liên quan MongoDB.
- `FORTRESS_DATABASE_URL` được uncomment và đặt là primary, đúng format PostgreSQL.
- Comment ghi rõ portal dùng PostgreSQL (Supabase/Prisma), không phải MySQL.

**Todo List:**
1. Mở `apps/lkvipgroup-portal/.env.example`
2. Xóa 3 dòng: comment "MongoDB legacy", `MONGODB_URI=...`, comment "MySQL" nhầm.
3. Uncomment và chỉnh `FORTRESS_DATABASE_URL` thành đúng format PostgreSQL: `postgresql://user:password@localhost/fortress_db`
4. Thêm comment giải thích rõ: `# Portal uses PostgreSQL via Prisma (Supabase cloud in production)`

**Relevant Context:**
- Sửa: `apps/lkvipgroup-portal/.env.example` (lines 7–11)
- Reference: Portal dùng better-auth + Prisma với PostgreSQL datasource (xem `apps/lkvipgroup-portal/next.config.ts`)
- Reference deploy plan: `.bob/plans/deploy-lkvip-vps.md`

---

### Sub-Task 2 — Xóa hardcoded MongoDB credentials khỏi anonymous-voice

**Status:** `[x] done`

**Intent:**
`apps/external/anonymous-voice/server/src/server.ts` line 23 có credentials Atlas bị comment: `"mongodb+srv://crmAdmin:vqtdVpU9nt9XgmJA@cluster0.a4iwm.mongodb.net/..."`. Mặc dù comment, credentials này vẫn visible trong git history và source code. Đây là security risk nghiêm trọng.

**Expected Outcomes:**
- Dòng commented credentials bị xóa hoàn toàn khỏi file.
- Các commented `logger.info` được restore lại từ `console.log` (code cleanliness).
- File server.ts chỉ dùng `config.database_url` từ env.

**Todo List:**
1. Mở `apps/external/anonymous-voice/server/src/server.ts`
2. Xóa dòng 23 (hardcoded Atlas URI commented)
3. Xóa 2 dòng comment `// logger.info` trùng với console.log bên dưới (lines 24, 29 approx) — giữ console.log
4. Thêm note trong `apps/external/anonymous-voice/server/env.example`: credentials phải được rotate ngay

**Relevant Context:**
- Sửa: `apps/external/anonymous-voice/server/src/server.ts` (line 23)
- Credentials đã exposed: `crmAdmin:vqtdVpU9nt9XgmJA` trên Atlas cluster0.a4iwm
- **Quan trọng:** Sau khi fix code, cần rotate credentials thủ công trên MongoDB Atlas dashboard

---

### Sub-Task 3 — Fix security: hardcoded encryption key trong landing/mfa.ts

**Status:** `[x] done`

**Intent:**
`apps/external/landing/server/src/utils/mfa.ts` có fallback cứng `'default-long-secret-key-32-chars!!'` khi `ENCRYPTION_KEY` env không set. Điều này khiến MFA secrets có thể bị decrypt bằng key mặc định đã biết. Theo logic ban đầu: không bao giờ dùng secrets cứng làm fallback production.

**Expected Outcomes:**
- `mfa.ts` throw Error nếu `ENCRYPTION_KEY` không được set thay vì dùng fallback.
- `apps/external/landing/server/.env.example` có `ENCRYPTION_KEY` là required (không default).
- Password logging trong `apps/external/landing/server/src/config/db.ts` line 32 được xóa.

**Todo List:**
1. Mở `apps/external/landing/server/src/utils/mfa.ts`
2. Thay `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-...'` thành:
   ```typescript
   const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
   if (!ENCRYPTION_KEY) throw new Error('[MFA] ENCRYPTION_KEY environment variable is required');
   ```
3. Mở `apps/external/landing/server/src/config/db.ts` line 32
4. Xóa dòng `console.log(\`🔑 Password: ${password}\n\`)` — giữ chỉ `console.log('[Admin Seeder] Default admin created')`
5. Update `apps/external/landing/server/.env.example` để đánh dấu ENCRYPTION_KEY là REQUIRED (không comment out, không có default)

**Relevant Context:**
- Sửa: `apps/external/landing/server/src/utils/mfa.ts` (line 5)
- Sửa: `apps/external/landing/server/src/config/db.ts` (line 32)
- Sửa: `apps/external/landing/server/.env.example` (ENCRYPTION_KEY section)

---

### Sub-Task 4 — Chuẩn hóa academy/.env.example theo production pattern

**Status:** `[x] done` ✅

**Intent:**
`apps/academy/.env.example` chỉ có 4 dòng tối giản, thiếu production section. Tất cả core Next.js apps (invest, store, portal) đều có commented production vars. Academy phải nhất quán theo đúng pattern này — đây là yêu cầu của `docs/STANDARDIZATION.md` sub-task 5 (còn pending).

**Expected Outcomes:**
- `apps/academy/.env.example` có đủ cả local và production (commented) sections.
- Port 3013, domain `academy.tc-gaming.live`, đúng pattern `${VAR:-default}`.
- Nhất quán 100% với `apps/invest/.env.example`.

**Todo List:**
1. Đọc `apps/invest/.env.example` để lấy đúng pattern
2. Sửa `apps/academy/.env.example` — thêm commented production section:
   ```
   # ── Production (VPS / PM2) — set via start-academy.sh or PM2 env ──
   # PORT=3013
   # HOSTNAME=127.0.0.1
   # NODE_ENV=production
   # NEXT_PUBLIC_API_URL=https://api.tc-gaming.live
   # NEXT_PUBLIC_APP_URL=https://academy.tc-gaming.live
   ```

**Relevant Context:**
- Sửa: `apps/academy/.env.example`
- Pattern: `apps/invest/.env.example`
- Port: 3013 (portal=3010, invest=3011, store=3012, academy=3013)
- Đây là Sub-Task 5 trong `docs/STANDARDIZATION.md` (còn pending)

---

### Sub-Task 5 — Academy start script + cập nhật docs/STANDARDIZATION.md

**Status:** `[x] done`

**Intent:**
Sau khi kiểm tra thực tế:
- `apps/academy/next.config.ts` ✅ đã có `output: "standalone"` → Sub-Task 1 của STANDARDIZATION.md là DONE
- `config/pm2/ecosystem.config.js` ✅ đã có entry `lkvip-academy` → Sub-Task 2 (PM2 part) DONE
- `config/nginx/tc-gaming.conf` ✅ đã có upstream + server blocks `academy.tc-gaming.live` → Sub-Task 3 DONE
- `apps/academy/start-academy.sh` ❌ **CHƯA TỒN TẠI** → cần tạo (PM2 dùng script này)
- `scripts/deploy.sh` ❌ không tồn tại tại root — Sub-Task 4 của STANDARDIZATION.md còn open
- `academy.tc-gaming.live` trong `CORS_ORIGINS` ✅ đã có trong `ecosystem.config.js`

**Expected Outcomes:**
- `apps/academy/start-academy.sh` được tạo với đúng pattern `${VAR:-default}`, PORT=3013.
- `docs/STANDARDIZATION.md` được cập nhật: Sub-Tasks 1, 2, 3 → `[x] done`; Sub-Task 4 → ghi rõ deploy.sh chưa có; Sub-Task 5 → `[x] done`.
- Section mới "MongoDB Standardization" được thêm vào STANDARDIZATION.md.

**Todo List:**
1. Tạo `apps/academy/start-academy.sh` — copy pattern từ `apps/invest/start-invest.sh`, thay port 3011→3013, domain invest→academy
2. Cập nhật `docs/STANDARDIZATION.md`:
   - Sub-Task 1 (next.config.ts) → `[x] done`
   - Sub-Task 2 (start script + PM2) → `[x] done` (start-academy.sh tạo ở bước 1, PM2 entry đã có)
   - Sub-Task 3 (Nginx) → `[x] done`
   - Sub-Task 4 (deploy.sh) → ghi note: deploy.sh chưa tồn tại tại `/scripts/deploy.sh`, đây là todo cho deploy sprint
   - Sub-Task 5 (academy .env.example) → `[x] done` (Sub-Task 4 của plan này)
3. Thêm section "## MongoDB & Security Standardization" vào cuối STANDARDIZATION.md

**Relevant Context:**
- Tạo: `apps/academy/start-academy.sh`
- Pattern: `apps/invest/start-invest.sh` (port 3011, standalone exec path)
- Sửa: `docs/STANDARDIZATION.md`

---

### Sub-Task 6 — Kiểm tra toàn bộ core apps không còn bất kỳ MongoDB reference nào

**Status:** `[x] done`

**Intent:**
Verification step: sau khi fix sub-tasks 1–4, chạy scan để xác nhận 100% core platform (apps/backend, apps/hub, apps/game, apps/trading, apps/dating, apps/sports, apps/banking, apps/invest, apps/lkvip-store, apps/academy, apps/admin-dashboard, apps/lkvipgroup-portal, apps/mobile) không còn bất kỳ MongoDB reference nào. External apps (`apps/external/`) được loại trừ khỏi scan này.

**Expected Outcomes:**
- Zero MongoDB references trong bất kỳ `.ts`, `.tsx`, `.js`, `.json`, `.env.example` file nào của core apps.
- `apps/lkvipgroup-portal/.env.example` không có `MONGODB_URI`.
- Tất cả DATABASE_URL trong core apps đều là `mysql://` hoặc `postgresql://` (cho portal).
- Kết quả scan được ghi vào `docs/CODEBASE_SCAN.md` (update section MongoDB).

**Todo List:**
1. Chạy grep `mongo|MONGO` trong các thư mục: `apps/hub`, `apps/game`, `apps/trading`, `apps/dating`, `apps/sports`, `apps/banking`, `apps/invest`, `apps/lkvip-store`, `apps/academy`, `apps/admin-dashboard`, `apps/lkvipgroup-portal`, `apps/backend`, `apps/mobile`
2. Nếu có kết quả ngoài mong đợi → fix ngay tại chỗ
3. Update section "Database" trong `docs/CODEBASE_SCAN.md` để ghi rõ:
   - Core platform: MySQL + Prisma (6 schemas) ✅
   - Portal: PostgreSQL + Prisma ✅
   - External apps: MongoDB (isolated, không thuộc core) ℹ️

**Relevant Context:**
- Grep trong: tất cả `apps/` NGOẠI TRỪ `apps/external/`
- Update: `docs/CODEBASE_SCAN.md`

---

## Implementation Notes

- **Sub-task order:** 1 → 2 → 3 → 4 (song song được) → 5 → 6
- **External apps vẫn dùng MongoDB:** Đây là intentional — external apps ở workspace riêng (`apps/external/pnpm-workspace.yaml`), không connect core. Không migration cần thiết.
- **credentials rotation (Sub-task 2):** Sau khi xóa hardcoded credentials khỏi code, cần thủ công vào MongoDB Atlas dashboard rotate credentials `crmAdmin` trên cluster `cluster0.a4iwm`.
- **lkvipgroup-portal database:** Portal dùng PostgreSQL (Supabase/Prisma) — đây là exception được document, không phải lỗi.
- **`docs/STANDARDIZATION.md` sub-tasks còn pending (Nginx, deploy.sh):** Sẽ được xử lý trong deploy plan riêng theo `docs/STANDARDIZATION.md`.

## Post-Implementation Verification Checklist

```bash
# 1. Xác nhận KHÔNG còn MongoDB trong core apps
grep -r "mongo" apps/hub apps/game apps/trading apps/dating apps/sports apps/banking apps/invest apps/lkvip-store apps/academy apps/admin-dashboard apps/lkvipgroup-portal apps/backend --include="*.ts" --include="*.tsx" --include="*.json" --include="*.env.example" -i

# 2. Xác nhận portal config đúng
cat apps/lkvipgroup-portal/.env.example | grep -i "database"

# 3. Xác nhận credentials đã xóa
grep -n "crmAdmin" apps/external/anonymous-voice/server/src/server.ts
# Expected: no output

# 4. Xác nhận MFA không còn fallback key
grep -n "default-long-secret" apps/external/landing/server/src/utils/mfa.ts
# Expected: no output
```
