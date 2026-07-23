# MIGRATION GUIDE — v2.1
# Hướng dẫn chạy migration cho toàn bộ hệ thống database

> **Thứ tự bắt buộc:** admin → hub → game → dating → trade → sports  
> Admin DB chứa `project_configs` và `payment_gateways` mà các module khác phụ thuộc.

---

## 0. Chuẩn bị

```bash
# 1. Vào thư mục backend
cd source/backend

# 2. Kiểm tra .env tồn tại và có đủ biến
cat ../../.env | grep DATABASE_URL

# 3. Biến cần có:
# ADMIN_DATABASE_URL="mysql://admin_user:pass@localhost:3306/admin_db"
# HUB_DATABASE_URL="mysql://hub_user:pass@localhost:3306/hub_db"
# GAME_DATABASE_URL="mysql://game_user:pass@localhost:3306/game_db"
# DATING_DATABASE_URL="mysql://dating_user:pass@localhost:3306/dating_db"
# TRADE_DATABASE_URL="mysql://trade_user:pass@localhost:3306/trade_db"
# SPORTS_DATABASE_URL="mysql://sports_user:pass@localhost:3306/sports_db"
```

---

## 1. Tạo databases (lần đầu)

```sql
-- Chạy file init-databases.sql
mysql -u root -p < source/backend/init-databases.sql
```

Hoặc thủ công:

```sql
CREATE DATABASE IF NOT EXISTS admin_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS hub_db     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS game_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS dating_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS trade_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sports_db  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Tạo users & phân quyền

```sql
CREATE USER IF NOT EXISTS 'admin_user'@'localhost'   IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'hub_user'@'localhost'     IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'game_user'@'localhost'    IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'dating_user'@'localhost'  IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'trade_user'@'localhost'   IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'sports_user'@'localhost'  IDENTIFIED BY 'CHANGE_ME';

GRANT ALL PRIVILEGES ON admin_db.*   TO 'admin_user'@'localhost';
GRANT ALL PRIVILEGES ON hub_db.*     TO 'hub_user'@'localhost';
GRANT ALL PRIVILEGES ON game_db.*    TO 'game_user'@'localhost';
GRANT ALL PRIVILEGES ON dating_db.*  TO 'dating_user'@'localhost';
GRANT ALL PRIVILEGES ON trade_db.*   TO 'trade_user'@'localhost';
GRANT ALL PRIVILEGES ON sports_db.*  TO 'sports_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3. Chạy Prisma generate (tạo client)

```bash
cd source/backend

# ✅ Cách mới — dùng prisma-run.ts (tham số hóa, TypeScript)
tsx scripts/prisma-run.ts generate           # tất cả 6 module
tsx scripts/prisma-run.ts generate hub       # chỉ 1 module

# Hoặc dùng npm script shortcut
npm run prisma:generate                       # tất cả
npm run prisma:generate:hub                   # chỉ hub
npm run prisma:generate:game                  # chỉ game
# ...tương tự cho: trade, dating, sports, admin
```

---

## 4. Chạy migration (lần đầu — môi trường dev)

> ⚠️ `migrate dev` sẽ xóa và tạo lại DB nếu có conflict. **Chỉ dùng cho dev/staging.**

```bash
cd source/backend

# ✅ Cách mới — chạy tất cả theo thứ tự chuẩn (admin → hub → game → dating → trade → sports)
tsx scripts/prisma-run.ts migrate             # tất cả 6 module
npm run prisma:migrate:all                    # shortcut npm

# Chỉ 1 module (khi schema thay đổi):
tsx scripts/prisma-run.ts migrate dating
```

---

## 5. Chạy migration (production — deploy)

> ✅ `migrate deploy` áp dụng các pending migrations **không reset data**.

```bash
cd source/backend

# ✅ Cách mới — 1 lệnh cho tất cả
tsx scripts/prisma-run.ts deploy              # tất cả 6 module
npm run prisma:deploy:all                     # shortcut npm

# Chỉ 1 module:
tsx scripts/prisma-run.ts deploy sports
```

---

## 6. Chạy Seed data

```bash
cd source/backend

# Chạy tất cả seeds theo thứ tự (khuyến nghị)
npm run seed:all

# Hoặc chạy từng seed (TypeScript, dùng tsx)
npm run seed:admin        # users, payment gateways, project configs
npm run seed:ui-config    # brand, colors, social, features cho 5 sub-projects
npm run seed:payment      # payment gateways
npm run seed:hub          # categories, banners, pages
npm run seed:game         # lottery types, odds settings
npm run seed:lkvip        # bank accounts, payment settings
npm run seed:dating       # gift catalog, VIP plans
npm run seed:sports       # leagues, teams, markets

# Force re-seed (ghi đè data hiện có)
npm run seed:all:force
```

---

## 7. Áp dụng extra indexes

> Chạy sau khi migrate để bổ sung composite indexes hiệu năng.

```bash
mysql -u root -p < source/database/indexes.sql
```

---

## 8. Rollback strategy

### Dev / Staging

```bash
# Reset toàn bộ DB và chạy lại migration (xóa tất cả data)
npx prisma migrate reset --schema=prisma/{module}/schema.prisma
```

### Production (an toàn)

```bash
# Bước 1: Backup trước khi migrate
mysqldump -u root -pPASSWORD --single-transaction \
  admin_db hub_db game_db dating_db trade_db sports_db \
  | gzip > /backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql.gz

# Bước 2: Migrate
npx prisma migrate deploy --schema=prisma/admin/schema.prisma
# ... (các schema còn lại)

# Bước 3: Nếu có lỗi, restore
gunzip -c /backups/pre_migration_TIMESTAMP.sql.gz | mysql -u root -pPASSWORD
```

