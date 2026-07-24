# Contributing to LKVIP Platform

Cảm ơn bạn đã quan tâm đến dự án! Tài liệu này mô tả quy trình đóng góp code để đảm bảo chất lượng và nhất quán.

---

## Mục lục

- [Môi trường phát triển](#môi-trường-phát-triển)
- [Quy tắc branch](#quy-tắc-branch)
- [Quy tắc commit](#quy-tắc-commit)
- [Quy trình Pull Request](#quy-trình-pull-request)
- [Code style](#code-style)
- [Tests](#tests)
- [Database schema](#database-schema)
- [Review checklist](#review-checklist)

---

## Môi trường phát triển

```bash
# 1. Clone & cd
git clone <repo-url> /var/LKVIP
cd /var/LKVIP

# 2. Copy env
cp .env.example code/backend/.env
# Điền JWT_SECRET, DATABASE_URLs...

# 3. Install (pnpm workspace)
cd code
pnpm install

# 4. Tạo Prisma clients + migrate + seed
pnpm --filter lkvip-backend run prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all

# 5. Chạy backend
pnpm dev:backend
# → API: http://localhost:5000
# → Swagger: http://localhost:5000/api/docs
```

---

## Quy tắc branch

| Tiền tố | Dùng cho | Ví dụ |
|---------|---------|-------|
| `feature/` | Tính năng mới | `feature/ops-dashboard` |
| `fix/` | Sửa lỗi | `fix/auth-token-expiry` |
| `chore/` | Cấu hình, dependencies, CI | `chore/update-prisma-5.16` |
| `docs/` | Chỉ thay đổi tài liệu | `docs/api-endpoints` |
| `refactor/` | Cải thiện code | `refactor/wallet-service` |

**Không push trực tiếp vào `main`.** Tất cả thay đổi phải qua Pull Request.

```bash
git checkout develop
git checkout -b feature/my-feature
# ... code ...
git push origin feature/my-feature
# Mở PR vào develop trên GitHub
```

---

## Quy tắc commit

Dự án dùng **Conventional Commits**:

```
<type>(<scope>): <mô tả ngắn>
```

| Type | Dùng cho |
|------|---------|
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `chore` | Maintenance, CI, build |
| `docs` | Tài liệu |
| `refactor` | Refactor code |
| `test` | Thêm hoặc sửa tests |
| `perf` | Cải thiện hiệu năng |

**Ví dụ:**

```
feat(admin): thêm trang Operations Dashboard
fix(auth): xử lý refresh token hết hạn trả về 401
chore(ci): thêm coverage threshold vào jest config
```

---

## Quy trình Pull Request

1. **Tạo PR vào branch `develop`**, không vào `main`.
2. **Điền đầy đủ mô tả PR**: tóm tắt thay đổi, lý do, cách test.
3. **CI phải pass**: lint và tests phải xanh.
4. **Ít nhất 1 reviewer** phải approve.

---

## Code style

### Backend (TypeScript / Express)

- Export dùng ES modules hoặc CommonJS theo từng file pattern
- Response luôn dùng helpers từ `src/shared/utils/response.ts`
- Không hardcode credentials — dùng `process.env.*`

### Lint & Format

```bash
cd code

# Kiểm tra toàn bộ
pnpm lint:all
pnpm typecheck:all

# Backend riêng
pnpm --filter lkvip-backend run lint
pnpm --filter lkvip-backend run type-check
```

---

## Tests

Tests backend nằm tại `code/backend/src/__tests__/`.

```bash
cd code

# Chạy tất cả tests
pnpm test

# Watch mode
pnpm --filter lkvip-backend run test:watch

# Coverage
pnpm --filter lkvip-backend run test:coverage
```

**Quy tắc:**
- Mock Prisma bằng `jest.fn()` — không cần DB thực để chạy unit tests
- Thêm test khi bổ sung logic mới vào `shared/utils/` hoặc `shared/services/`

---

## Database schema

Khi thay đổi Prisma schema (`backend/prisma/*/schema.prisma`):

```bash
cd code/backend

# 1. Sửa file schema
# 2. Tạo migration file
npx prisma migrate dev --schema prisma/admin/schema.prisma --name add_user_field

# 3. Commit cả schema + migration file cùng nhau
git add prisma/admin/schema.prisma prisma/admin/migrations/
git commit -m "chore(db): thêm model UserSegment vào admin schema"
```

**Không dùng `prisma db push` trên staging/production** — chỉ dùng `prisma migrate deploy`.

---

## Review checklist

Trước khi tạo PR, kiểm tra:

- [ ] `pnpm lint:all` pass, không có warning
- [ ] `pnpm test` pass
- [ ] Không commit file `.env` hay bất kỳ secret nào
- [ ] Không hardcode IP, password, hay API key trong code
- [ ] Prisma migration đi kèm nếu schema thay đổi
- [ ] `.env.example` được cập nhật nếu thêm biến môi trường mới
- [ ] Response dùng helpers, không `res.json()` trực tiếp
- [ ] `console.log` debug đã được xóa (dùng `logger.debug()` thay thế)
