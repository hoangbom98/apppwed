# CLAUDE.md — LKVIP Group Enterprise

## Vai trò của bạn
Bạn là **Senior Architect & Full-Stack Developer** cho hệ sinh thái LKVIP Group.
Project root: `/var/LKVIP` — monorepo Node.js 20 / Express 4 / TypeScript strict / Prisma 5 / MySQL 8 / React 19 / Vite / Tailwind CSS v4.
Mọi thay đổi phải tuân thủ chuẩn kỹ thuật trong phần **QUY TẮC BẮT BUỘC** ở cuối file này.

---

## NHIỆM VỤ ƯU TIÊN HIỆN TẠI

### Bước 0 — Clone & phân tích repo muilde (Android client)

```bash
cd /var/LKVIP
git clone https://github.com/hoangbom98/muilde.git apps/mobile-native-enterprise
```

Sau khi clone:
1. Đọc `apps/mobile-native-enterprise/ARCHITECTURE.md`
2. Đọc `apps/mobile-native-enterprise/DATABASE.md`
3. Đọc `apps/mobile-native-enterprise/API.md`
4. Liệt kê tất cả API endpoints mà Android app đang gọi
5. Báo cáo: những endpoint nào đã có trong backend LKVIP (`apps/backend/src/modules/`), những endpoint nào còn thiếu

---

### Bước 1 — Phân tích & chuẩn bị (Giai đoạn 1)

**Mục tiêu**: Hiểu rõ 10 dự án nguồn trước khi tích hợp.

Clone tất cả repo vào `/var/LKVIP/external/` (không phải `apps/` — tránh ảnh hưởng pnpm workspace):

```bash
mkdir -p /var/LKVIP/external
cd /var/LKVIP/external

# LMS Group
git clone https://github.com/nurmandev/nurman_lms.git
git clone https://github.com/nurmandev/PROFICIENT-LMS-Backend.git
git clone https://github.com/nurmandev/innovatics-project.git

# Investment Group
git clone https://github.com/nurmandev/investment.git
git clone https://github.com/nurmandev/Qc-investment-project.git

# E-commerce Group
git clone https://github.com/nurmandev/E-commerce-Admin2.git
git clone https://github.com/nurmandev/E-commerce-Api.git

# Utilities
git clone https://github.com/nurmandev/NurmanBackEnd.git
git clone https://github.com/nurmandev/Expenses-Tracker-using-React.js.git
```

Cho mỗi repo đã clone, thực hiện phân tích và ghi vào file `external/<repo-name>/LKVIP_ANALYSIS.md`:
- Stack công nghệ thực tế (đọc package.json, không đoán)
- Danh sách models/entities (đọc schema hoặc models/)
- Danh sách API routes
- Dependencies cần loại bỏ (MongoDB, EJS, Supabase...)
- Những gì có thể tái sử dụng trực tiếp (UI components, business logic)
- Mức độ effort để port sang LKVIP stack

---

### Bước 2 — Tích hợp LKVIP Academy (Giai đoạn 2)

**Nguồn**: `external/nurman_lms`, `external/PROFICIENT-LMS-Backend`, `external/innovatics-project`
**Tích hợp vào**: `hub_db` (Prisma) + `apps/backend/src/modules/hub/` + `apps/hub/`

#### 2.1 Thêm schema vào hub_db

Mở file `apps/backend/prisma/hub/schema.prisma` và thêm các model sau:

