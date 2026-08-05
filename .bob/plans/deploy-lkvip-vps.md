# Kế hoạch Deploy LKVIP GROUP — VPS tc-gaming.live

## Tổng quan

Triển khai toàn bộ hệ thống LKVIP từ monorepo `/var/LKVIP` lên VPS Ubuntu 22.04, serve các subdomain dưới `tc-gaming.live`. Không dùng Vercel. Tất cả output/log bằng tiếng Việt.

### Trạng thái ban đầu (đã chẩn đoán)
- ✅ `.env` đã được restore từ git history — credentials thật đã có
- ✅ `lkvip-portal` đang chạy PM2 port 3010 (non-standalone)
- ❌ `lkvip-api` chưa tồn tại trong PM2 — backend chưa build
- ❌ Backend `dist/` chưa tồn tại
- ❌ Hầu hết SPA chưa có `dist/` (chỉ `lkvip-store/dist` có 5 files)
- ❌ SSL cert thiếu `banking.*`, `invest.*`, `store.*`
- ✅ MySQL, Redis, Nginx đang chạy
- ✅ MySQL user `lkvip_app` password `LKvip@App2026!` (từ start-portal.sh)

### Cấu trúc hệ thống
| Thành phần | Chi tiết |
|---|---|
| Backend script | `apps/backend/dist/server.js` |
| Backend build | `cd apps/backend && npx tsc` |
| PM2 config | `config/pm2/ecosystem.config.js` |
| PM2 tên API | `lkvip-api` (cluster 2 instances, port 5000) |
| PM2 tên Portal | `lkvip-portal` (fork 1 instance, port 3010) |
| Prisma | Multi-schema: hub(Supabase PG) + game/trade/dating/sports/admin(MySQL) |
| SPAs build | `pnpm run build:frontends` (turbo filter) |
| Packages build | `pnpm run build:packages` (types/utils/constants/api-client) |

### Subdomain map đầy đủ
| Subdomain | App | Dist path |
|---|---|---|
| `tc-gaming.live` | Hub SPA | `apps/hub/dist` |
| `hub.tc-gaming.live` | Hub SPA | `apps/hub/dist` |
| `game.tc-gaming.live` | Game SPA | `apps/game/dist` |
| `trade.tc-gaming.live` | Trading SPA | `apps/trading/dist` |
| `dating.tc-gaming.live` | Dating SPA | `apps/dating/dist` |
| `sports.tc-gaming.live` | Sports SPA | `apps/sports/dist` |
| `admin.tc-gaming.live` | Admin Dashboard | `apps/admin-dashboard/dist` |
| `banking.tc-gaming.live` | Banking SPA | `apps/banking/dist` |
| `invest.tc-gaming.live` | Invest SPA | `apps/invest/dist` |
| `store.tc-gaming.live` | Store SPA | `apps/lkvip-store/dist` |
| `lkvip.tc-gaming.live` | Portal Next.js | PM2 :3010 |
| `api.tc-gaming.live` | Backend API | PM2 :5000 |

---

## Sub-Task 1 — Khôi phục & xác minh .env

**Intent**: Đảm bảo `apps/backend/.env` có đầy đủ credentials thật, không phải placeholder. Cập nhật CORS để cover 13 subdomains.

**Expected Outcomes**:
- `.env` có giá trị thật cho tất cả biến critical
- `CORS_ORIGINS` bao gồm đủ 13 subdomains
- In danh sách biến SET/MISSING

**Todo List**:
1. Verify `.env` hiện tại — grep tất cả biến critical, kiểm tra không có "CHANGE_ME"
2. Nếu có CHANGE_ME: git show `153ebf5da:apps/backend/.env` > restore
3. Cập nhật `CORS_ORIGINS` thêm `dating`, `game`, `banking`, `invest`, `store`, `lkvip`
4. In checklist: KEY → SET / MISSING / PLACEHOLDER

**Relevant Context**:
- File: `apps/backend/.env`
- Git commit với .env thật: `153ebf5da`
- Password MySQL: `LKvip@App2026!` (user: `lkvip_app`)
- Redis password: `Ucb0BRLjTLOlEpIlrFw1TTp02QOsrGvs` (DB index 2)

**Critical ENV vars phải SET** (không được CHANGE_ME):
```
JWT_SECRET, JWT_REFRESH_SECRET,
GAME_DATABASE_URL, TRADE_DATABASE_URL, DATING_DATABASE_URL, SPORTS_DATABASE_URL, ADMIN_DATABASE_URL,
REDIS_URL, ENCRYPTION_KEY, APP_URL
```

**Status**: [ ] pending

---

## Sub-Task 2 — Verify MySQL databases

**Intent**: Xác minh 5 MySQL databases tồn tại và user `lkvip_app` có quyền truy cập. Tạo nếu thiếu.

**Expected Outcomes**:
- 5 databases tồn tại: `game_db`, `trade_db`, `dating_db`, `sports_db`, `admin_db`
- User `lkvip_app@127.0.0.1` connect được

