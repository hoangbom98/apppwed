# 🗄️ DATABASE GUIDE — Vận hành & Tối ưu

> **Cập nhật lần cuối:** v2.1 — Schema đồng bộ với Prisma, xóa file thừa, chuẩn hóa shared config

---

## Mục lục

1. [Kiến trúc tổng quan](#1-kiến-trúc-tổng-quan)
2. [Migration Strategy](#2-migration-strategy)
3. [Seed Data](#3-seed-data)
4. [Performance Optimization](#4-performance-optimization)
5. [Bảo mật Database](#5-bảo-mật-database)
6. [Backup & Restore](#6-backup--restore)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Data Retention & Cleanup](#8-data-retention--cleanup)
9. [Checklist Production](#9-checklist-production)
10. [Schema Reference — admin_db](#10-schema-reference--admin_db)
11. [Schema Reference — hub_db](#11-schema-reference--hub_db)
12. [Schema Reference — game_db](#12-schema-reference--game_db)
13. [Schema Reference — dating_db](#13-schema-reference--dating_db)
14. [Schema Reference — trade_db](#14-schema-reference--trade_db)
15. [Schema Reference — sports_db](#15-schema-reference--sports_db)

---

## 1. Kiến trúc tổng quan

Hệ thống sử dụng **6 databases MySQL độc lập**, mỗi database tương ứng một sub-project:

| Database    | Schema File                          | Backup SQL Reference          | Env Var                 | Mục đích                  |
|-------------|--------------------------------------|-------------------------------|-------------------------|---------------------------|
| `admin_db`  | `prisma/admin/schema.prisma`         | `database/admin_schema.sql`   | `ADMIN_DATABASE_URL`    | User, Wallet, Transaction, KYC, Risk, Config toàn hệ thống |
| `hub_db`    | `prisma/hub/schema.prisma`           | `database/hub_schema.sql`     | `HUB_DATABASE_URL`      | CMS, Banner, News, Tool, Game listing |
| `game_db`   | `prisma/game/schema.prisma`          | `database/game_schema.sql`    | `GAME_DATABASE_URL`     | Game session, Lottery, Bet |
| `trade_db`  | `prisma/trade/schema.prisma`         | `database/trade_schema.sql`   | `TRADE_DATABASE_URL`    | Order, Position, Symbol, Price history |
| `dating_db` | `prisma/dating/schema.prisma`        | `database/dating_schema.sql`  | `DATING_DATABASE_URL`   | Match, Chat, Gift, VIP plan |
| `sports_db` | `prisma/sports/schema.prisma`        | `database/sports_schema.sql`  | `SPORTS_DATABASE_URL`   | League, Match, LiveScore, Stream |

Mỗi schema có **Prisma Client riêng** được generate vào `node_modules/.prisma/{module}-client`.

> **Lưu ý:** Trong production, schema được quản lý 100% bởi Prisma migrations (`prisma migrate deploy`).
> Các file `database/*.sql` chỉ dùng cho reference / restore thủ công.

### Các file trong `source/database/`

| File | Mục đích |
|------|---------|
| `admin_schema.sql`  | Backup reference schema đầy đủ cho `admin_db` (đồng bộ với Prisma v2.1) |
| `hub_schema.sql`    | Backup reference schema cho `hub_db` |
| `game_schema.sql`   | Backup reference schema cho `game_db` |
| `trade_schema.sql`  | Backup reference schema cho `trade_db` |
| `dating_schema.sql` | Backup reference schema cho `dating_db` |
| `sports_schema.sql` | Backup reference schema cho `sports_db` |
| `indexes.sql`       | Composite indexes bổ sung — chạy SAU `prisma migrate deploy` |
| `docker-init.sql`   | Tạo 6 databases + grant quyền — dùng cho Docker dev container |
| `DATABASE_GUIDE.md` | File này |

---

## 2. Migration Strategy

### 2.1. Quy trình chuẩn

```bash
# 1. Chỉnh sửa file .prisma tương ứng
# 2. Tạo migration (dev)
npm run prisma:migrate:hub     # hoặc :game, :trade, :dating, :sports, :admin

# 3. Kiểm tra SQL được sinh ra
# backend/prisma/hub/migrations/YYYYMMDDHHMMSS_<name>/migration.sql

# 4. Deploy lên staging / production
npm run prisma:deploy:hub      # hoặc :all để deploy tất cả
```

### 2.2. Deploy toàn bộ (production)

```bash
# Backup trước, sau đó:
npm run prisma:deploy:all
```

### 2.3. Rollback

Prisma không hỗ trợ rollback tự động. Trong production, luôn backup trước:

```bash
# Backup trước migrate
npm run backup

# Nếu lỗi, restore từ backup:
node scripts/restore.js backups/2026-07-20/hub_db.sql.gz hub_db
# hoặc
npm run restore -- backups/2026-07-20/hub_db.sql.gz hub_db
```

### 2.4. Zero-downtime migration

Với thay đổi lớn (rename column, drop column), chia thành nhiều migration nhỏ:

```
Step 1: ADD COLUMN new_col NULL
Step 2: Backfill data (job/script)
Step 3: ALTER COLUMN new_col NOT NULL
Step 4: DROP COLUMN old_col
```

---

## 3. Seed Data

### 3.1. Chạy seed

```bash
# Từ thư mục backend/
npm run seed:all       # admin → hub → game → dating → sports

# Hoặc từng module
npm run seed:admin
npm run seed:hub
npm run seed:game
npm run seed:dating
npm run seed:sports
```

### 3.2. Files seed

| File | Database | Nội dung |
|------|----------|----------|
| `src/prisma/seeds/all.seed.js`            | all DBs  | Orchestrator — chạy tất cả seeds theo thứ tự |
| `src/prisma/seeds/admin.seed.js`          | admin_db | AdminUser, Projects, SystemSettings |
| `src/prisma/seeds/hub.seed.js`            | hub_db   | Category, Banner, Page, Setting |
| `src/prisma/seeds/game.seed.js`           | game_db  | GameCategory, GameProvider, LotteryType, OddsSetting, BankAccount |
| `src/prisma/seeds/dating.seed.js`         | dating_db| VipPlan, Gift, Mission |
| `src/prisma/seeds/sports.seed.js`         | sports_db| League, Team, Sample Match |
| `src/prisma/seeds/ui-config.seed.js`      | admin_db | ProjectConfig — UI/branding configs cho 5 projects |
| `src/prisma/seeds/feature-flags.seed.js`  | admin_db | Feature flags + payment configs cho 5 projects |
| `src/prisma/seeds/payment-gateways.seed.js`| admin_db | PaymentGateway rows |
| `src/prisma/seeds/demo.seed.js`           | all DBs  | Demo data (development only) |
| `src/prisma/seeds/lkvip.seed.js`          | game_db  | LKvip internal gateway config |

Tất cả seed dùng `upsert` — **an toàn để chạy lại** nhiều lần.

---

## 4. Performance Optimization

### 4.1. Indexes

File `database/indexes.sql` chứa composite indexes bổ sung (ngoài indexes Prisma tự tạo).

```bash
# Áp dụng sau prisma:deploy
mysql -u root -p < database/indexes.sql
```

**Các index quan trọng nhất:**

| Database | Index | Mục đích |
|----------|-------|----------|
| admin_db | `(userId, status, createdAt)` trên Transaction | Lọc giao dịch user |
| admin_db | `(action, project, createdAt)` trên AuditLog | Report audit |
| game_db  | `(userId, status, createdAt)` trên GameSession | Lịch sử chơi |
| game_db  | `(drawId, status)` trên LotteryBet | Kết quả xổ số |
| dating_db| `(user1Id, status)` trên Match | Danh sách match |
| sports_db| `(leagueId, status, startTime)` trên Match | Lịch thi đấu |
| trade_db | `(symbolId, interval, timestamp)` trên PriceHistory | Chart data |

### 4.2. Redis Caching

| Dữ liệu | TTL | Key pattern |
|---------|-----|-------------|
| Balance | 30s | `user:{userId}:balance:{currency}` |
| ProjectConfig | 5 phút | `config:project:{code}` |
| User profile | 10 phút | `user:{userId}:profile` |
| Game list | 5 phút | `games:{category}` |
| Banner | 10 phút | `banners:{position}` |

**Wallet service** (`services/walletService.js`) đã tích hợp sẵn cache-aside pattern.

### 4.3. Query Best Practices

```js
// ✅ Select chỉ field cần thiết
const users = await prisma.user.findMany({
  select: { id: true, email: true, fullName: true },
});

// ✅ Include để tránh N+1
const users = await prisma.user.findMany({
  include: { wallets: true },
});

// ✅ Cursor-based pagination cho bảng lớn
const txns = await prisma.transaction.findMany({
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});
```

### 4.4. Connection Pool

Mặc định Prisma auto-pool. Chỉnh theo traffic trong `.env` (via connection string):

```
mysql://user:pass@host:3306/db?connection_limit=20
```

| Traffic | `connection_limit` |
|---------|--------------------|
| Thấp | 10–20 |
| Trung bình | 20–50 |
| Cao | 50–100 |

---

## 5. Bảo mật Database

### 5.1. Encryption

Dùng `utils/encrypt.js` (AES-256-CBC) cho dữ liệu nhạy cảm:

```js
const { encrypt, decrypt } = require('../utils/encrypt');

// Lưu
const encryptedId = encrypt(user.idNumber);
await prisma.kyc.create({ data: { idNumber: encryptedId, ... } });

// Đọc
const plain = decrypt(kyc.idNumber);
```

Các trường cần mã hoá: `idNumber` (KYC), `bankAccountNumber` (WithdrawOrder), `taxId`.

### 5.2. Database Users

Tạo user riêng cho từng database (không dùng root):

```sql
CREATE USER 'hub_user'@'localhost'    IDENTIFIED BY '<strong_password>';
GRANT ALL PRIVILEGES ON hub_db.*     TO 'hub_user'@'localhost';

CREATE USER 'game_user'@'localhost'   IDENTIFIED BY '<strong_password>';
GRANT ALL PRIVILEGES ON game_db.*    TO 'game_user'@'localhost';

-- Tương tự cho trade_user, dating_user, sports_user, admin_user
FLUSH PRIVILEGES;
```

### 5.3. SQL Injection Prevention

Luôn dùng Prisma ORM. Nếu cần raw query:

```js
// ✅ Parameterized
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ❌ String concat — KHÔNG làm
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### 5.4. Audit Log

Dùng `utils/auditLog.js`:

```js
const { logAudit, auditMiddleware } = require('../utils/auditLog');

// Trong controller
await logAudit(req, {
  action:     'user.suspend',
  project:    'admin',
  targetType: 'User',
  targetId:   userId,
  details:    { reason, before: { status: 'active' }, after: { status: 'suspended' } },
});

// Hoặc dùng middleware tự động cho toàn router
router.use(auditMiddleware({ project: 'admin' }));
```

---

## 6. Backup & Restore

### 6.1. Backup thủ công

```bash
npm run backup
# → Tạo thư mục backups/YYYY-MM-DD/ với file .sql.gz cho từng DB
```

### 6.2. Cron job tự động (Ubuntu)

```bash
# Backup hàng ngày lúc 2:00 AM
crontab -e

# Thêm:
0 2 * * * cd /var/www/backend && node scripts/backup.js >> /var/log/db-backup.log 2>&1
0 3 * * * cd /var/www/backend && node scripts/cleanup.js >> /var/log/db-cleanup.log 2>&1
```

### 6.3. Restore

```bash
# Syntax
node scripts/restore.js <backup_file.sql.gz> <database_name>

# Ví dụ
node scripts/restore.js backups/2026-07-20/hub_db.sql.gz hub_db
```

> ⚠️ Lệnh restore sẽ xoá toàn bộ dữ liệu hiện tại trong database đích. Có delay 3 giây để huỷ (Ctrl+C).

### 6.4. Retention Policy

| Loại | Giữ bao lâu | Cấu hình |
|------|-------------|---------|
| Backup files | 30 ngày | `BACKUP_RETENTION_DAYS=30` |
| AuditLog | 90 ngày | `scripts/cleanup.js` |
| Notifications (đã đọc) | 30 ngày | `scripts/cleanup.js` |
| TranslationLog | 30 ngày | `scripts/cleanup.js` |
| GameSession (finished) | 365 ngày | `scripts/cleanup.js` |
| PriceHistory (1m/5m) | 90 ngày | `scripts/cleanup.js` |

---

## 7. Monitoring & Alerting

### 7.1. Slow Query Log (MySQL)

Thêm vào `/etc/mysql/my.cnf`:

```ini
[mysqld]
slow_query_log            = 1
slow_query_log_file       = /var/log/mysql/mysql-slow.log
long_query_time           = 1
log_queries_not_using_indexes = 1
```

Phân tích:

```bash
mysqldumpslow -s t -t 10 /var/log/mysql/mysql-slow.log
```

Tối ưu:

```sql
EXPLAIN SELECT * FROM game_db.GameSession WHERE userId = 'abc' AND status = 'playing';
-- Nếu type = ALL → thiếu index
```

### 7.2. Key Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| DB Connections | > 80% pool | Tăng pool size |
| Avg query time | > 500ms | Review index, add cache |
| Error rate | > 1% | Alert ngay |
| Slow queries | > 50/giờ | Optimize query |
| Disk usage | > 80% | Cleanup + mở rộng |

### 7.3. Alert Service

`services/alertService.js` gửi alert qua Telegram khi có sự cố.

Tích hợp vào health check cron:

```js
// cron: every 5 minutes
const { checkDbHealth } = require('./services/alertService');
cron.schedule('*/5 * * * *', checkDbHealth);
```

### 7.4. Prometheus + Grafana (Optional)

```bash
# MySQL Exporter
docker run -d -p 9104:9104 \
  -e DATA_SOURCE_NAME="root:password@(localhost:3306)/" \
  prom/mysqld-exporter
```

Các panel dashboard cần thiết:
1. DB Connections vs Max
2. Query throughput (QPS)
3. Slow query count
4. Disk usage per DB
5. Replication lag (nếu có replica)

---

## 8. Data Retention & Cleanup

Script `scripts/cleanup.js` tự động dọn dẹp dữ liệu cũ theo retention policy:

```bash
# Chạy thủ công
npm run cleanup

# Hoặc cron job hàng ngày lúc 3:00 AM (kết hợp với backup)
```

### Partitioning (bảng > 10M rows)

Nếu `admin_db.Transaction` vượt 10M rows, áp dụng RANGE partition theo tháng:

```sql
ALTER TABLE admin_db.Transaction
PARTITION BY RANGE (TO_DAYS(createdAt)) (
  PARTITION p202601 VALUES LESS THAN (TO_DAYS('2026-02-01')),
  PARTITION p202602 VALUES LESS THAN (TO_DAYS('2026-03-01')),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## 9. Checklist Production

### Thiết lập ban đầu

- [ ] Cài MySQL 8.0, cấu hình `my.cnf` (utf8mb4, innodb_buffer_pool, slow query log)
- [ ] Tạo 6 databases với charset `utf8mb4_unicode_ci`
- [ ] Tạo user riêng cho từng DB (`hub_user`, `game_user`, …)
- [ ] Set `ENCRYPTION_KEY` (64 hex chars) trong `.env`
- [ ] Set `ADMIN_DEFAULT_EMAIL` và `ADMIN_DEFAULT_PASSWORD` trong `.env`
- [ ] Chạy `npm run prisma:generate` để generate Prisma clients
- [ ] Chạy `npm run prisma:deploy:all` để tạo schema
- [ ] Chạy `mysql -u root -p < database/indexes.sql` để thêm performance indexes
- [ ] Chạy `npm run seed:all` để tạo dữ liệu mẫu

### Vận hành thường xuyên

- [ ] Cron backup: `0 2 * * *` → `npm run backup`
- [ ] Cron cleanup: `0 3 * * *` → `npm run cleanup`
- [ ] Kiểm tra slow query log hàng tuần
- [ ] Kiểm tra disk usage hàng ngày
- [ ] Test restore từ backup mỗi tháng
- [ ] Review AuditLog cho bất thường mỗi tuần

### Bảo mật

- [ ] Không dùng root trong app, dùng user riêng từng DB
- [ ] Mã hoá dữ liệu KYC và bank account với `utils/encrypt.js`
- [ ] Enable SSL cho connection string trong production
- [ ] Restrict MySQL bind-address (`127.0.0.1`)
- [ ] Firewall: chỉ cho phép localhost access port 3306

---

*Xem thêm: [`database/indexes.sql`](./database/indexes.sql) · [`backend/scripts/backup.js`](./backend/scripts/backup.js) · [`backend/scripts/restore.js`](./backend/scripts/restore.js) · [`backend/scripts/cleanup.js`](./backend/scripts/cleanup.js)*

---

## 10. Schema Reference — admin_db

> **Source:** [`database/admin_schema.sql`](./admin_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** Quản lý super-admin, session tokens, thống kê hàng ngày tổng hợp từ mọi sub-project, audit log toàn hệ thống, và cấu hình domain.

**Tổng số bảng:** 5

### Bảng `admins`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | Định danh admin |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Tên đăng nhập |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu bcrypt |
| `full_name` | VARCHAR(100) | NULL | Tên đầy đủ |
| `avatar` | VARCHAR(255) | NULL | URL ảnh đại diện |
| `role` | ENUM | DEFAULT 'admin' | `superadmin` / `admin` / `analyst` |
| `status` | ENUM | DEFAULT 'active' | `active` / `inactive` |
| `last_login_at` | DATETIME | NULL | Lần đăng nhập cuối |
| `last_login_ip` | VARCHAR(45) | NULL | IP đăng nhập cuối (IPv6 ready) |
| `created_at` | TIMESTAMP | DEFAULT NOW | — |
| `updated_at` | TIMESTAMP | ON UPDATE NOW | — |

**Seed:** 1 bản ghi superadmin mặc định (`superadmin@group.local`) — **bắt buộc thay password** trước khi deploy.

### Bảng `refresh_tokens`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK | — |
| `admin_id` | INT | FK → admins(id) CASCADE | Liên kết admin |
| `token` | VARCHAR(512) | NOT NULL, UNIQUE | JWT refresh token |
| `expires_at` | DATETIME | NOT NULL | Thời điểm hết hạn |
| `created_at` | TIMESTAMP | — | — |

### Bảng `daily_stats`

Snapshot số liệu hàng ngày, được populate bởi cron aggregation từ các sub-project DB.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK | — |
| `project` | ENUM | NOT NULL | `hub` / `game` / `trade` / `dating` / `sports` |
| `stat_date` | DATE | NOT NULL | Ngày thống kê |
| `new_users` | INT UNSIGNED | DEFAULT 0 | Người dùng mới trong ngày |
| `active_users` | INT UNSIGNED | DEFAULT 0 | Người dùng hoạt động |
| `page_views` | INT UNSIGNED | DEFAULT 0 | Lượt xem trang |
| `revenue` | DECIMAL(20,2) | DEFAULT 0 | Doanh thu (VND) |
| `extra` | JSON | NULL | Dữ liệu bổ sung tùy project |
| `created_at` | TIMESTAMP | — | — |

**Indexes:** UNIQUE KEY `uq_project_date` (`project`, `stat_date`) — đảm bảo 1 bản ghi/project/ngày.

### Bảng `audit_logs`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | BIGINT — volume cao |
| `admin_id` | INT | NOT NULL, IDX | ID admin thực hiện |
| `action` | VARCHAR(100) | NOT NULL, IDX | Ví dụ: `user.suspend`, `config.update` |
| `target_type` | VARCHAR(50) | NULL | Loại đối tượng bị tác động |
| `target_id` | VARCHAR(100) | NULL | ID đối tượng |
| `detail` | JSON | NULL | `{before, after, reason, ...}` |
| `ip` | VARCHAR(45) | NULL | IP của admin |
| `created_at` | TIMESTAMP | — | — |

**Retention:** 90 ngày (xem `scripts/cleanup.js`).

### Bảng `system_settings`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK | — |
| `key` | VARCHAR(100) | NOT NULL, UNIQUE | Khóa cài đặt |
| `value` | TEXT | NOT NULL | Giá trị |
| `group` | VARCHAR(50) | DEFAULT 'general' | Nhóm: `domains`, `general`, ... |
| `description` | VARCHAR(255) | NULL | Mô tả |

**Seed mặc định (5 bản ghi):**

| key | value | group |
|-----|-------|-------|
| `hub_domain` | `hub.yourdomain.com` | domains |
| `game_domain` | `game.yourdomain.com` | domains |
| `trade_domain` | `trade.yourdomain.com` | domains |
| `dating_domain` | `dating.yourdomain.com` | domains |
| `sports_domain` | `sports.yourdomain.com` | domains |

---

## 11. Schema Reference — hub_db

> **Source:** [`database/hub_schema.sql`](./hub_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** CMS tổng hợp — quản lý nội dung (games, websites, tools, news, pages, banners, menus), log phân tích, và SEO.

**Tổng số bảng:** 22

### Bảng `users`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK | — |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | — |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | — |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt |
| `full_name` | VARCHAR(100) | NULL | — |
| `avatar` | VARCHAR(255) | NULL | — |
| `role` | ENUM | DEFAULT 'user' | `admin` / `user` |
| `status` | ENUM | DEFAULT 'active' | `active` / `inactive` / `banned` |
| `preferred_language` | VARCHAR(10) | DEFAULT 'vi' | Ngôn ngữ ưa thích |

**Indexes:** `idx_users_role`, `idx_users_status`

### Bảng `refresh_tokens`

Cấu trúc chuẩn — FK → `users(id)` ON DELETE CASCADE.

### Bảng `categories`

Phân loại đa mục đích với self-referential parent:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `type` | ENUM | `game` / `website` / `tool` / `news` — discriminator |
| `parent_id` | INT | FK → `categories(id)` SET NULL — hỗ trợ nested categories |
| `slug` | VARCHAR(100) | UNIQUE |

**Index:** `idx_cat_type` (`type`)

### Bảng `games` / `websites` / `tools`

Ba bảng listing content, đều FK → `categories(id)` CASCADE. Điểm khác biệt:

| Bảng | Cột đặc biệt |
|------|--------------|
| `games` | `link` (URL chơi game), `publisher` |
| `websites` | `link` (external URL), `logo` |
| `tools` | `os` **SET**('windows','android','ios','linux','macos'), `version`, `file_size`, `download_link` |

> `tools.os` dùng kiểu `SET` (multi-value) — không phải ENUM. Một tool có thể hỗ trợ nhiều OS cùng lúc.

### Bảng `news`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `content` | LONGTEXT | Nội dung HTML đầy đủ |
| `status` | ENUM | `published` / `draft` |
| `views` | INT UNSIGNED | Lượt xem (tăng dần) |

### Bảng `pages`

5 trang tĩnh CMS được seed mặc định: `about`, `policy`, `terms`, `faq`, `contact`.

### Bảng `banners`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `position` | ENUM | `home` / `sidebar` |
| `type` | ENUM | `slider` / `popup` |

**Index:** `idx_banners_pos` (`position`, `status`) — query nhanh banner theo vị trí.

### Bảng `menus`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `location` | ENUM | `header` / `footer` / `sidebar` |
| `items` | JSON | Array of `{label, url, target, children[]}` |

### Bảng `feedbacks`

Phản hồi từ user (có thể anonymous — `user_id` nullable). Trạng thái: `pending` → `replied` → `resolved`.

### Bảng `notifications`

FK → `users(id)` CASCADE. Index: `(user_id, is_read)` để query unread nhanh.

### Bảng `announcements`

Thông báo system-wide với `start_date` / `end_date`. Không gắn với user cụ thể.

### Bảng `favorites`

Polymorphic: `(user_id, target_type, target_id)`.

| Cột | Mô tả |
|-----|-------|
| `target_type` | ENUM `game` / `website` / `tool` |
| `target_id` | ID trong bảng tương ứng |

**UNIQUE KEY** `uq_fav` (`user_id`, `target_type`, `target_id`) — không cho trùng.

### Bảng `seo_meta`

Quản lý SEO theo URL: `meta_title`, `meta_description`, `meta_keywords`, `og_image`, `robots`.

### Bảng `redirects`

301/302 redirect management. `from_url` UNIQUE.

### Bảng `settings`

8 bản ghi seed mặc định, nhóm: `general` (4), `social` (2), `seo` (1).

### Bảng `uploads`

File upload tracker. FK → `users(id)` SET NULL (giữ record khi user bị xóa).

### Bảng `visit_logs` / `download_logs` / `click_logs` / `search_logs`

Bảng analytics — dùng **BIGINT** PK cho volume cao:

| Bảng | Mô tả |
|------|-------|
| `visit_logs` | Page visit: ip, user_agent, page, referer |
| `download_logs` | Tool download: FK → tools(id) CASCADE |
| `click_logs` | Click tracking: polymorphic (game / website) |
| `search_logs` | Keyword search: index trên `keyword(50)` |

---

## 12. Schema Reference — game_db

> **Source:** [`database/game_schema.sql`](./game_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** Nền tảng game — quản lý người dùng, phiên game, ví tiền, lệnh nạp/rút, đại lý, giới thiệu, và khuyến mãi.

**Tổng số bảng:** 15 (base SQL) · Prisma schema có thêm 15+ bảng mở rộng (LotteryDraw, LotteryBet, GameProvider, SupportRoom, ...)

### Bảng `users`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `role` | ENUM | `superadmin` / `admin` / `agent` / `support` / `user` |
| `balance` | DECIMAL(15,2) | Số dư nhanh (redundant với wallets — dùng cho hiển thị) |
| `referral_code` | VARCHAR(10) | UNIQUE — mã giới thiệu |
| `invited_by` | INT | ID người giới thiệu (không FK để tránh cascade phức tạp) |

### Bảng `game_categories`

Phân loại game: `name`, `slug` UNIQUE, `icon`, `sort_order`, `status`.

### Bảng `games`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `type` | VARCHAR(50) | Loại game (slots, live, lottery, ...) |
| `provider` | VARCHAR(50) | Nhà cung cấp (EVO, Playtech, ...) |
| `api_endpoint` | VARCHAR(255) | NULL | Endpoint API game |
| `params` | JSON | NULL | Tham số tùy chỉnh theo provider |

### Bảng `game_rooms`

Phòng chơi thuộc game: giới hạn cược `min_bet` / `max_bet`. Status: `active` / `closed`.

### Bảng `game_sessions`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | BIGINT | PK — volume cao |
| `session_token` | VARCHAR(255) | UNIQUE — xác thực phiên chơi |
| `bet_amount` | DECIMAL(15,2) | Số tiền cược |
| `win_amount` | DECIMAL(15,2) | Số tiền thắng |
| `result` | JSON | NULL | Kết quả game (dạng raw từ provider) |
| `status` | ENUM | `playing` / `finished` / `abandoned` |

**Retention:** `finished` sessions xóa sau 365 ngày.

### Bảng `wallets`

**UNIQUE KEY** `uq_user_currency` (`user_id`, `currency`) — mỗi user có 1 ví/loại tiền. Dùng `frozen_balance` để giữ tiền khi đang xử lý lệnh.

### Bảng `orders`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `id` | VARCHAR(50) | PK string (không AUTO_INCREMENT) |
| `order_type` | ENUM | `deposit` / `withdraw` / `transfer` |
| `payment_method` | ENUM | `momo` / `banking` / `usdt` / `card` |
| `status` | ENUM | `pending` → `success` / `failed` |

### Bảng `transactions`

Ledger bất biến — mỗi thay đổi số dư tạo 1 bản ghi:

| Cột | Mô tả |
|-----|-------|
| `type` | `credit` (cộng) / `debit` (trừ) |
| `reference_type` | `order` / `bonus` / `commission` / `game_bet` / `game_win` / `manual` |
| `balance_after` | Snapshot số dư sau giao dịch |

### Bảng `agents`

Cây đại lý self-referential:

```
Root Agent (level=1, parent=NULL)
  └── Sub-Agent (level=2, parent_agent_id=1)
        └── Sub-Sub-Agent (level=3, ...)
```

| Cột | Mô tả |
|-----|-------|
| `user_id` | UNIQUE — 1 user = 1 agent node |
| `parent_agent_id` | FK → agents(id) SET NULL |
| `commission_rate` | DECIMAL(5,2) — % hoa hồng của cấp này |
| `total_commission` | Tổng tích lũy |

### Bảng `referrals`

**UNIQUE KEY** `uq_referrer_referee` (`referrer_id`, `referee_id`) — không cho giới thiệu trùng.

### Bảng `notifications`

`user_id` NULL = broadcast toàn hệ thống. Type: `system` / `transaction` / `game` / `promotion`.

### Bảng `messages`

Chat room: `receiver_id` NULL = broadcast. `room` mặc định 'general'.

### Bảng `promotions` / `user_promotions`

| Bảng | Mô tả |
|------|-------|
| `promotions` | Định nghĩa khuyến mãi: type (`bonus`/`cashback`/`free_spin`), `conditions` JSON |
| `user_promotions` | Lịch sử nhận: UNIQUE (`user_id`, `promotion_id`), status `claimed` → `used` / `expired` |

### Bảng `settings`

5 cài đặt seed mặc định: `min_deposit` (50000 VND), `min_withdraw` (100000 VND), `commission_f1` (5%), `commission_f2` (2%), `maintenance` (false).

---

## 13. Schema Reference — dating_db

> **Source:** [`database/dating_schema.sql`](./dating_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** Nền tảng dating & livestream — quản lý streamer, phòng live, quà tặng, cuộc gọi video tính phí theo phút, gói VIP, và thanh toán.

**Tổng số bảng:** 14 (base SQL) · Prisma schema có thêm: Match, Story, ShortVideo, Post, Comment, Like, Block, Report

### Bảng `users`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `gender` | ENUM | `male` / `female` / `other` — NULL cho phép |
| `bio` | TEXT | Mô tả cá nhân |
| `role` | ENUM | `admin` / `streamer` / `user` |
| `balance` | DECIMAL(15,2) | Số dư coin/point của user |

### Bảng `streamers`

Profile streamer mở rộng từ `users`:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `user_id` | INT | UNIQUE FK → users(id) CASCADE |
| `call_price_min` | DECIMAL(10,2) | Giá/phút gọi video |
| `commission_rate` | DECIMAL(5,2) | DEFAULT 70.00 — streamer nhận 70%, platform giữ 30% |
| `total_earnings` | DECIMAL(15,2) | Tổng thu nhập tích lũy |
| `is_online` | BOOLEAN | Trạng thái online real-time |
| `tags` | JSON | NULL | Nhãn chuyên môn/sở thích |
| `status` | ENUM | `active` / `inactive` / `suspended` |

**Indexes:** `idx_streamers_status`, `idx_streamers_online` — query streamer online.

### Bảng `videos`

Nội dung video pre-recorded của streamer:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `price` | DECIMAL(10,2) | Giá mua (0 = miễn phí) |
| `is_free` | BOOLEAN | True = cho xem trước; kết hợp `video_purchases` để chặn truy cập trả phí |
| `status` | ENUM | `pending` (chờ duyệt) → `active` / `inactive` |

### Bảng `live_rooms`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `stream_key` | VARCHAR(100) | UNIQUE — key RTMP cho streaming server |
| `viewer_count` | INT UNSIGNED | Số người xem hiện tại (real-time update) |
| `is_live` | BOOLEAN | Index `idx_rooms_live` — query phòng đang live |

### Bảng `gifts`

Kinh tế quà tặng:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `price` | DECIMAL(10,2) | Chi phí platform coin mà user tiêu |
| `value` | DECIMAL(10,2) | Giá trị quy đổi tiền thật cho streamer nhận |

> Ví dụ: Gift "Hoa hồng" — `price` = 100 coin (user trả), `value` = 70 VND (streamer nhận sau % hoa hồng).

### Bảng `gift_sends`

Lịch sử gửi quà: `sender_id` → `streamer_id`, `quantity` × `gifts.price` = `total_cost`.

### Bảng `calls`

Cuộc gọi video tính phí theo phút:

| Cột | Mô tả |
|-----|-------|
| `price_per_min` | Snapshot giá/phút tại thời điểm gọi (từ `streamers.call_price_min`) |
| `duration_sec` | Thời lượng giây thực tế |
| `total_cost` | = `price_per_min × duration_sec / 60` |
| `status` | `pending` → `active` → `ended` / `missed` |

### Bảng `vip_plans` / `vip_memberships`

| Bảng | Mô tả |
|------|-------|
| `vip_plans` | Định nghĩa gói: `name`, `price`, `duration_days`, `benefits` JSON |
| `vip_memberships` | Đăng ký: `starts_at`, `expires_at`, status `active` → `expired` / `cancelled` |

### Bảng `transactions`

`reference_type`: `deposit` / `gift` / `call` / `vip` / `withdraw` / `video_purchase`.

### Bảng `messages`

| Cột | Mô tả |
|-----|-------|
| `receiver_id` | NULL = broadcast vào stream room |
| `room_id` | FK ngầm → live_rooms(id) — không có FK constraint |

### Bảng `video_purchases`

**UNIQUE KEY** `uq_user_video` (`user_id`, `video_id`) — kiểm soát quyền truy cập video trả phí.

### Bảng `notifications`

Type: `system` / `gift` / `call` / `vip` / `stream`.

---

## 14. Schema Reference — trade_db

> **Source:** [`database/trade_schema.sql`](./trade_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** Nền tảng giao dịch CFD/crypto — quản lý người dùng với KYC + 2FA, ký hiệu thị trường, lệnh giao dịch, vị thế, nạp/rút, và cảnh báo giá.

**Tổng số bảng:** 13

### Bảng `users`

Bảng users đặc biệt nhất hệ thống — có thêm 2FA và KYC:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `totp_secret` | VARCHAR(64) | NULL | Google Authenticator secret key |
| `totp_enabled` | BOOLEAN | DEFAULT FALSE | Trạng thái 2FA |
| `kyc_status` | ENUM | `pending` / `submitted` / `approved` / `rejected` |
| `kyc_submitted_at` | DATETIME | NULL | Thời điểm nộp KYC |
| `referral_code` | VARCHAR(10) | NULL, UNIQUE | — |

**Index:** `idx_users_kyc` (`kyc_status`), `idx_users_status` (`status`)

### Bảng `kyc_documents`

Quy trình KYC:

| Cột | Mô tả |
|-----|-------|
| `doc_type` | `id_card` / `passport` / `driver_license` |
| `front_image`, `back_image`, `selfie` | URLs ảnh tài liệu (cần encrypt nếu lưu nhạy cảm) |
| `note` | Ghi chú admin khi review |
| `status` | `pending` → `approved` / `rejected` |
| `reviewed_by` | INT — ID admin review (không FK) |

### Bảng `market_categories`

4 danh mục seed: **Crypto**, **Forex**, **Stocks**, **Commodities**.

### Bảng `symbols`

Cấu hình ký hiệu giao dịch:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `symbol` | VARCHAR(20) | UNIQUE — ví dụ: BTCUSDT, EURUSD |
| `pip_size` | DECIMAL(10,8) | Giá trị 1 pip |
| `min_lot` / `max_lot` | DECIMAL(10,4) | Giới hạn khối lượng lệnh |
| `margin_rate` | DECIMAL(5,2) | % ký quỹ yêu cầu |
| `leverage_max` | INT | Đòn bẩy tối đa của symbol |
| `fee_rate` | DECIMAL(5,4) | DEFAULT 0.001 — phí taker |

### Bảng `wallets`

Dùng **DECIMAL(20,8)** để hỗ trợ độ chính xác crypto (8 chữ số thập phân). Mặc định USD.

### Bảng `orders`

| Cột | Mô tả |
|-----|-------|
| `id` | VARCHAR(36) — UUID |
| `type` | `market` / `limit` / `stop_loss` / `take_profit` |
| `price` | NULL với market orders, populated với limit orders |
| `stop_price` | Giá trigger cho stop orders |
| `fill_price` | Giá khớp thực tế |
| `status` | `pending` → `filled` / `cancelled` / `rejected` |
| `leverage` | Đòn bẩy của lệnh này |
| `fee` | DECIMAL(20,8) — phí giao dịch |

### Bảng `positions`

Vị thế mở sau khi lệnh được khớp:

| Cột | Mô tả |
|-----|-------|
| `side` | `long` (mua) / `short` (bán) |
| `entry_price` | Giá vào |
| `current_price` | Giá thị trường hiện tại (cập nhật real-time) |
| `pnl` | Lợi nhuận/lỗ chưa thực hiện |
| `margin` | Ký quỹ đã khóa |
| `status` | `open` → `closed` |
| `closed_at` | Timestamp đóng vị thế |

### Bảng `transactions`

`reference_type`: `deposit` / `withdraw` / `trade_fee` / `trade_pnl` / `transfer` / `referral`. Dùng DECIMAL(20,8).

### Bảng `deposits`

| Cột | Mô tả |
|-----|-------|
| `payment_method` | `momo` / `banking` / `usdt` |
| `proof_image` | URL ảnh chứng minh (để admin verify thủ công) |
| `tx_id` | Transaction ID từ gateway |

### Bảng `withdrawals`

4-step workflow:

```
pending → approved → paid
         ↘ rejected
```

| Cột | Mô tả |
|-----|-------|
| `bank_name`, `bank_account`, `account_name` | Thông tin ngân hàng nhận (cần encrypt `bank_account`) |
| `admin_note` | Ghi chú khi approve/reject |
| `processed_at` | Thời điểm xử lý xong |

### Bảng `price_alerts`

Cảnh báo giá user cài đặt:

| Cột | Mô tả |
|-----|-------|
| `condition` | `above` (giá vượt) / `below` (giá giảm xuống) |
| `is_fired` | TRUE sau khi đã kích hoạt và gửi thông báo |

### Bảng `settings`

4 cài đặt seed: `default_leverage` (10), `max_leverage` (100), `taker_fee_rate` (0.001), `maker_fee_rate` (0.0005).

---

## 15. Schema Reference — sports_db

> **Source:** [`database/sports_schema.sql`](./sports_schema.sql) · **Charset:** utf8mb4_unicode_ci

**Mục đích:** Điểm số thể thao & live data — quản lý cấu trúc giải đấu (sport → league → team → match), sự kiện live theo thời gian thực, highlight video, tin tức, và đồng bộ dữ liệu từ provider ngoài.

**Tổng số bảng:** 12

### Cấu trúc phân cấp

```
sports (Football, Basketball, ...)
  └── leagues (Premier League, La Liga, ...)
        └── teams (Man City, Barcelona, ...)
              └── matches (home_team vs away_team)
                    └── live_events (goal, card, ...)
```

### Bảng `users`

Bảng users đơn giản nhất — chỉ có `role` (`admin` / `user`) và `status`. Không có `balance`, `referral_code`, `totp`.

### Bảng `sports`

4 môn thể thao seed mặc định: **Football**, **Basketball**, **Tennis**, **Volleyball**.

Cột: `name` UNIQUE, `slug` UNIQUE, `icon`.

### Bảng `leagues`

| Cột | Mô tả |
|-----|-------|
| `sport_id` | FK → sports(id) CASCADE |
| `country` | Quốc gia giải đấu |
| `current_season` | Ví dụ: "2025/26" |
| `status` | `active` / `inactive` |

### Bảng `teams`

| Cột | Mô tả |
|-----|-------|
| `league_id` | FK → leagues(id) CASCADE |
| `short_name` | VARCHAR(10) — tên viết tắt (ví dụ: MCI, BAR) |
| `slug` | UNIQUE |

### Bảng `matches`

Bảng trung tâm của sports_db:

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `home_team_id`, `away_team_id` | INT | FK → teams(id) CASCADE |
| `status` | ENUM | `scheduled` / `live` / `finished` / `postponed` / `cancelled` |
| `home_score`, `away_score` | SMALLINT UNSIGNED | Tỷ số hiện tại |
| `home_score_ht`, `away_score_ht` | SMALLINT UNSIGNED | Tỷ số hiệp 1 |
| `minute` | SMALLINT UNSIGNED | Phút thi đấu hiện tại |
| `external_id` | VARCHAR(50) | UNIQUE — ID từ data provider bên ngoài (football-data.org, API-Football) |
| `extra_data` | JSON | NULL | Stats đầy đủ, lineups, events từ provider |

**Indexes:** `idx_matches_date` (`match_date`), `idx_matches_status` (`status`)

### Bảng `live_events`

Sự kiện real-time trong trận đấu:

| Cột | Mô tả |
|-----|-------|
| `id` | BIGINT — volume rất cao (nhiều sự kiện/trận) |
| `type` | `goal` / `yellow_card` / `red_card` / `substitution` / `var` / `penalty` / `own_goal` |
| `team` | `home` / `away` — đội nào liên quan |
| `player` | Tên cầu thủ (NULL nếu không rõ) |
| `detail` | Mô tả bổ sung (ví dụ: "Penalty missed") |

**Index:** `idx_le_match` (`match_id`) — query events của 1 trận.

### Bảng `highlights`

Video highlight trận đấu: `video_url`, `thumbnail`, `duration_sec`, `views`. FK → matches(id) CASCADE.

### Bảng `news`

| Cột | Mô tả |
|-----|-------|
| `league_id` | INT NULL — tin tức có thể không thuộc league cụ thể |
| `status` | `published` / `draft` |

### Bảng `comments`

Polymorphic — bình luận cho trận đấu **hoặc** bài tin tức:

| Cột | Mô tả |
|-----|-------|
| `match_id` | INT NULL — comment cho trận |
| `news_id` | INT NULL — comment cho tin tức |
| `is_approved` | BOOLEAN DEFAULT TRUE — moderation flag |

**Indexes:** `idx_comments_match` (`match_id`), `idx_comments_news` (`news_id`)

### Bảng `favorite_teams`

**UNIQUE KEY** `uq_user_team` (`user_id`, `team_id`) — không cho theo dõi trùng. Cơ sở để push notification khi đội có trận mới.

### Bảng `notifications`

| Cột | Mô tả |
|-----|-------|
| `type` | `system` / `match_start` / `goal` / `result` |
| `match_id` | INT NULL — liên kết trực tiếp vào trận đấu liên quan |

### Bảng `sync_log`

Metadata vận hành cho đồng bộ dữ liệu từ provider ngoài:

| Cột | Mô tả |
|-----|-------|
| `provider` | Tên provider (ví dụ: `api-football`, `football-data`) |
| `entity_type` | Loại dữ liệu: `matches`, `live_events`, `standings` |
| `records_synced` | Số bản ghi đã đồng bộ thành công |
| `status` | `success` / `failed` |
| `error` | TEXT NULL — chi tiết lỗi nếu failed |

> `sync_log` là metadata vận hành — không phải dữ liệu người dùng. Không cần retention dài hạn.

---

*Xem thêm: [`database/indexes.sql`](./database/indexes.sql) · [`backend/scripts/backup.js`](./backend/scripts/backup.js) · [`backend/scripts/restore.js`](./backend/scripts/restore.js) · [`backend/scripts/cleanup.js`](./backend/scripts/cleanup.js)*