```prisma
model Course {
  id          String       @id @default(cuid())
  title       String       @db.VarChar(200)
  slug        String       @unique @db.VarChar(200)
  description String?      @db.Text
  thumbnail   String?      @db.VarChar(500)
  price       Decimal      @default(0) @db.Decimal(19, 4)
  currency    String       @default("VND") @db.VarChar(10)
  status      String       @default("draft") @db.VarChar(20)  // draft|published|archived
  level       String       @default("beginner") @db.VarChar(20)
  instructorId String      @db.VarChar(36)  // FK to admin_db User.id
  totalLessons Int         @default(0)
  totalDuration Int        @default(0)  // seconds
  createdAt   DateTime     @default(now()) @db.Timestamp(6)
  updatedAt   DateTime     @updatedAt
  lessons     Lesson[]
  enrollments Enrollment[]
  @@index([status])
  @@index([instructorId])
  @@index([createdAt])
  @@map("courses")
}

model Lesson {
  id        String   @id @default(cuid())
  courseId  String
  title     String   @db.VarChar(200)
  content   String?  @db.LongText
  videoUrl  String?  @db.VarChar(500)
  duration  Int      @default(0)  // seconds
  order     Int      @default(0)
  isFree    Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamp(6)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress  CourseProgress[]
  @@index([courseId])
  @@index([order])
  @@map("lessons")
}

model Enrollment {
  id          String   @id @default(cuid())
  userId      String   @db.VarChar(36)
  courseId    String
  referenceId String   @unique @db.VarChar(64)  // idempotency key
  paidAmount  Decimal  @db.Decimal(19, 4)
  status      String   @default("active") @db.VarChar(20)  // active|completed|refunded
  completedAt DateTime?
  createdAt   DateTime @default(now()) @db.Timestamp(6)
  course      Course   @relation(fields: [courseId], references: [id])
  progress    CourseProgress[]
  @@index([userId])
  @@index([courseId])
  @@index([status])
  @@map("enrollments")
}

model CourseProgress {
  id           String     @id @default(cuid())
  enrollmentId String
  lessonId     String
  userId       String     @db.VarChar(36)
  completed    Boolean    @default(false)
  watchedSecs  Int        @default(0)
  updatedAt    DateTime   @updatedAt
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id])
  lesson       Lesson     @relation(fields: [lessonId], references: [id])
  @@unique([enrollmentId, lessonId])
  @@index([userId])
  @@map("course_progress")
}
```

Sau khi thêm schema, chạy migration:
```bash
cd /var/LKVIP/apps/backend
npx tsx ../../scripts/prisma-run.ts migrate hub
# hoặc:
npx prisma migrate dev --name add_academy_tables --schema=prisma/hub/schema.prisma
```

#### 2.2 Tạo Academy Service

Tạo file `apps/backend/src/modules/hub/services/academyService.ts`:
- `getCourses(filters)` — danh sách khóa học published
- `getCourseDetail(slug)` — chi tiết + lessons (free lessons visible, paid lessons locked)
- `enrollCourse(userId, courseId, referenceId)` — gọi `walletService.debit()` nếu có phí
- `getMyEnrollments(userId)` — danh sách khóa học đã đăng ký
- `updateProgress(userId, enrollmentId, lessonId, watchedSecs)` — cập nhật tiến độ
- `getCertificate(enrollmentId)` — trả về certificate data khi completed = 100%

Dùng `getPrismaClient('hub')` — không bao giờ `new PrismaClient()`.
Gọi `walletService` từ `src/shared/services/` khi xử lý thanh toán.
Dùng `decimal.js` cho mọi phép tính tiền.

#### 2.3 Tạo Academy Controller & Routes

Tạo `apps/backend/src/modules/hub/controllers/academyController.ts`:
- `GET /api/hub/courses` — danh sách (public)
- `GET /api/hub/courses/:slug` — chi tiết (public)
- `POST /api/hub/courses/:id/enroll` — đăng ký (authenticate required)
- `GET /api/hub/my-courses` — khóa đã học (authenticate required)
- `PUT /api/hub/courses/:id/progress` — cập nhật tiến độ (authenticate required)
- `GET /api/hub/certificates/:enrollmentId` — lấy certificate (authenticate required)

Validate tất cả input bằng **Joi** (không Zod, không Yup ở backend).
Middleware order: `authenticate` → `rateLimiter`.

#### 2.4 Thêm trang Academy vào Hub SPA

Tạo `apps/hub/src/pages/AcademyPage.tsx`:
- Dùng TanStack Query để fetch data
- Dùng React Router DOM v7 để navigate
- Dùng Tailwind CSS v4 + Lucide React
- Không dùng Axios trực tiếp — dùng wrapper từ `@lkvip/ui`

Port UI components từ `external/nurman_lms/` sau khi đã phân tích ở Bước 1.
Chuyển đổi: `next/router` → React Router DOM v7, `getServerSideProps` → TanStack Query.

#### 2.5 Thêm quản lý Academy vào Admin Dashboard

Thêm module `apps/admin-dashboard/src/modules/hub/academy/` với:
- Trang quản lý danh sách khóa học (Ant Design v6 Table)
- Form tạo/sửa khóa học (Ant Design v6 Form)
- Trang thống kê đăng ký và doanh thu

---

### Bước 3 — Tích hợp LKVIP Invest+ (Giai đoạn 3)

**Nguồn**: `external/investment`, `external/Qc-investment-project`
**Tích hợp vào**: `trade_db` (đã có schema) + `apps/trading/`

**Lưu ý quan trọng**: `trade_db` đã có `Investment`, `YuebaoInvestment`, `MiningInvestment` và `InvestmentService`. Worker `interest-payout.worker.ts` đã hoạt động.

