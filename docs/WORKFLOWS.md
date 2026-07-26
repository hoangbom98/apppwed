# LKVIP — Tiến Trình Vận Hành Thống Nhất

> Bộ quy trình thống nhất cho tất cả các giai đoạn vòng đời dự án: phát triển → kiểm thử → triển khai → vận hành → bảo trì.
> Tài liệu tham chiếu nhanh; xem chi tiết tại các file `docs/` liên quan.

---

## 1. QUY TRÌNH PHÁT TRIỂN (Development Workflow)

### 1.1. Git Flow

```
main (production)
  ├── develop (integration)
  │   ├── feature/ten-tinh-nang
  │   ├── bugfix/ten-loi
  │   └── ...
  ├── release/vX.X.X
  └── hotfix/ten-loi-khan-cap
```

**Quy tắc đặt tên nhánh:**

| Prefix | Dùng khi |
|--------|----------|
| `feature/` | Tính năng mới |
| `bugfix/` | Sửa lỗi thông thường |
| `hotfix/` | Sửa lỗi khẩn cấp trên production |
| `release/` | Chuẩn bị release (`release/v1.2.0`) |
| `chore/` | Cấu hình, deps, docs |

### 1.2. Vòng đời Pull Request

| Bước | Hành động | Công cụ |
|------|-----------|---------|
| 1 | `git checkout develop && git pull` → tạo nhánh mới | Git |
| 2 | Viết code, commit theo Conventional Commits | IDE + Git |
| 3 | Tạo Pull Request → `develop` | GitHub |
| 4 | CI tự động: lint + typecheck + test + build | GitHub Actions (`.github/workflows/ci.yml`) |
| 5 | Code review ≥ 1 người | GitHub |
| 6 | Phê duyệt và merge | GitHub |
| 7 | Deploy staging tự động | CI/CD |

**Quy tắc commit (Conventional Commits):**

```bash
feat: thêm chức năng login
fix: sửa lỗi tính toán số dư ví
chore: cập nhật dependencies
docs: cập nhật SETUP.md
refactor: tách wallet service thành class riêng
test: thêm unit test cho auth module
```

**Lệnh workflow chuẩn:**

```bash
# Tạo nhánh mới từ develop
git checkout develop && git pull
git checkout -b feature/add-login

# Commit và push
git add .
git commit -m "feat: add login with OTP"
git push origin feature/add-login

# Sau khi merge PR, dọn nhánh local
git checkout develop && git pull
git branch -d feature/add-login
```

### 1.3. Quy tắc PR

- Mỗi PR tối đa **200–300 dòng thay đổi**; tách nhỏ nếu lớn hơn.
- Code mới phải có unit test hoặc integration test tương ứng.
- Lint và typecheck phải pass trước khi yêu cầu review.
- Backend validation dùng **Joi**; frontend dùng **Yup + React Hook Form**.
- Không dùng Zod, Vant UI, Iconify cho phần mới.
- Cập nhật tài liệu liên quan trong cùng PR nếu thay đổi API/deploy/schema.

---

## 2. QUY TRÌNH KIỂM THỬ (Testing Workflow)

### 2.1. Các cấp độ kiểm thử

| Cấp | Mô tả | Công cụ | Tần suất |
|-----|-------|---------|----------|
| Unit Test | Kiểm tra từng function/class riêng lẻ | Jest | Mỗi commit |
| Integration Test | Kiểm tra tương tác giữa các module, cần DB + Redis | Supertest + Prisma | Mỗi PR |
| E2E Test | Kiểm tra luồng người dùng đầy đủ | Playwright | Mỗi release |
| Load Test | Kiểm tra hiệu năng dưới tải | K6/Artillery | Hàng tuần |
| Security Scan | Quét lỗ hổng bảo mật | `pnpm audit` / Snyk | Hàng tuần |

### 2.2. Lệnh chạy test

```bash
# Unit test (backend)
pnpm test

# Tất cả test (có in --if-present, bỏ qua app không có test)
pnpm test:all

# Typecheck toàn bộ
pnpm typecheck:all

# Lint toàn bộ (OXLint cho FE, ESLint cho BE)
pnpm lint:all

# Kiểm tra API routes đang chạy
pnpm check:routes
pnpm check:routes:prod

# Kiểm tra API endpoints
pnpm check:api
pnpm check:api:prod

# Health check (local)
pnpm check:health

# Health check (production + SSL + DNS)
pnpm check:health:prod

# Báo cáo toàn diện
pnpm check:all
pnpm check:all:prod
```

