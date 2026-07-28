# scripts/ — LKVIP GROUP Operations Scripts

Thư mục chứa toàn bộ scripts vận hành cho backend (TypeScript/`tsx`) và DevOps VPS.

> **Lưu ý ESM**: Monorepo dùng `"type": "module"`. Tất cả TypeScript scripts đã khai báo `const __dirname = path.dirname(fileURLToPath(import.meta.url))` để tương thích.

---

## Thứ tự thực thi chuẩn

### Khởi tạo VPS lần đầu (chạy một lần duy nhất)
```
vps-setup.sh  →  deploy.sh  →  ssl-setup.sh  →  setup-permissions.sh
```

### Mỗi lần deploy
```
pre-prod-check.sh  →  deploy.sh
```

### Rollback khẩn cấp
```
rollback.sh
```

---

## Shell Scripts (VPS/DevOps)

### `vps-setup.sh` *(root, chạy 1 lần duy nhất)*

First-time VPS isolation setup: tạo user `lkvip`, cài Node.js 20 + pnpm + PM2, tạo 6 databases MySQL với dedicated user, cấu hình Redis (DB index 2), Nginx http-level config, UFW firewall, PM2 startup systemd, log rotation.

```bash
sudo bash /var/LKVIP/scripts/vps-setup.sh
```

**Isolation đảm bảo:**
- User: `lkvip` (tách biệt khỏi www-data/boyue)
- Root: `/var/LKVIP` (không đụng `/var/www`)
- API port: 5000 trên 127.0.0.1 (Nginx proxy, UFW block trực tiếp)
- Redis DB index: 2 (0=system, 1=boyue, 2=lkvip)

---

### `setup-permissions.sh` *(root)*

Thiết lập đúng `ownership` và `chmod` cho toàn bộ `/var/LKVIP`.
Chạy sau `vps-setup.sh`, hoặc sau mỗi `git pull` nếu có file mới.

```bash
sudo bash /var/LKVIP/scripts/setup-permissions.sh
```

| Đường dẫn | Owner | Mode | Mục đích |
|---|---|---|---|
| `/var/LKVIP` (gốc) | `lkvip:www-data` | `755` | Base toàn dự án |
| `apps/backend/.env*` | `root:lkvip` | `640` | Chỉ root ghi, lkvip đọc |
| `config/.db-pass` | `root:root` | `600` | Tuyệt mật — chỉ root |
| `data/uploads/` | `lkvip:www-data` | `775` | App + Nginx cần ghi |
| `data/logs/` | `lkvip:lkvip` | `755` | Chỉ PM2/app ghi |
| `logs/` | `lkvip:lkvip` | `755` | PM2 out/error logs |
| `.backups/` | `lkvip:lkvip` | `750` | Private, không cần nginx |
| `apps/*/dist/` | `lkvip:www-data` | `755` | Nginx serve static |
| `.git/` | `lkvip:lkvip` | `700` | Private |
| `*.sh` | — | `755` | Executable |

---

### `ssl-setup.sh` *(root)*

Cài SSL certificate bằng Certbot cho tất cả 7 subdomain cùng lúc.
Kiểm tra DNS trước khi cấp cert (cảnh báo nếu record chưa trỏ đúng IP).

```bash
# Tùy chỉnh email certbot (tùy chọn)
export CERTBOT_EMAIL=your@email.com
sudo bash /var/LKVIP/scripts/ssl-setup.sh
```

**Subdomain được cấp cert:** `tc-gaming.live`, `www`, `hub`, `api`, `trade`, `sports`, `admin`

---

### `deploy.sh` *(lkvip user)*

Deploy toàn bộ dự án với đầy đủ safety checks:
`git pull` → `pnpm install` → Prisma migrations → build → PM2 reload → Nginx reload → health check.

Có auto-rollback nếu deploy thất bại sau `git pull`.

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh

# Options:
#   --env=staging         môi trường staging (mặc định: production)
#   --skip-backup         bỏ qua backup uploads
#   --skip-build          dùng dist/ hiện có (không build lại)
#   --backend-only        chỉ rebuild + restart backend
#   --frontend-only       chỉ rebuild frontend static files
```

---

### `backup.sh` *(lkvip user, cron daily)*

Backup 6 databases MySQL vào `.backups/YYYY-MM-DD/`. Compress bằng gzip-9.
Tự động xóa backup cũ hơn `RETAIN_DAYS` (mặc định 7 ngày).
Gửi thông báo Telegram khi thành công hoặc thất bại.

```bash
# Chạy thủ công
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh

# Kiểm tra restore (không ảnh hưởng data thật)
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh --restore-test

# Cài đặt cron (mỗi ngày 2:00 AM)
# 0 2 * * * bash /var/LKVIP/scripts/backup.sh >> /var/LKVIP/logs/backup.log 2>&1
```

**Env vars cần thiết (load từ `.env` tự động):**
`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID` *(tùy chọn)*

---

### `pre-prod-check.sh`

Kiểm tra 6 hạng mục trước khi deploy lên production:
Services (PM2/Nginx/Redis/MySQL), API health, TypeScript errors, Nginx config, database migrations, disk/memory, SSL certificates.

```bash
bash /var/LKVIP/scripts/pre-prod-check.sh
```

Exit code: `0` = sẵn sàng, `1` = có lỗi nghiêm trọng.

---

### `rollback.sh`

Rollback code về commit hoặc tag trước. Tự động stash, build lại, reload PM2 + Nginx.

```bash
# Rollback 1 commit (HEAD~1)
bash /var/LKVIP/scripts/rollback.sh

# Rollback về tag cụ thể
bash /var/LKVIP/scripts/rollback.sh v1.2.3

# Undo rollback
git stash pop && pnpm run build:backend && pm2 reload lkvip-api
```

---

### `scan-repo.sh`

Phân tích toàn diện codebase (chạy thủ công khi cần review chất lượng code):
cloc (dòng code), jscpd (code trùng lặp), depcheck (dependency thừa/thiếu), madge (circular imports), bundle sizes.

```bash
bash /var/LKVIP/scripts/scan-repo.sh
# Output: scan-reports/ (không commit vào git)
```

---

## TypeScript Scripts (chạy bằng `tsx`)

### `prisma-run.ts` — Prisma CLI tham số hóa

Script thay thế 18 per-module Prisma scripts trùng lặp. Cú pháp:

```bash
tsx scripts/prisma-run.ts <action> [module]