#### 3.1 Kiểm tra schema hiện có

```bash
grep -n "Investment\|invest" apps/backend/prisma/trade/schema.prisma
```

Nếu thiếu các field sau, thêm vào model `Investment`:
- `featured Boolean @default(false)` — hiển thị nổi bật
- `badge String? @db.VarChar(50)` — nhãn (HOT, NEW, BEST)
- `minAmount Decimal @db.Decimal(19,4)` — số tiền tối thiểu
- `maxAmount Decimal? @db.Decimal(19,4)` — số tiền tối đa

#### 3.2 Thêm trang đầu tư vào Trading SPA

Tạo `apps/trading/src/pages/InvestPage.tsx`:
- Danh sách gói đầu tư từ `GET /api/trade/investment/packages`
- Biểu đồ lợi nhuận dùng recharts (đã có trong workspace catalog)
- Form đăng ký gói đầu tư
- Lịch sử đầu tư cá nhân

Tạo `apps/trading/src/pages/PortfolioPage.tsx`:
- Tổng quan danh mục: tổng đầu tư, lãi tích lũy, lãi dự kiến
- Danh sách vị thế đang hoạt động với tiến trình

Port UI components từ `external/investment/` (React + Tailwind):
- Thay Axios bằng TanStack Query
- Thay React Router của CRA bằng React Router DOM v7
- Đảm bảo dùng Tailwind v4 (không v3)

---

### Bước 4 — Tích hợp LKVIP Market (Giai đoạn 4)

**Nguồn**: `external/E-commerce-Api`, `external/E-commerce-Admin2`
**Tích hợp vào**: `hub_db` + `apps/backend/src/modules/hub/` + Admin Dashboard

#### 4.1 Thêm schema Market vào hub_db

Thêm vào `apps/backend/prisma/hub/schema.prisma`:

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(200)
  description String?  @db.Text
  price       Decimal  @db.Decimal(19, 4)
  currency    String   @default("VND") @db.VarChar(10)
  category    String   @db.VarChar(50)  // course|license|service|digital
  thumbnail   String?  @db.VarChar(500)
  stock       Int?     // null = unlimited
  status      String   @default("active") @db.VarChar(20)
  createdAt   DateTime @default(now()) @db.Timestamp(6)
  updatedAt   DateTime @updatedAt
  orders      MarketOrder[]
  @@index([status])
  @@index([category])
  @@map("products")
}