### 2.3. CI tự động (`.github/workflows/ci.yml`)

CI chạy khi push lên `main`/`develop` hoặc mở PR:

1. **Backend job** — lint → typecheck → Jest (với MySQL 8 service cho 6 DB)
2. **Frontend jobs** (parallel) — typecheck → Vite build cho mỗi SPA
3. **Packages job** — TypeScript build cho `types`, `constants`, `utils`

Deploy chỉ trigger sau khi CI pass.

---

## 3. QUY TRÌNH TRIỂN KHAI (Deployment Workflow)

> Tài liệu đầy đủ: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)

### 3.1. Môi trường triển khai

| Môi trường | URL | Trigger |
|------------|-----|---------|
| Local dev | `localhost:5000`, `localhost:5173–5180` | Liên tục |
| Production | `tc-gaming.live` / `api.tc-gaming.live` | Push `main` → CI → deploy.yml |

### 3.2. Deploy tự động (GitHub Actions)

```
Push to main
  → ci.yml (lint + typecheck + test + build)
  → deploy.yml (SSH → VPS → deploy.sh)
  → Health check post-deploy
```

Secrets cần cấu hình trong GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`.

### 3.3. Deploy thủ công trên VPS

```bash
# SSH vào VPS
ssh lkvip@104.248.146.203

# Deploy chuẩn (toàn bộ)
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh

# Chỉ backend
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --backend-only

# Chỉ frontend
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --frontend-only

# Bỏ qua build (chỉ restart)
sudo -u lkvip bash /var/LKVIP/scripts/deploy.sh --skip-build
```

**Thứ tự script deploy:**

1. Kiểm tra toolchain, `.env`, port
2. Backup uploads
3. `git pull --ff-only origin main`
4. `pnpm install --frozen-lockfile`
5. Prisma migrate deploy (6 schemas)
6. Build backend
7. Build frontends
8. `pm2 reload lkvip-api --update-env`
9. `nginx -t && systemctl reload nginx`
10. Health check + public URL checks

### 3.4. Health check sau deploy

```bash
# Internal
curl -sf http://127.0.0.1:5000/health

# Public
curl -fsSIL https://tc-gaming.live/
curl -fsSIL https://hub.tc-gaming.live/
curl -fsSIL https://trade.tc-gaming.live/
curl -fsSIL https://sports.tc-gaming.live/
curl -fsSIL https://admin.tc-gaming.live/
curl -fsS  https://api.tc-gaming.live/health
```

Chỉ pass khi JSON trả về `{"status":"healthy"}`.

### 3.5. Rollback

```bash
cd /var/LKVIP

# Xem 10 commit gần nhất
git log --oneline -10

# Checkout dist của commit ổn định (không mất migration)
PREV_COMMIT="abc1234"
git checkout "$PREV_COMMIT" -- apps/backend/dist/
pm2 reload lkvip-api --update-env

# Verify
sleep 5 && curl -sf http://127.0.0.1:5000/health
```

> Tránh `git reset --hard`, `git clean`, force push trước khi xác nhận phạm vi ảnh hưởng.

---

## 4. QUY TRÌNH GIÁM SÁT & CẢNH BÁO (Monitoring)

> Tài liệu đầy đủ: [`docs/OPERATIONS.md`](./OPERATIONS.md)

### 4.1. Ngưỡng cảnh báo

| Chỉ số | Mục tiêu | Ngưỡng cảnh báo |
|--------|----------|-----------------|
| Uptime | 99.9% | < 99.9% |
| API p95 | < 500ms | > 1s |
| Health/login p95 | < 200ms | > 500ms |
| Error rate | < 0.1% | > 5% |
| CPU usage | < 70% | > 80% |
| Memory usage | < 70% | > 85% |
| Disk usage | < 80% | > 85% |
| MySQL connections | < 80% max | > 90% max |
| Redis memory | < 80% | > 90% |

### 4.2. Lệnh kiểm tra thường dùng

```bash
# PM2 process status
pm2 status
pm2 monit
pm2 logs lkvip-api --lines 100

# Tài nguyên hệ thống
free -h
df -h
uptime

# MySQL connections
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
mysql -u root -p -e "SHOW PROCESSLIST;"

# Redis
redis-cli ping
redis-cli info memory | grep used_memory_human