**Todo List**:
1. Connect MySQL: `mysql -u lkvip_app -p'LKvip@App2026!' -h 127.0.0.1 -e "SHOW DATABASES;"`
2. Với mỗi DB thiếu: `CREATE DATABASE IF NOT EXISTS <db> CHARACTER SET utf8mb4;`
3. Test Redis: `redis-cli -a Ucb0BRLjTLOlEpIlrFw1TTp02QOsrGvs ping`
4. In bảng kết quả: DB name → EXISTS/CREATED, Tables count

**Note**: HUB_DATABASE_URL dùng Supabase PostgreSQL — không cần tạo local. Bỏ qua hub_db.

**Status**: [ ] pending

---

## Sub-Task 3 — Build shared packages + tất cả SPAs

**Intent**: Build các shared packages trước (types/utils/constants/api-client), sau đó build 10 SPAs. Portal xử lý riêng.

**Expected Outcomes**:
- Mỗi SPA có `dist/index.html`
- In bảng: SPA — trạng thái — path

**Todo List**:
1. `cd /var/LKVIP && pnpm run build:packages` (types → utils → constants → api-client)
2. `pnpm run build:frontends` (turbo parallel build tất cả SPAs)
3. Nếu build:frontends lỗi một SPA: thử build riêng từng cái bị fail
4. Verify: `for app in hub game trading sports dating admin-dashboard banking invest lkvip-store; do ls apps/$app/dist/index.html; done`
5. In bảng kết quả

**Relevant Context**:
- Root `package.json` script: `build:frontends` dùng turbo filter
- SPA packages: `@lkvip/hub`, `@lkvip/game`, `@lkvip/trade`, `@lkvip/dating`, `@lkvip/sports`, `@lkvip/admin`, `@lkvip/banking`, `@lkvip/invest`, `@lkvip/store`, `@lkvip/academy`
- Banking/Invest/Store dùng Next.js — output mặc định là `.next/` không phải `dist/`
- **QUAN TRỌNG**: Nginx config trỏ `invest` → `apps/invest/dist` và `store` → `apps/lkvip-store/dist` — cần xác minh vite.config.ts của chúng có `outDir: 'dist'` không
- Đã xác nhận: `apps/banking/vite.config.ts` có `outDir: 'dist'`

**Status**: [ ] pending

---

## Sub-Task 4 — Build backend

**Intent**: Compile TypeScript backend → `dist/server.js`.

**Expected Outcomes**:
- `apps/backend/dist/server.js` tồn tại
- Không có TypeScript errors blocking

**Todo List**:
1. `cd /var/LKVIP/apps/backend && npx tsc --noEmit 2>&1 | head -20` (dry run check)
2. `pnpm --filter lkvip-backend run build` (hoặc `cd apps/backend && npx tsc`)
3. `ls -la dist/server.js` — verify output
4. In thời gian build và kết quả

**Relevant Context**:
- Build script: `npx tsc` (từ `apps/backend/package.json`)
- Entry: `dist/server.js`
- PM2 script path: `apps/backend/dist/server.js` (relative to `/var/LKVIP`)

**Status**: [ ] pending

---

## Sub-Task 5 — Prisma migrations (6 schemas)

**Intent**: Apply Prisma migrations production-safe cho tất cả 6 schemas.

**Expected Outcomes**:
- Tất cả migrations đã apply
- Schema sync với databases

**Todo List**:
1. `cd /var/LKVIP && pnpm run prisma:deploy` (gọi `tsx scripts/prisma-run.ts deploy` cho tất cả 6 schemas)
2. Nếu lỗi "migration not found": thử `prisma migrate resolve --applied` cho schema đó
3. Skip hub schema nếu lỗi Supabase connection (không blocking)
4. In danh sách migrations applied per schema

**Relevant Context**:
- Script: `apps/backend/package.json` → `"prisma:deploy:all": "tsx scripts/prisma-run.ts deploy"`
- Root script: `"prisma:deploy": "pnpm --filter lkvip-backend run prisma:deploy:all"`
- Schemas: `prisma/hub/`, `prisma/game/`, `prisma/trade/`, `prisma/dating/`, `prisma/sports/`, `prisma/admin/`
- Hub dùng Supabase PG — cần Supabase URL đúng

**Status**: [ ] pending

---

## Sub-Task 6 — Start lkvip-api với PM2

**Intent**: Khởi động backend API với PM2 cluster mode, persist process list.

**Expected Outcomes**:
- `lkvip-api` online trong PM2
- `/health` endpoint trả 200

**Todo List**:
1. Kiểm tra: `pm2 list | grep lkvip-api`
2. Nếu KHÔNG tồn tại: `pm2 start config/pm2/ecosystem.config.js --env production --only lkvip-api`
3. Nếu ĐÃ tồn tại nhưng errored: `pm2 delete lkvip-api && pm2 start...`
4. Nếu ĐÃ tồn tại và online: `pm2 reload lkvip-api --update-env`
5. Wait 5s: `sleep 5 && pm2 show lkvip-api | grep status`
6. Health check: `curl -sf http://127.0.0.1:5000/health`
7. `pm2 save`