# Actions : generate | migrate | deploy | status | studio
# Modules : hub | game | trade | dating | sports | admin
#           (bỏ qua module hoặc dùng "all" = chạy tất cả 6)
```

**Ví dụ:**
```bash
tsx scripts/prisma-run.ts generate             # generate tất cả
tsx scripts/prisma-run.ts generate hub         # generate chỉ hub
tsx scripts/prisma-run.ts migrate dating       # migrate dev cho dating
tsx scripts/prisma-run.ts deploy               # deploy production tất cả
tsx scripts/prisma-run.ts status               # kiểm tra status tất cả
tsx scripts/prisma-run.ts studio game          # mở Prisma Studio (1 module)
```

**Qua npm scripts:**
```bash
npm run prisma:generate            # generate tất cả
npm run prisma:generate:hub        # generate chỉ hub
npm run prisma:migrate:all         # migrate dev tất cả
npm run prisma:deploy:all          # deploy production tất cả
npm run prisma:status:all          # kiểm tra status
npm run prisma:run -- studio admin # tham số hóa tự do
```

**Thứ tự module (khi không chỉ định):**
`admin → hub → game → dating → trade → sports`

> Admin DB chứa `project_configs` và `payment_gateways` nên phải migrate trước.

---

### `health-check.ts` — Health Dashboard

Kiểm tra toàn diện: DNS, SSL, HTTP, PM2, Nginx.
Gửi cảnh báo Telegram nếu có vấn đề.

```bash
tsx scripts/health-check.ts                   # local, one-shot
tsx scripts/health-check.ts --env production  # production (DNS + SSL + PM2 + Nginx)
tsx scripts/health-check.ts --watch           # tự động lặp mỗi 60 giây
tsx scripts/health-check.ts --json            # output JSON
```

---

### `daily-report.ts` — Daily Health Report

Chạy tất cả các check (TypeScript, tests, API routes, frontend routes, health) và tạo báo cáo tổng hợp. Lưu JSON vào `reports/YYYY-MM-DD.json`. Gửi Telegram nếu có lỗi.

```bash
tsx scripts/daily-report.ts
tsx scripts/daily-report.ts --env production
tsx scripts/daily-report.ts --no-tests        # bỏ qua unit tests
tsx scripts/daily-report.ts --no-telegram     # bỏ qua alert
```

**Cài đặt cron (daily 7:00 AM):**
```bash
0 7 * * * cd /var/LKVIP && tsx scripts/daily-report.ts --env production >> logs/daily.log 2>&1
```

---

### `check-api.ts` — Backend API Route Auditor

Đọc tất cả Express route files, liệt kê endpoints, probe HTTP, báo cáo coverage gaps.

```bash
tsx scripts/check-api.ts                                   # audit + probe
tsx scripts/check-api.ts --no-fetch                        # chỉ liệt kê routes
tsx scripts/check-api.ts --json                            # JSON output
tsx scripts/check-api.ts --base-url https://api.tc-gaming.live
```

---

### `check-routes.ts` — Frontend Route Scanner

Đọc React Router definitions từ mỗi App.tsx, kiểm tra HTTP reachability.

```bash
tsx scripts/check-routes.ts                       # tất cả apps
tsx scripts/check-routes.ts --app game            # chỉ 1 app
tsx scripts/check-routes.ts --json                # JSON output
tsx scripts/check-routes.ts --no-fetch            # chỉ liệt kê
tsx scripts/check-routes.ts --env production      # test production URLs
```

---

### `lkvip.ts` — CLI Wrapper

CLI tiện lợi bao gồm các lệnh `deploy`, `backup`, `setup`.
Trên production, ưu tiên dùng `deploy.sh` và `backup.sh` trực tiếp.

```bash
tsx scripts/lkvip.ts deploy    # deploy (wrapper của deploy.sh)
tsx scripts/lkvip.ts backup    # backup databases
tsx scripts/lkvip.ts setup     # hướng dẫn setup
```

---

### `resolve-catalog.ts` — pnpm Catalog Resolver

Giải quyết `"dep": "catalog:"` references trong `package.json` của apps/ và packages/.

```bash
tsx scripts/resolve-catalog.ts
```

---

## Migration Scripts (one-time)

### `migrate-assets.ts` — Asset Migration

Di chuyển và chuẩn hóa tên asset sang kebab-case từ thư mục nguồn.
**Cần đặt biến môi trường `ASSET_SOURCE_DIR`.**

```bash
ASSET_SOURCE_DIR=/path/to/source/assets tsx scripts/migrate-assets.ts
# Tùy chọn: ASSET_TARGET_DIR=/custom/target
```

---

### `migrate-storage.ts` — S3 Storage Migration

Upload toàn bộ file trong `data/uploads/` lên S3-compatible storage.
**Chỉ cần chạy 1 lần khi chuyển từ local storage sang S3.**

```bash
tsx scripts/migrate-storage.ts
# Cần: S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY trong .env
```

---

## Node.js Scripts

### `analyze-shared-deps.js` — Shared Dependency Analysis

Tìm dependency được dùng bởi >= 3 packages và dependency có version không đồng nhất.
Được gọi bởi `scan-repo.sh` và có thể chạy độc lập.

```bash
node scripts/analyze-shared-deps.js
```

---

## Utility Scripts

### `cleanup.mjs` — Project Cleanup

Dọn dẹp whitespace thừa, file rỗng, thư mục rỗng.

```bash
node scripts/cleanup.mjs          # dry-run (chỉ xem)
node scripts/cleanup.mjs --run    # thực thi (có xác nhận)
```

---

## Dependency của Scripts

| Script | Cần cài trước | Ghi chú |
|---|---|---|
| `vps-setup.sh` | Ubuntu 22.04, root access | Chạy 1 lần |
| `ssl-setup.sh` | `vps-setup.sh` đã chạy, DNS đã trỏ | — |
| `deploy.sh` | `vps-setup.sh`, `.env` đã fill | `--skip-build` cho CI-built artifacts |
| `backup.sh` | MySQL đang chạy, MYSQL_PASSWORD trong .env | Cron: 2 AM |
| `pre-prod-check.sh` | PM2, Nginx, Redis, MySQL đang chạy | Chạy trước deploy |
| `rollback.sh` | `pnpm` installed | Dùng khi deploy thất bại |
| `scan-repo.sh` | `cloc` (optional), `pnpm dlx` | Chạy thủ công khi cần |
| `prisma-run.ts` | `tsx`, backend dependencies | — |
| `health-check.ts` | `tsx` | Telegram optional |
| `daily-report.ts` | `tsx`, backend running | Cron: 7 AM |
| `check-api.ts` | `tsx` | API server optional |
| `check-routes.ts` | `tsx` | Dev servers optional |
| `migrate-assets.ts` | `tsx`, `ASSET_SOURCE_DIR` env | One-time |
| `migrate-storage.ts` | `tsx`, S3 env vars | One-time |
