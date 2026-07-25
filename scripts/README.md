# scripts

Thư mục chứa helper scripts cho backend (TypeScript / `tsx`) và DevOps VPS.

---

## setup-permissions.sh *(root, chạy trên VPS)*

Thiết lập đúng `ownership` và `chmod` cho toàn bộ `/var/LKVIP`.
Chạy lần đầu sau `vps-setup.sh`, hoặc sau mỗi `git pull` nếu có file mới.

```bash
sudo bash /var/LKVIP/scripts/setup-permissions.sh
```

| Đường dẫn | Owner | Mode | Giải thích |
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

## vps-setup.sh *(root, chạy 1 lần duy nhất)*

First-time VPS isolation setup: tạo user `lkvip`, databases MySQL, cấu hình Nginx / UFW / PM2.

```bash
sudo bash /var/LKVIP/scripts/vps-setup.sh
```

---

## deploy.sh *(lkvip user)*

Deploy toàn bộ dự án: `git pull` → `pnpm install` → build → migrations → PM2 reload.

```bash
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh
# Options: --skip-backup  --skip-build  --backend-only  --frontend-only
```

---

## ssl-setup.sh *(root)*

Cài SSL certificate bằng Certbot cho tất cả 7 subdomain cùng lúc.

```bash
sudo bash /var/LKVIP/scripts/ssl-setup.sh
```

---

## backup.sh

Backup databases và uploads.

---

## prisma-run.ts *(TypeScript, chạy bằng `tsx`)*

Script tham số hóa thay thế 18 per-module Prisma scripts trùng lặp.

```bash
# Cú pháp
tsx scripts/prisma-run.ts <action> [module]

# Actions: generate | migrate | deploy | status | studio
# Modules: hub | game | trade | dating | sports | admin
#          (bỏ qua module hoặc dùng "all" = chạy tất cả 6 theo thứ tự chuẩn)
```

### Ví dụ

```bash
# Generate tất cả Prisma Client
tsx scripts/prisma-run.ts generate

# Generate chỉ 1 module
tsx scripts/prisma-run.ts generate hub

# Migrate dev (tạo migration mới) cho 1 module
tsx scripts/prisma-run.ts migrate dating

# Deploy migrations (production) cho tất cả
tsx scripts/prisma-run.ts deploy

# Kiểm tra trạng thái migrations
tsx scripts/prisma-run.ts status

# Mở Prisma Studio (bắt buộc chỉ định module)
tsx scripts/prisma-run.ts studio game
```

### Qua npm scripts (backend/package.json)

```bash
# Shortcut đã cấu hình sẵn
npm run prisma:generate                # generate tất cả
npm run prisma:generate:hub            # generate chỉ hub
npm run prisma:migrate:all             # migrate dev tất cả
npm run prisma:deploy:all              # deploy tất cả
npm run prisma:status:all              # kiểm tra status tất cả

# Tham số hóa tự do (-- để pass args)
npm run prisma:run -- generate hub
npm run prisma:run -- migrate dating
npm run prisma:run -- studio admin
```

### Qua root workspace

```bash
pnpm prisma:generate           # gọi pnpm --filter lkvip-backend run prisma:generate
pnpm prisma:deploy             # gọi pnpm --filter lkvip-backend run prisma:deploy:all
pnpm prisma:status             # gọi pnpm --filter lkvip-backend run prisma:status:all
```

### Thứ tự chạy khi không chỉ định module

`admin → hub → game → dating → trade → sports`

Admin DB được xử lý trước vì chứa `project_configs` và `payment_gateways` mà các module khác phụ thuộc.
