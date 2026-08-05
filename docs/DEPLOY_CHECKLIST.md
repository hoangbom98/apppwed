# Checklist Deploy Production — LKVIP GROUP

> **Cập nhật:** 30/07/2026
> **Domain:** `tc-gaming.live` | **API:** `api.tc-gaming.live`
> **VPS:** Ubuntu 22.04 | **Deploy path:** `/var/LKVIP`
> **PM2 processes:** `lkvip-api`, `lkvip-portal`, `lkvip-invest`, `lkvip-store`, `lkvip-academy`

---

## MỤC LỤC

1. [Pre-Deploy Checks](#1-pre-deploy-checks)
2. [Các Bước Deploy](#2-các-bước-deploy)
3. [Post-Deploy Verification](#3-post-deploy-verification)
4. [Rollback Procedure](#4-rollback-procedure)
5. [Kiểm Tra Nhanh Hàng Ngày](#5-kiểm-tra-nhanh-hàng-ngày)
6. [Liên Hệ Xử Lý Sự Cố](#6-liên-hệ-xử-lý-sự-cố)

---

## 1. PRE-DEPLOY CHECKS

> Thực hiện **TRƯỚC KHI** chạy `deploy.sh`. Nếu bất kỳ mục nào thất bại → DỪNG deploy.

### 1.1 Kiểm Tra Code

- [ ] **TypeScript backend** — không có lỗi mới:
  ```bash
  cd /var/LKVIP
  pnpm --filter lkvip-backend run build 2>&1 | tail -5
  # Kết quả mong đợi: exit code 0, không có "error TS"
  ```

- [ ] **TypeScript portal** — không có lỗi mới:
  ```bash
  pnpm --filter @lkvip/portal run typecheck 2>&1 | tail -5
  # Kết quả mong đợi: exit code 0
  ```

- [ ] **Không có migration chưa deploy** trên local:
  ```bash
  pnpm --filter lkvip-backend run prisma:status:all
  # Kết quả mong đợi: tất cả "Applied" — không có "Pending"
  ```

- [ ] **Không có dependency conflict:**
  ```bash
  pnpm install --frozen-lockfile --dry-run 2>&1 | grep -E "ERR|WARN|conflict"
  # Kết quả mong đợi: không có output
  ```

### 1.2 Kiểm Tra Môi Trường

- [ ] **Backend `.env` có đủ biến:**
  ```bash
  # Kiểm tra các biến bắt buộc
  grep -E "^(DATABASE_URL|REDIS_URL|JWT_SECRET|PORT)" /var/LKVIP/apps/backend/.env
  # Phải thấy đủ 4 dòng
  ```

- [ ] **Redis đang chạy:**
  ```bash
  redis-cli ping
  # Kết quả mong đợi: PONG
  ```

- [ ] **MySQL đang chạy:**
  ```bash
  mysql -u lkvip_db -p -e "SHOW DATABASES;" 2>/dev/null | grep -E "admin_db|game_db|hub_db"
  # Phải thấy ít nhất 3 databases
  ```

- [ ] **Dung lượng disk đủ** (cần ít nhất 2GB free):
  ```bash
  df -h /var/LKVIP
  # Cột "Avail" phải > 2G
  ```

- [ ] **RAM đủ** (PM2 cluster cần ít nhất 1GB free):
  ```bash
  free -m | awk '/^Mem:/{print "Free RAM: "$4"MB"}'
  # Cần > 1024MB
  ```

### 1.3 Kiểm Tra PM2 Hiện Tại

- [ ] **Tất cả PM2 processes đang chạy trước deploy:**
  ```bash
  pm2 status
  # Tất cả process phải ở trạng thái "online"
  # Nếu có process "stopped/errored" — phải xử lý trước
  ```

- [ ] **Backend đang phục vụ requests:**
  ```bash
  curl -s https://api.tc-gaming.live/health | python3 -m json.tool
  # Kết quả mong đợi: {"status":"ok","db":"connected","redis":"connected"}
  ```

### 1.4 Backup Trước Deploy (BẮT BUỘC cho breaking changes)

- [ ] **Backup database** (nếu có migration mới):
  ```bash
  bash /var/LKVIP/scripts/backup.sh
  # Backup lưu tại /var/LKVIP/.backups/
  ```

- [ ] **Ghi chú commit hiện tại** (để rollback nhanh):
  ```bash
  git log --oneline -3
  # Lưu lại commit hash của commit đang chạy
  ```

---

## 2. CÁC BƯỚC DEPLOY

### 2.1 Deploy Tự Động (Khuyến nghị)

```bash
# Chạy toàn bộ pipeline deploy (8 bước)
cd /var/LKVIP
bash scripts/deploy.sh
```

**Theo dõi output:**
- `▶ [1/8]` → `▶ [8/8]` — tất cả phải pass
- Nếu bất kỳ bước nào fail → script tự dừng (`set -euo pipefail`)

### 2.2 Deploy Thủ Công (khi cần kiểm soát từng bước)

```bash
cd /var/LKVIP

# ── Bước 1: Lấy code mới ────────────────────────────────────────────
git pull
# Kiểm tra: git log --oneline -3

# ── Bước 2: Cài dependencies ─────────────────────────────────────────
pnpm install --frozen-lockfile

# ── Bước 3: Build shared packages ────────────────────────────────────
pnpm run build:packages
# Build: @lkvip/types, @lkvip/utils, @lkvip/constants, @lkvip/api-client

# ── Bước 4: Build frontend SPAs ──────────────────────────────────────
pnpm run build:frontends
# Build: hub, game, trade, dating, sports, admin, banking, invest, store, academy

# ── Bước 4b-4e: Build Next.js standalone apps ────────────────────────
pnpm --filter @lkvip/portal run build
pnpm --filter @lkvip/invest run build
pnpm --filter @lkvip/store run build
pnpm --filter @lkvip/academy run build

# Sao chép static assets cho từng app:
for app in lkvipgroup-portal invest lkvip-store academy; do
  dir="apps/$app"
  if [ -d "$dir/.next/standalone" ]; then
    cp -r "$dir/.next/static" "$dir/.next/standalone/.next/static" 2>/dev/null || true
    cp -r "$dir/public"       "$dir/.next/standalone/public"       2>/dev/null || true
    echo "✔ $app — static assets đã sao chép"
  fi
done

# ── Bước 5: Build backend ─────────────────────────────────────────────
pnpm --filter lkvip-backend run build
# Output: apps/backend/dist/server.js

# ── Bước 6: Prisma migrations ─────────────────────────────────────────
pnpm run prisma:deploy
# Deploy 6 MySQL schemas: admin, game, hub, trade, dating, sports

# ── Bước 7: PM2 reload ────────────────────────────────────────────────
for process in lkvip-api lkvip-portal lkvip-invest lkvip-store lkvip-academy; do
  if pm2 describe "$process" &>/dev/null; then
    pm2 reload "$process" --update-env
    echo "✔ $process đã reload"
  else
    echo "⚠ $process không tìm thấy — kiểm tra ecosystem.config.js"
  fi
done

# ── Bước 8: Reload Nginx ──────────────────────────────────────────────
nginx -t && nginx -s reload
```

### 2.3 Deploy Chỉ Backend (hotfix)

```bash
cd /var/LKVIP
git pull
pnpm --filter lkvip-backend run build
pm2 reload lkvip-api --update-env
echo "✔ Backend hotfix deployed"
```

### 2.4 Deploy Chỉ Frontend SPA (không cần restart backend)

```bash
cd /var/LKVIP
git pull
pnpm run build:packages
pnpm run build:frontends
nginx -s reload
# Nginx tự phục vụ từ dist/ mới — không cần restart
echo "✔ Frontend SPAs updated"
```

### 2.5 Deploy Chỉ Portal/Invest/Store/Academy (Next.js standalone)

```bash
cd /var/LKVIP
git pull
pnpm --filter @lkvip/portal run build    # → pm2 reload lkvip-portal
pnpm --filter @lkvip/invest run build    # → pm2 reload lkvip-invest
pnpm --filter @lkvip/store run build     # → pm2 reload lkvip-store
pnpm --filter @lkvip/academy run build   # → pm2 reload lkvip-academy

# Sao chép static assets + reload
pm2 reload lkvip-portal --update-env
pm2 reload lkvip-invest --update-env
pm2 reload lkvip-store --update-env
pm2 reload lkvip-academy --update-env
```

---

## 3. POST-DEPLOY VERIFICATION

> Thực hiện trong vòng **5 phút sau khi deploy**.

### 3.1 Kiểm Tra PM2

```bash
pm2 status
```

**Kết quả mong đợi:**

| Name | Status | CPU | Memory |
|------|--------|-----|--------|
| `lkvip-api` | online | < 80% | < 400MB |
| `lkvip-portal` | online | < 50% | < 300MB |
| `lkvip-invest` | online | < 50% | < 300MB |
| `lkvip-store` | online | < 50% | < 300MB |
| `lkvip-academy` | online | < 50% | < 300MB |

### 3.2 Kiểm Tra API Endpoints

```bash
# Health check
curl -s https://api.tc-gaming.live/health
# Mong đợi: {"status":"ok","db":"connected","redis":"connected","queues":"running"}

# Version check (nếu có)
curl -s https://api.tc-gaming.live/version
```

### 3.3 Kiểm Tra Frontend Apps

```bash
# Hub
curl -s -o /dev/null -w "%{http_code}" https://hub.tc-gaming.live/
# Mong đợi: 200

# Admin
curl -s -o /dev/null -w "%{http_code}" https://admin.tc-gaming.live/
# Mong đợi: 200

# API
curl -s -o /dev/null -w "%{http_code}" https://api.tc-gaming.live/
# Mong đợi: 200 hoặc 404 (không phải 5xx)

# Trade
curl -s -o /dev/null -w "%{http_code}" https://trade.tc-gaming.live/
# Mong đợi: 200

# Sports
curl -s -o /dev/null -w "%{http_code}" https://sports.tc-gaming.live/
# Mong đợi: 200
```

### 3.4 Kiểm Tra Logs (10 phút sau deploy)

```bash
# Backend errors
pm2 logs lkvip-api --lines 50 --err
# Không được có: "UnhandledPromiseRejection", "FATAL", "Cannot connect"

# Portal errors
pm2 logs lkvip-portal --lines 20 --err

# Nginx errors
tail -20 /var/log/nginx/error.log
# Không được có: "upstream timed out", "no live upstreams"
```

### 3.5 Kiểm Tra Database Connections

```bash
curl -s https://api.tc-gaming.live/health | python3 -c "
import json,sys
data = json.load(sys.stdin)
dbs = data.get('databases', {})
for name, status in dbs.items():
    icon = '✅' if status == 'connected' else '❌'
    print(f'{icon} {name}: {status}')
"
```

### 3.6 Kiểm Tra SSL Certificates

```bash
echo | openssl s_client -connect api.tc-gaming.live:443 2>/dev/null \
  | openssl x509 -noout -dates
# Ngày "notAfter" phải còn > 7 ngày
```

### 3.7 Checklist Post-Deploy

- [ ] `pm2 status` — tất cả processes `online`
- [ ] `/health` endpoint trả về 200 + `"status":"ok"`
- [ ] `hub.tc-gaming.live` load được (HTTP 200)
- [ ] `admin.tc-gaming.live` load được (HTTP 200)
- [ ] `api.tc-gaming.live` không có 5xx errors trong logs
- [ ] Không có `UnhandledPromiseRejection` trong `pm2 logs`
- [ ] SSL certificates còn hạn > 7 ngày
- [ ] Database connections tất cả `connected`

---

## 4. ROLLBACK PROCEDURE

### 4.1 Rollback Code (Git)

```bash
cd /var/LKVIP

# Xem các commit gần đây
git log --oneline -10

# Rollback về commit trước
git checkout <commit-hash>  # ví dụ: git checkout abc1234

# Rebuild và restart
pnpm run build:packages
pnpm run build:frontends
pnpm --filter lkvip-backend run build

# Reload tất cả processes
pm2 reload all --update-env
nginx -s reload

echo "✅ Rollback hoàn tất tại commit: $(git log --oneline -1)"
```

### 4.2 Rollback Database Migration

> **CẢNH BÁO:** Prisma không hỗ trợ `migrate rollback` — phải thực hiện thủ công.

```bash
# Kiểm tra migration vừa chạy
cd /var/LKVIP/apps/backend
npx tsx scripts/prisma-run.ts status admin

# Nếu cần rollback, viết migration ngược lại:
# 1. Tạo migration mới với tên "rollback_<tên migration cũ>"
# 2. Viết SQL đảo ngược trong migration mới
# 3. Deploy migration rollback:
npx tsx scripts/prisma-run.ts migrate admin
```

### 4.3 Rollback Khẩn Cấp (Restore Backup)

```bash
# Dừng backend tạm thời
pm2 stop lkvip-api

# Xác định backup cần restore
ls -lth /var/LKVIP/.backups/ | head -5

# Restore từ backup (thay thế tên file thực tế)
mysql -u lkvip_db -p admin_db < /var/LKVIP/.backups/admin_db_YYYY-MM-DD.sql
mysql -u lkvip_db -p game_db  < /var/LKVIP/.backups/game_db_YYYY-MM-DD.sql
# ... các database khác

# Khởi động lại backend
pm2 start lkvip-api --update-env
pm2 status
```

### 4.4 Rollback Nginx Config

```bash
# Nginx tự backup khi test/reload
# Restore config từ backup:
cp /etc/nginx/sites-available/tc-gaming.live.bak /etc/nginx/sites-available/tc-gaming.live
nginx -t && nginx -s reload
```

---

## 5. KIỂM TRA NHANH HÀNG NGÀY

Chạy hàng ngày vào 9:00 sáng để đảm bảo hệ thống ổn định:

```bash
#!/bin/bash
echo "=== LKVIP Daily Health Check $(date '+%d/%m/%Y %H:%M') ==="

# 1. PM2 Status
echo "--- PM2 Processes ---"
pm2 status

# 2. API Health
echo "--- API Health ---"
curl -s https://api.tc-gaming.live/health | python3 -m json.tool 2>/dev/null || echo "❌ API không phản hồi"

# 3. Disk Usage
echo "--- Disk Usage ---"
df -h /var/LKVIP | awk 'NR>1{print "Used: "$5" of "$2" — Available: "$4}'

# 4. Memory
echo "--- Memory ---"
free -m | awk '/^Mem:/{printf "RAM: Used %dMB / Total %dMB (Free: %dMB)\n", $3, $2, $4}'

# 5. SSL Expiry
echo "--- SSL Certificate ---"
echo | openssl s_client -connect api.tc-gaming.live:443 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null || echo "⚠ Không kiểm tra được SSL"

# 6. Recent Errors
echo "--- Recent Backend Errors (last 10 lines) ---"
pm2 logs lkvip-api --lines 10 --err --nostream 2>/dev/null | grep -E "ERROR|FATAL|Unhandled" | tail -5 || echo "Không có lỗi nghiêm trọng"

echo "=== Kiểm tra hoàn tất ==="
```

---

## 6. LIÊN HỆ XỬ LÝ SỰ CỐ

### 6.1 Khi Nào Cần Leo Thang

| Triệu Chứng | Mức Độ | Hành Động |
|-------------|--------|-----------|
| PM2 process crash và tự restart < 3 lần/giờ | Thấp | Theo dõi logs, không cần action ngay |
| PM2 process crash > 5 lần/giờ | Trung bình | Kiểm tra logs ngay, cân nhắc rollback |
| API `/health` trả về 5xx | Cao | Restart PM2, kiểm tra DB connections |
| Database không kết nối được | Cao | Kiểm tra MySQL/Redis service |
| Tất cả users không login được | Nghiêm trọng | Rollback ngay + liên hệ team |
| Dữ liệu tài chính bị lỗi | Nghiêm trọng | Dừng deploy + restore backup ngay |

### 6.2 Lệnh Chẩn Đoán Nhanh

```bash
# Xem lỗi backend trong 30 phút gần nhất
pm2 logs lkvip-api --lines 200 --err | grep -E "$(date -d '-30 minutes' '+%H:%M')" | tail -50

# Kiểm tra kết nối MySQL
mysql -u lkvip_db -p -e "SELECT 1;" 2>&1

# Kiểm tra Redis
redis-cli ping && redis-cli info server | grep -E "redis_version|uptime"

# Kiểm tra Nginx
nginx -t && systemctl status nginx | head -10

# Xem process sử dụng nhiều RAM nhất
pm2 monit  # hoặc: ps aux --sort=-%mem | head -10

# Kiểm tra BullMQ workers
curl -s https://api.tc-gaming.live/admin/queues/status -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 6.3 Tài Liệu Liên Quan

| Tài Liệu | Đường Dẫn |
|----------|-----------|
| Deploy guide đầy đủ | [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) |
| Kiến trúc tổng thể | [`docs/architecture.md`](./architecture.md) |
| Database reference | [`.bob/skills/lkvip-group/reference/database.md`](../.bob/skills/lkvip-group/reference/database.md) |
| Incident response | [`docs/INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) |
| Ecosystem overview | [`docs/ECOSYSTEM.md`](./ECOSYSTEM.md) |

### 6.4 GitHub Secrets Cần Có (CI/CD)

| Secret | Mục Đích |
|--------|---------|
| `VPS_HOST` | IP hoặc hostname của VPS |
| `VPS_USER` | SSH username (thường là `lkvip`) |
| `VPS_SSH_KEY` | Private key SSH để kết nối VPS |

---

*Checklist này phải được review và cập nhật sau mỗi lần deploy lớn hoặc thay đổi kiến trúc.*
*Cập nhật cuối: 30/07/2026*