---

## 9. Thêm field mới (zero-downtime)

```bash
# Bước 1: Thêm field nullable vào schema
# Ví dụ: thêm field mới vào User trong admin schema

# Bước 2: Tạo migration
npx prisma migrate dev \
  --schema=prisma/admin/schema.prisma \
  --name add_user_new_field

# Bước 3: Kiểm tra file SQL trong prisma/admin/migrations/
# Bước 4: Deploy lên staging để test
npx prisma migrate deploy --schema=prisma/admin/schema.prisma

# Bước 5: Nếu cần backfill dữ liệu
node scripts/backfill-new-field.js

# Bước 6: Nếu cần NOT NULL, tạo migration thứ 2
# Bước 7: Deploy lên production
```

---

## 10. Kiểm tra migration status

```bash
# ✅ Cách mới — 1 lệnh cho tất cả
tsx scripts/prisma-run.ts status              # tất cả 6 module
npm run prisma:status:all                     # shortcut npm
```

---

## 11. Prisma Studio (UI quản lý data)

```bash
# ✅ Cách mới — dùng prisma-run.ts (phải chỉ định module)
tsx scripts/prisma-run.ts studio admin        # Admin DB
tsx scripts/prisma-run.ts studio hub          # Hub DB
tsx scripts/prisma-run.ts studio game         # Game DB
# ...tương tự cho: dating, trade, sports

# Mỗi schema mở trên port riêng (tự động)
```

---

## 12. npm scripts reference

> Scripts đã được tham số hóa từ v2.1 — xem [`backend/scripts/README.md`](./backend/scripts/README.md)

```bash
# ── Prisma ────────────────────────────────────────────────────────────────────
npm run prisma:run -- generate          # tham số hóa: node scripts/prisma-run.js generate
npm run prisma:generate                 # generate tất cả clients
npm run prisma:generate:hub             # generate chỉ hub (tương tự :game :trade :dating :sports :admin)
npm run prisma:migrate:all              # migrate dev tất cả
npm run prisma:deploy:all               # deploy tất cả
npm run prisma:status:all               # kiểm tra status tất cả

# ── Seeds ─────────────────────────────────────────────────────────────────────
npm run seed:all                        # chạy tất cả seeds (index.js)
npm run seed:all:force                  # force re-seed (SEED_FORCE=true)
npm run seed:admin                      # chỉ admin seed
npm run seed:hub / seed:game / seed:dating / seed:trade / seed:sports / seed:lkvip
npm run seed:payment / seed:flags / seed:ui-config / seed:aggregators / seed:game-products / seed:demo
```

---

## 13. Multi-DB Coordination (Thay đổi nhiều schema cùng lúc)

> **Quy tắc:** Mỗi module chỉ migrate schema của chính mình — **không có cross-schema migration**.

### Deployment order khi nhiều DB thay đổi

```
1. admin      ← Chạy trước (project_configs, payment_gateways)
2. hub
3. game
4. dating     ← Ví dụ: v2.2 thêm DatingMission + DatingEvent
5. trade
6. sports
```

### Quy trình release an toàn

```bash
# Bước 1: Backup ALL databases trước
bash source/scripts/backup-db.sh

# Bước 2: Run migrations theo thứ tự
cd source/backend
tsx scripts/prisma-run.ts deploy admin
tsx scripts/prisma-run.ts deploy hub
tsx scripts/prisma-run.ts deploy game
tsx scripts/prisma-run.ts deploy dating  # có thay đổi
tsx scripts/prisma-run.ts deploy trade
tsx scripts/prisma-run.ts deploy sports

# Bước 3: Kiểm tra tất cả đã up-to-date
npm run prisma:status:all
# Mỗi dòng phải là: "Database schema is up to date"

# Bước 4: Nếu có seed mới, chạy seed
npm run seed:dating

# Bước 5: PM2 reload (zero-downtime)
pm2 reload lkvip-api --update-env
```

### Rollback nhanh nếu 1 migration thất bại

```bash
# Restore từ backup gần nhất
gunzip -c /var/backups/lkvip-db/lkvip_backup_TIMESTAMP.sql.gz | mysql -u root -p
# Không cần migrate reset — backup đã có schema cũ + data
```

### Convention đặt tên migration

```
YYYYMMDD_HHMMSS_<action>_<entity>
  Ví dụ: 20260810_000000_add_dating_missions_events
```

### Bảng phụ thuộc schema

| Schema  | Phụ thuộc | Ghi chú |
|---------|-----------|---------|
| admin   | Không     | Must run first |
| hub     | admin (project_configs) | Via API call, không phải FK |
| game    | admin (payment_gateways) | Via API call |
| dating  | Không | Độc lập hoàn toàn |
| trade   | Không | Độc lập hoàn toàn |
| sports  | Không | Độc lập hoàn toàn |

> 🚫 **Tuyệt đối không** có cross-DB foreign key giữa các project.

---

## Checklist hoàn thiện

- [ ] Tạo 6 databases với utf8mb4
- [ ] Tạo DB users và cấp quyền
- [ ] Chạy `prisma generate` cho tất cả schema
- [ ] Chạy `prisma migrate dev` (dev) hoặc `migrate deploy` (prod)
- [ ] Kiểm tra `prisma migrate status` tất cả = "Database schema is up to date"
- [ ] Chạy tất cả seed scripts
- [ ] Áp dụng `source/database/indexes.sql`
- [ ] Kiểm tra Prisma Studio mỗi DB
- [ ] Chạy API smoke test (POST /auth/register, GET /api/game/games, etc.)
