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

# Generate tất cả clients
npx prisma generate --schema=prisma/admin/schema.prisma
npx prisma generate --schema=prisma/hub/schema.prisma
npx prisma generate --schema=prisma/game/schema.prisma
npx prisma generate --schema=prisma/dating/schema.prisma
npx prisma generate --schema=prisma/trade/schema.prisma
npx prisma generate --schema=prisma/sports/schema.prisma
```

Hoặc dùng script npm:

```bash
npm run prisma:generate
```

---

## 4. Chạy migration (lần đầu — môi trường dev)

> ⚠️ `migrate dev` sẽ xóa và tạo lại DB nếu có conflict. **Chỉ dùng cho dev/staging.**

```bash
cd source/backend

# 4.1 Admin DB (phải chạy trước tiên)
npx prisma migrate dev \
  --schema=prisma/admin/schema.prisma \
  --name init_admin_v2

# 4.2 Hub DB
npx prisma migrate dev \
  --schema=prisma/hub/schema.prisma \
  --name init_hub_v2

# 4.3 Game DB
npx prisma migrate dev \
  --schema=prisma/game/schema.prisma \
  --name init_game_v2

# 4.4 Dating DB
npx prisma migrate dev \
  --schema=prisma/dating/schema.prisma \
  --name init_dating_v2

# 4.5 Trade DB
npx prisma migrate dev \
  --schema=prisma/trade/schema.prisma \
  --name init_trade_v2

# 4.6 Sports DB
npx prisma migrate dev \
  --schema=prisma/sports/schema.prisma \
  --name init_sports_v2
```

---

## 5. Chạy migration (production — deploy)

> ✅ `migrate deploy` áp dụng các pending migrations **không reset data**.

```bash
cd source/backend

npx prisma migrate deploy --schema=prisma/admin/schema.prisma
npx prisma migrate deploy --schema=prisma/hub/schema.prisma
npx prisma migrate deploy --schema=prisma/game/schema.prisma
npx prisma migrate deploy --schema=prisma/dating/schema.prisma
npx prisma migrate deploy --schema=prisma/trade/schema.prisma
npx prisma migrate deploy --schema=prisma/sports/schema.prisma
```

Hoặc dùng script npm:

```bash
npm run migrate:deploy
```

---

## 6. Chạy Seed data

```bash
cd source/backend

# 6.1 Admin seed (users, payment gateways, project configs)
node src/prisma/seeds/admin.seed.js

# 6.2 UI Config seed (brand, colors, social, features cho 5 sub-projects)
node src/prisma/seeds/ui-config.seed.js

# 6.3 Payment gateways seed
npm run seed:payment

# 6.4 Hub seed (categories, banners, pages)
node src/prisma/seeds/hub.seed.js

# 6.5 Game seed (lottery types, odds settings)
node src/prisma/seeds/game.seed.js

# 6.6 LKvip seed (bank accounts, payment settings)
node src/prisma/seeds/lkvip.seed.js

# 6.7 Dating seed (gift catalog, VIP plans)
node src/prisma/seeds/dating.seed.js

# 6.8 Sports seed (leagues, teams, markets)
node src/prisma/seeds/sports.seed.js
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
# Xem trạng thái migration của từng schema
npx prisma migrate status --schema=prisma/admin/schema.prisma
npx prisma migrate status --schema=prisma/hub/schema.prisma
npx prisma migrate status --schema=prisma/game/schema.prisma
npx prisma migrate status --schema=prisma/dating/schema.prisma
npx prisma migrate status --schema=prisma/trade/schema.prisma
npx prisma migrate status --schema=prisma/sports/schema.prisma
```

---

## 11. Prisma Studio (UI quản lý data)

```bash
# Admin DB
npx prisma studio --schema=prisma/admin/schema.prisma

# Mỗi schema có thể mở trên port khác nhau (tự động)
```

---

## 12. npm scripts reference

```json
// source/backend/package.json scripts:

"prisma:generate":    "prisma generate --schema=prisma/admin/schema.prisma && ...",
"migrate:dev:admin":  "prisma migrate dev --schema=prisma/admin/schema.prisma",
"migrate:dev:hub":    "prisma migrate dev --schema=prisma/hub/schema.prisma",
"migrate:dev:game":   "prisma migrate dev --schema=prisma/game/schema.prisma",
"migrate:dev:dating": "prisma migrate dev --schema=prisma/dating/schema.prisma",
"migrate:dev:trade":  "prisma migrate dev --schema=prisma/trade/schema.prisma",
"migrate:dev:sports": "prisma migrate dev --schema=prisma/sports/schema.prisma",
"migrate:deploy":     "prisma migrate deploy --schema=... (all 6)",
"seed:admin":         "node src/prisma/seeds/admin.seed.js",
"seed:ui-config":     "node src/prisma/seeds/ui-config.seed.js",
"seed:payment":       "node src/prisma/seeds/payment-gateways.seed.js",
"seed:all":           "npm run seed:admin && npm run seed:ui-config && npm run seed:payment && ..."
```

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