**Relevant Context**:
- PM2 ecosystem: `config/pm2/ecosystem.config.js`
- Process name: `lkvip-api`
- Port: 5000 (internal only)
- CWD: `/var/LKVIP`

**Status**: [ ] pending

---

## Sub-Task 6b — Cập nhật Nginx + PM2 cho invest & store (Next.js standalone)

**Intent**: Sửa Nginx để proxy invest/store tới PM2 process thay vì serve static, thêm 2 PM2 processes mới.

**Expected Outcomes**:
- `lkvip-invest` và `lkvip-store` chạy trên port 3011/3012
- Nginx proxy đúng tới các port đó

**Todo List**:
1. Thêm `output: "standalone"` vào `apps/invest/next.config.ts`
2. Thêm `output: "standalone"` vào `apps/lkvip-store/next.config.ts`
3. Thêm 2 entries vào `config/pm2/ecosystem.config.js`:
   - `lkvip-invest`: script `apps/invest/start-invest.sh`, port 3011
   - `lkvip-store`: script `apps/lkvip-store/start-store.sh`, port 3012
4. Tạo `apps/invest/start-invest.sh` (PORT=3011, HOSTNAME=127.0.0.1)
5. Tạo `apps/lkvip-store/start-store.sh` (PORT=3012, HOSTNAME=127.0.0.1)
6. Sửa Nginx `config/nginx/tc-gaming.conf`:
   - `invest.tc-gaming.live`: thay `root /var/LKVIP/apps/invest/dist` → upstream proxy `127.0.0.1:3011`
   - `store.tc-gaming.live`: thay `root /var/LKVIP/apps/lkvip-store/dist` → upstream proxy `127.0.0.1:3012`
7. Thêm upstream blocks: `lkvip_invest` và `lkvip_store`

**Relevant Context**:
- Mẫu theo: `apps/lkvipgroup-portal/start-portal.sh` và Nginx block `lkvip.tc-gaming.live`
- PM2 ecosystem: `config/pm2/ecosystem.config.js`

**Status**: [ ] pending

---

## Sub-Task 7 — Mở rộng SSL cert

**Intent**: Thêm `banking.tc-gaming.live`, `invest.tc-gaming.live`, `store.tc-gaming.live` vào SSL cert.

**Expected Outcomes**:
- Cert SAN có đủ tất cả 13 subdomains
- Không làm gián đoạn cert hiện tại

**Todo List**:
1. `certbot certificates` — xem SANs hiện tại
2. `certbot --expand --nginx --cert-name tc-gaming.live -d tc-gaming.live -d www.tc-gaming.live -d api.tc-gaming.live -d hub.tc-gaming.live -d trade.tc-gaming.live -d dating.tc-gaming.live -d sports.tc-gaming.live -d game.tc-gaming.live -d admin.tc-gaming.live -d lkvip.tc-gaming.live -d banking.tc-gaming.live -d invest.tc-gaming.live -d store.tc-gaming.live --non-interactive`
3. Verify SANs mới: `certbot certificates`
4. `nginx -t && systemctl reload nginx`

**Note**: `--expand` giữ nguyên cert cũ và thêm domains mới. Không gây downtime.

**Status**: [ ] pending

---

## Sub-Task 8 — Nginx reload + full health check

**Intent**: Reload Nginx để pick up config mới, kiểm tra toàn bộ 12 endpoints.

**Expected Outcomes**:
- `nginx -t` pass
- Tất cả subdomains trả HTTP 200 hoặc 301
- `lkvip-api` và `lkvip-portal` online

**Todo List**:
1. `nginx -t` — validate config
2. `systemctl reload nginx`
3. Health check loop:
   ```bash
   for domain in tc-gaming.live hub.tc-gaming.live game.tc-gaming.live trade.tc-gaming.live dating.tc-gaming.live sports.tc-gaming.live admin.tc-gaming.live banking.tc-gaming.live invest.tc-gaming.live store.tc-gaming.live lkvip.tc-gaming.live api.tc-gaming.live; do
     code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 https://$domain/)
     echo "$domain → $code"
   done
   ```
4. `curl -sf http://127.0.0.1:5000/health | python3 -c "import sys,json;print(json.load(sys.stdin))"`
5. `pm2 list`
6. `redis-cli -a Ucb0BRLjTLOlEpIlrFw1TTp02QOsrGvs ping`
7. In bảng tổng hợp cuối

**Status**: [ ] pending

---

## Notes cho Agent

- **Dừng ngay** nếu Sub-Task 1, 2, hoặc 5 thất bại với lỗi blocking
- Sub-Task 3: build lỗi 1 SPA → ghi nhận, tiếp tục, không dừng
- **Invest và Store** dùng Next.js — cần xác minh `outDir` trong vite.config.ts trước khi build
- **Banking** dùng Vite — đã confirmed `outDir: 'dist'`
- Portal (`lkvip.tc-gaming.live`) đang chạy qua non-standalone — sau khi build standalone, cần reload lkvip-portal
- Tất cả output, log, thông báo lỗi bằng **tiếng Việt**
- Working directory: `/var/LKVIP`