# Health + Metrics
curl -sf http://127.0.0.1:5000/health
curl -sf http://127.0.0.1:5000/metrics

# Nginx
nginx -t
```

### 4.3. Watch mode (continuous monitoring)

```bash
pnpm check:health:watch           # local, mỗi 60s
pnpm check:health:prod:watch      # production, mỗi 60s
pnpm check:health:json            # JSON output cho automation
```

### 4.4. Kênh cảnh báo

| Kênh | Cấu hình | Dùng khi |
|------|----------|----------|
| Telegram | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ALERT_CHAT_ID` | P1/P2, backup status |
| Email | `SMTP_*` | Báo cáo hàng ngày |

### 4.5. Quy trình xử lý sự cố

```
1. Phát hiện → Cảnh báo (Telegram/log)
2. Đánh giá → Phân loại P1/P2/P3/P4
3. Phân tích → pm2 logs, metrics, DB processlist
4. Xử lý → Fix, rollback, restart (xem INCIDENT_RESPONSE.md)
5. Verify → curl /health, theo dõi 5 phút
6. Báo cáo → docs/incidents/YYYY-MM-DD-<slug>.md
```

> Tài liệu chi tiết: [`docs/INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md)

---

## 5. QUY TRÌNH BẢO MẬT (Security Workflow)

### 5.1. Biện pháp định kỳ

| Hành động | Tần suất | Lệnh / Công cụ |
|-----------|----------|----------------|
| Quét lỗ hổng dependency | Hàng tuần | `pnpm audit` |
| Lint bảo mật (SAST) | Mỗi PR | ESLint (backend), OXLint (FE) |
| Review quyền truy cập | Hàng tháng | Manual, `admin_db.audit_logs` |
| Cập nhật OS packages | Khi có CVE critical | `sudo apt update && sudo apt upgrade -y` |
| Rotate JWT secret | Khi cần | Sửa `.env` → `pm2 reload lkvip-api --update-env` |

### 5.2. Quy tắc bảo mật bắt buộc

- `.env` production phải `chmod 600`.
- Không expose port `5000`, MySQL, Redis ra public. Chỉ `80`/`443`/`22` qua firewall.
- Public config API (`/api/shared/config`) chỉ trả **non-secret** config.
- Không hardcode credential, API key, secret trong code hoặc log.
- Admin actions phải có audit trail trong `admin_db.audit_logs`.

### 5.3. Xử lý security incident

```bash
# Block IP tấn công
sudo ufw deny from <IP> to any

# Revoke toàn bộ session của user bị compromise
mysql -u root -p lkvip_admin -e \
  "UPDATE user_sessions SET isRevoked=1 WHERE userId='<UID>';"

# Rotate JWT (invalidate mọi session hiện tại)
# 1. Sửa JWT_SECRET trong /var/LKVIP/apps/backend/.env
# 2. Reload PM2
pm2 reload lkvip-api --update-env

# Kiểm tra audit + security log
mysql -u root -p lkvip_admin -e \
  "SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 50;"
mysql -u root -p lkvip_admin -e \
  "SELECT * FROM security_logs WHERE severity='critical' \
   ORDER BY createdAt DESC LIMIT 50;"
```

---

## 6. QUY TRÌNH BACKUP & PHỤC HỒI

> Tài liệu chi tiết: [`docs/OPERATIONS.md §10`](./OPERATIONS.md)

### 6.1. Lịch backup

| Dữ liệu | Tần suất | Nơi lưu | Giữ |
|---------|----------|---------|-----|
| 6 MySQL schemas | 02:00 hàng ngày (cron) | `/var/LKVIP/.backups/<YYYY-MM-DD>/` | 7 ngày |
| Uploads | Khi deploy | Bao gồm trong deploy.sh backup bước 2 | Theo cron |
| Code | Mỗi commit | GitHub | Vĩnh viễn |
| Restore test | 03:00 Chủ Nhật (cron) | Log vào `logs/backup.log` | — |

### 6.2. Chạy backup thủ công

```bash
# Backup chuẩn
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh

# Test khả năng restore (không ảnh hưởng production)
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh --restore-test

# Xem log backup
tail -50 /var/LKVIP/logs/backup.log
```

**Crontab (`sudo -u lkvip crontab -l`):**

```
0 2 * * *   bash /var/LKVIP/scripts/backup.sh >> /var/LKVIP/logs/backup.log 2>&1
0 3 * * 0   bash /var/LKVIP/scripts/backup.sh --restore-test >> /var/LKVIP/logs/backup.log 2>&1
```

### 6.3. Quy trình phục hồi (Recovery)

```bash
# 1. Dừng service
pm2 stop lkvip-api

# 2. Restore database (6 schemas)
ls /var/LKVIP/.backups/                          # chọn ngày backup
BACKUP_DATE="2025-01-15"
cd /var/LKVIP/.backups/$BACKUP_DATE/

# Ví dụ restore hub_db
gunzip hub_db_*.sql.gz
mysql -u root -p hub_db < hub_db_*.sql

# 3. Khởi động lại
pm2 start lkvip-api
pm2 save

# 4. Verify
sleep 5 && curl -sf http://127.0.0.1:5000/health
```

---

## 7. QUY TRÌNH QUẢN LÝ NGƯỜI DÙNG

### 7.1. Onboarding user

```
1. User đăng ký → xác thực email/SĐT
2. Hệ thống tự tạo ví (eventBus → worker)
3. Gửi email chào mừng (BullMQ worker)
4. Tặng bonus trải nghiệm (nếu config bật)
5. Ghi log đăng ký vào admin_db.audit_logs
```

Background jobs xử lý qua BullMQ workers (`apps/backend/src/modules/workers/`). Không dùng `setTimeout` cho side-effect async.

### 7.2. Quản lý tài khoản vi phạm

```bash
# Xem admin audit log
mysql -u root -p lkvip_admin -e \
  "SELECT * FROM audit_logs WHERE userId='<UID>' ORDER BY createdAt DESC LIMIT 20;"

# Revoke tất cả session (block đăng nhập)
mysql -u root -p lkvip_admin -e \
  "UPDATE user_sessions SET isRevoked=1 WHERE userId='<UID>';"
```

---

## 8. QUY TRÌNH QUẢN LÝ LỖI (Bug Management)

### 8.1. Phân loại lỗi

| Cấp | Mô tả | SLA Fix |
|-----|-------|---------|
| **P1 — Blocker** | Production down, API/DB unreachable | Ngay lập tức (< 15 phút) |
| **P2 — Critical** | Login/nạp tiền/rút tiền/admin lỗi | < 1 giờ |
| **P3 — High** | Lỗi một module, chậm | < 4 giờ |
| **P4 — Medium** | Lỗi nhỏ, có workaround | < 1 ngày |
| **P5 — Low** | Lỗi cosmetic/UI | Sprint tiếp theo |

### 8.2. Quy trình xử lý lỗi

```
1. Phát hiện (log, cảnh báo, báo cáo)
2. Tạo GitHub Issue + gán label (p1/p2/…) + gán người
3. Phân tích nguyên nhân (pm2 logs, Sentry, metrics)
4. Sửa lỗi → hotfix/ branch nếu P1/P2 (direct to main)
5. Tạo PR → CI pass → review → merge
6. Deploy (hotfix: deploy.yml manual trigger)
7. Verify trên production
8. Đóng issue + ghi vào docs/incidents/ nếu P1/P2
```

**Hotfix trực tiếp lên production (P1):**

```bash
git checkout main && git pull
git checkout -b hotfix/fix-login-crash
# ... sửa lỗi ...
git commit -m "fix: resolve login crash on OTP timeout"
git push origin hotfix/fix-login-crash
# Tạo PR → main, merge ngay sau CI pass
# GitHub Actions deploy.yml tự deploy
```

---

## 9. QUY TRÌNH CẬP NHẬT & NÂNG CẤP

### 9.1. Cập nhật dependencies

```bash
# Xem packages có version mới
pnpm outdated

# Cập nhật một package cụ thể (kiểm tra changelog trước)
pnpm add <package>@latest --filter lkvip-backend

# Chạy toàn bộ kiểm tra
pnpm lint:all && pnpm typecheck:all && pnpm test

# Commit
git add . && git commit -m "chore: update <package> to vX.Y.Z"
```

### 9.2. Nâng cấp hệ thống (VPS)

```bash
# 1. Backup trước
sudo -u lkvip bash /var/LKVIP/scripts/backup.sh

# 2. Nâng cấp OS packages
sudo apt update && sudo apt upgrade -y

# 3. Kiểm tra service sau nâng cấp
pm2 status
curl -sf http://127.0.0.1:5000/health

# 4. Nâng cấp Node.js (qua nvm nếu cần)
nvm install 20 && nvm alias default 20
pm2 reload lkvip-api --update-env
```

### 9.3. Prisma schema migration (production)

```bash
# Kiểm tra trạng thái migration
pnpm prisma:status

# Apply migration (production — không dùng db push)
pnpm prisma:deploy

# Nếu migration lỗi — resolve thủ công
cd apps/backend
npx prisma migrate resolve --rolled-back <MIGRATION_NAME> \
  --schema prisma/<project>/schema.prisma
```

---

## 10. QUY TRÌNH ONBOARDING THÀNH VIÊN MỚI

> Tài liệu đầy đủ: [`docs/ONBOARDING.md`](./ONBOARDING.md) · [`docs/SETUP.md`](./SETUP.md)

| Giai đoạn | Nội dung |
|-----------|----------|
| **Ngày 1** | Đọc `README.md`, `docs/ONBOARDING.md`; clone repo; `pnpm install` |
| **Ngày 2–3** | Đọc `docs/SETUP.md`; setup local `.env`; chạy `pnpm dev:backend` + một SPA |
| **Tuần 1** | Đọc `docs/ARCHITECTURE.md`; chạy `pnpm check:health`; hiểu module `auth`, `wallet` |
| **Tuần 2** | Đọc Prisma schemas, BullMQ workers, Socket.IO; chạy `pnpm test` |
| **Tuần 3** | Làm bug/feature nhỏ; chạy full CI checklist local; tạo PR đầu tiên |
| **Tuần 4** | Review `docs/DEPLOYMENT.md`; hiểu deploy flow; tham gia on-call rotation |

**Checklist môi trường local:**

```bash
# Yêu cầu
node --version   # >= 20
pnpm --version   # >= 9
mysql --version  # 8.x
redis-cli ping   # PONG

# Setup
git clone <repo-url> /var/LKVIP
cd /var/LKVIP
cp config/env/.env.example apps/backend/.env
# Điền DATABASE_URLs, JWT_SECRET, REDIS_URL vào .env

pnpm install
pnpm prisma:generate
# Tạo 6 MySQL schemas trước
pnpm prisma:deploy       # hoặc prisma migrate dev local

# Khởi động
pnpm dev:backend         # localhost:5000
pnpm dev:hub             # localhost:5173
pnpm dev:admin           # localhost:5180
```

---

## 11. CHECKLIST VẬN HÀNH HÀNG NGÀY

```bash
# ✅ 1. Health check
curl -sf https://api.tc-gaming.live/health

# ✅ 2. PM2 status + logs lỗi gần nhất
pm2 status
pm2 logs lkvip-api --lines 50

# ✅ 3. Kiểm tra backup hôm qua
ls -la /var/LKVIP/.backups/
tail -20 /var/LKVIP/logs/backup.log

# ✅ 4. Kiểm tra tài nguyên
free -h
df -h

# ✅ 5. Kiểm tra cảnh báo (Telegram)
# Xem Telegram group kỹ thuật

# ✅ 6. MySQL connections
mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"

# ✅ 7. Redis
redis-cli ping && redis-cli info memory | grep used_memory_human

# ✅ 8. Báo cáo tổng hợp (tùy chọn)
pnpm check:all:prod
```

Hoặc chạy báo cáo tự động hàng ngày:

```bash
pnpm report:daily:prod
```

---

## 12. TÀI LIỆU LIÊN QUAN

| Tài liệu | Mô tả |
|----------|-------|
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | Kiến trúc hệ thống, stack công nghệ |
| [`docs/SETUP.md`](./SETUP.md) | Cài đặt môi trường local |
| [`docs/ONBOARDING.md`](./ONBOARDING.md) | Hướng dẫn làm quen cho thành viên mới |
| [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) | Deploy canonical (chi tiết) |
| [`docs/OPERATIONS.md`](./OPERATIONS.md) | Runbook vận hành production |
| [`docs/INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) | Quy trình ứng phó sự cố |
| [`docs/API_ENDPOINTS.md`](./API_ENDPOINTS.md) | API endpoint reference |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | CI pipeline |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | CD pipeline |
| [`scripts/deploy.sh`](../scripts/deploy.sh) | Deploy script VPS |
| [`scripts/backup.sh`](../scripts/backup.sh) | Backup script |
| [`scripts/health-check.ts`](../scripts/health-check.ts) | Health check script |
