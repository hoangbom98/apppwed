# Contributing to KJC Platform

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

### Cách 1 — Docker (khuyến nghị)

```bash
cp .env.example source/backend/.env   # điền JWT_SECRET, giữ nguyên DB URLs

cd source
docker-compose up -d

# Chạy migrations và seed lần đầu
docker-compose exec api npm run prisma:migrate:all
docker-compose exec api npm run seed:all

# Backend: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Cách 2 — Cài thủ công

Xem hướng dẫn chi tiết tại [`source/docs/SETUP.md`](source/docs/SETUP.md).

---

## Quy tắc branch

| Tiền tố | Dùng cho | Ví dụ |
|---------|---------|-------|
| `feature/` | Tính năng mới | `feature/ops-dashboard` |
| `fix/` | Sửa lỗi | `fix/auth-token-expiry` |
| `chore/` | Cấu hình, dependencies, CI | `chore/update-prisma-5.16` |
| `docs/` | Chỉ thay đổi tài liệu | `docs/api-endpoints` |
| `refactor/` | Cải thiện code, không thay đổi behaviour | `refactor/wallet-service` |

**Không push trực tiếp vào `main`.** Tất cả thay đổi phải qua Pull Request.

```bash
git checkout develop           # bắt đầu từ develop
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

[body tùy chọn]
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

**Ví dụ tốt:**

```
feat(admin): thêm trang Operations Dashboard
fix(auth): xử lý refresh token hết hạn trả về 401
chore(ci): thêm coverage threshold vào jest config
test(utils): viết tests cho response helpers
```

---

## Quy trình Pull Request

1. **Tạo PR vào branch `develop`**, không vào `main` (main chỉ nhận merge từ develop sau release).
2. **Điền đầy đủ mô tả PR**: tóm tắt thay đổi, lý do, cách test.
3. **CI phải pass**: lint (`npm run lint`) và tests (`npm test`) phải xanh.
4. **Ít nhất 1 reviewer** phải approve.
5. Sau khi merge vào `develop`, push `main` sẽ trigger auto-deploy lên VPS.

---

## Code style

### Backend (Node.js / Express)

- Tất cả file backend bắt đầu bằng `'use strict';`
- Dùng `const` và `let`, **không dùng `var`**
- Export theo CommonJS: `module.exports = ...`
- Response luôn dùng helpers từ `src/shared/utils/response.js`:
  ```javascript
  const { success, error, notFound } = require('../../../shared/utils/response');
  return success(res, data);
  return error(res, 'Lỗi gì đó', 400);
  ```
- Không hardcode credentials hay URL — dùng `process.env.*`

### Lint

```bash
cd source/backend
npm run lint          # kiểm tra
npm run lint -- --fix # tự sửa các lỗi đơn giản
```

Lint **phải pass** trước khi tạo PR. CI sẽ fail nếu có warning.

---

## Tests

Tests nằm tại `source/backend/src/__tests__/`, cấu trúc phản ánh `src/`:

```
src/__tests__/
├── utils/
│   └── response.test.js
├── base/
│   └── BaseService.test.js
└── admin/
    └── authController.test.js
```

```bash
cd source/backend
npm test                # chạy tất cả
npm run test:coverage   # với coverage report
npm run test:watch      # watch mode khi dev
```

**Quy tắc:**

- Thêm test khi bổ sung logic mới vào `shared/utils/` hoặc `shared/services/`
- Mock Prisma bằng `jest.fn()` — không cần DB thực để chạy unit tests
- Đặt `jest.mock(...)` **trước** `require(...)` controller (Jest tự hoist)

---

## Database schema

Khi thay đổi Prisma schema (`prisma/*/schema.prisma`):

```bash
# 1. Sửa file schema
# 2. Tạo migration file
npm run prisma:migrate:<project>   # vd: prisma:migrate:admin

# 3. Commit cả schema + migration file cùng nhau
git add prisma/admin/schema.prisma prisma/admin/migrations/
git commit -m "chore(db): thêm model UserSegment vào admin schema"
```

**Không dùng `prisma db push` trên staging/production** — chỉ dùng `prisma migrate deploy`.

---

## Review checklist

Trước khi tạo PR, kiểm tra:

- [ ] `npm run lint` pass, không có warning
- [ ] `npm test` pass
- [ ] Không commit file `.env` hay bất kỳ secret nào
- [ ] Không hardcode IP, password, hay API key trong code
- [ ] Prisma migration đi kèm nếu schema thay đổi
- [ ] Không xóa `'use strict'` khỏi đầu file backend
- [ ] Response dùng helpers, không `res.json()` trực tiếp
- [ ] `console.log` debug đã được xóa (dùng `logger.debug()` thay thế)