model MarketOrder {
  id          String   @id @default(cuid())
  userId      String   @db.VarChar(36)
  productId   String
  referenceId String   @unique @db.VarChar(64)  // idempotency
  quantity    Int      @default(1)
  unitPrice   Decimal  @db.Decimal(19, 4)
  totalAmount Decimal  @db.Decimal(19, 4)
  status      String   @default("pending") @db.VarChar(20)  // pending|paid|delivered|cancelled
  paymentGateway String? @db.VarChar(30)
  paidAt      DateTime?
  createdAt   DateTime @default(now()) @db.Timestamp(6)
  product     Product  @relation(fields: [productId], references: [id])
  @@index([userId])
  @@index([productId])
  @@index([status])
  @@index([createdAt])
  @@map("market_orders")
}
```

#### 4.2 Tạo Market Service

Tạo `apps/backend/src/modules/hub/services/marketService.ts`:
- `getProducts(category?, page?)` — danh sách sản phẩm
- `getProductBySlug(slug)` — chi tiết sản phẩm
- `createOrder(userId, productId, quantity, gateway)` — tạo đơn hàng, gọi `PaymentFactory`
- `handleOrderPayment(orderId, confirmedAmount)` — xử lý sau khi payment callback
- `getMyOrders(userId)` — lịch sử mua hàng

Dùng `PaymentFactory` từ `src/shared/payment/PaymentFactory.ts` — đã có 6 adapters.

#### 4.3 Admin Market Module

Thêm `apps/admin-dashboard/src/modules/hub/market/` với:
- CRUD sản phẩm (Ant Design v6 Table + Form + Upload)
- Quản lý đơn hàng (xem, xác nhận giao hàng)
- Báo cáo doanh thu Market

---

### Bước 5 — Tích hợp muilde Android client (Giai đoạn 5)

**Nguồn**: `apps/mobile-native-enterprise/` (đã clone ở Bước 0)
**Mục tiêu**: Đảm bảo backend LKVIP có đủ endpoints cho Android client

Sau khi phân tích API.md của muilde:
1. Liệt kê tất cả endpoints Android đang gọi
2. Kiểm tra từng endpoint trong `apps/backend/src/modules/`
3. Với mỗi endpoint còn thiếu: tạo controller + service + validator + route tương ứng
4. Đặc biệt chú ý các module: Academy LMS, Invest XWiN, Market E-Com, PayLock Escrow

---

### Bước 6 — Expenses Tracker Widget (Giai đoạn cuối)

**Nguồn**: `external/Expenses-Tracker-using-React.js`
**Tích hợp vào**: `apps/hub/src/pages/finance/`

Tạo widget `ExpenseWidget.tsx` trong Hub SPA:
- Migrate từ CRA sang Vite (xóa react-scripts, thêm vite config)
- Thay state management CRA bằng Zustand
- Dùng Tailwind v4 thay inline styles
- Kết nối với wallet API của backend: `GET /api/hub/wallet/transactions`

---

## QUY TẮC BẮT BUỘC (KHÔNG được vi phạm)

### Database & Prisma
- Mọi field tiền tệ: `DECIMAL(19,4)` — không dùng `Float`, `Int`, `Number`
- Mọi bảng transaction phải có `referenceId @unique` cho idempotency
- Mọi bảng wallet/balance phải có `version Int @default(0)` cho optimistic locking
- Timestamps: `DateTime @default(now()) @db.Timestamp(6)`
- Prisma client: `getPrismaClient('hub')` — **tuyệt đối không** `new PrismaClient()`
- Migration: `npx tsx scripts/prisma-run.ts migrate <module>`

### Backend
- Validation: **Joi** — không Zod, không Yup trong backend
- Tiền tệ: `decimal.js` từ `@lkvip/utils` — không `Number`, không `BigInt`
- Background jobs: BullMQ queue — không `setTimeout` cho async work
- Enums: import từ `@lkvip/constants` — không raw string literals
- Không có business logic trong controller — chỉ validate → delegate → respond
- API response envelope: `{ success: true, data: T }` hoặc `{ success: false, error: { code, message } }`

### Frontend
- Styling: **Tailwind CSS v4** — không Bootstrap, không Material UI, không Vant UI
- Icons: **Lucide React** — không @iconify/react, không heroicons
- State: Zustand (client) + TanStack Query (server)
- Forms: React Hook Form + **Yup** — không Zod
- Routing: React Router DOM v7
- Linting: **OXLint** (`oxlint src`) — không thêm ESLint vào SPA
- Shared components: import từ `@lkvip/ui`
- Shared types: import từ `@lkvip/types`

### Kiểm tra sau mỗi thay đổi
```bash
# TypeScript check
cd /var/LKVIP/apps/backend && npx tsc --noEmit 2>&1 | head -20

# Nếu có lỗi → fix trước khi tiếp tục. Không được để codebase broken.
```

---

## THÔNG TIN CODEBASE

### Backend modules hiện có
- `src/modules/hub/` — Hub portal, CMS, banners → **mở rộng thêm Academy + Market**
- `src/modules/trade/` — Trading, Investment → **mở rộng thêm Invest+ UI**
- `src/modules/admin/` — Admin portal
- `src/modules/game/` — Game & Lottery
- `src/shared/services/` — 44 shared services (auth, wallet, payment, notification...)
- `src/modules/workers/` — 13 BullMQ workers (bao gồm `interest-payout.worker.ts`)

### Database schemas
- `hub_db` → `prisma/hub/schema.prisma` — **thêm Academy + Market tables vào đây**
- `trade_db` → `prisma/trade/schema.prisma` — Investment đã có sẵn
- `admin_db` → `prisma/admin/schema.prisma` — Users, Wallets, Transactions

### Payment adapters có sẵn (6)
`MoMo`, `USDT`, `OKPay`, `Pay818`, `GoPay`, `LKvipInternal`
Factory: `src/shared/payment/PaymentFactory.ts`

### Thư mục external repos (chỉ đọc, không commit)
`/var/LKVIP/external/` — chứa 9 repo nurmandev để tham khảo
`/var/LKVIP/apps/mobile-native-enterprise/` — Android client muilde

---

## LỆNH HAY DÙNG

```bash
# Chạy dev
cd /var/LKVIP && pnpm run dev:backend

# Build tất cả
pnpm run build:all

# Migrate database
cd apps/backend && npx tsx ../../scripts/prisma-run.ts migrate hub

# TypeScript check
cd apps/backend && npx tsc --noEmit

# Lint frontend
cd apps/hub && npx oxlint src

# Cleanup script
node scripts/cleanup.mjs          # dry-run
node scripts/cleanup.mjs --run    # thực thi
```
