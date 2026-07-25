# Contributing to LKVIP Platform

Quy trình đóng góp cho monorepo LKVIP. Đọc `docs/ONBOARDING.md` và `docs/SETUP.md` trước khi bắt đầu.

## Môi trường phát triển

```bash
git clone <repo-url> /var/LKVIP
cd /var/LKVIP
pnpm install

cp config/env/.env.example apps/backend/.env
# Điền env local; không commit hoặc paste secret thật.

pnpm prisma:generate
pnpm --filter lkvip-backend run prisma:migrate:all
pnpm --filter lkvip-backend run seed:all

pnpm dev:backend
pnpm dev:admin
```

## Branch và PR

| Tiền tố | Dùng cho | Ví dụ |
|---------|----------|-------|
| `feature/` | Tính năng mới | `feature/theme-live-preview` |
| `fix/` | Sửa lỗi | `fix/auth-token-expiry` |
| `docs/` | Tài liệu | `docs/onboarding-standardization` |
| `chore/` | CI/build/dependency | `chore/update-prisma` |
| `refactor/` | Refactor không đổi behavior | `refactor/shared-formatters` |
| `perf/` | Hiệu năng | `perf/reduce-bundle-size` |

`main` là branch deploy production. Không push trực tiếp vào `main`; mở PR và chờ CI/review.

## Commit

Dùng Conventional Commits:

```text
<type>(<scope>): <mô tả ngắn>
```

Ví dụ:

```text
feat(admin): thêm live preview cấu hình giao diện
fix(dating): thay icon không tồn tại
docs: chuẩn hóa onboarding LKVIP
```

## Code style

### Frontend

- React + TypeScript.
- Tailwind CSS ưu tiên cho layout/style app H5.
- Ant Design dùng nhiều ở admin/trading.
- Icon mới ưu tiên `lucide-react`; `@ant-design/icons` vẫn được dùng ở app/admin hiện hữu.
- Validation frontend dùng Yup. Không thêm Zod cho phần mới.

### Backend

- Backend nằm tại `apps/backend`.
- Package/filter: `lkvip-backend`.
- Prisma schema: `apps/backend/prisma/<project>/schema.prisma`.
- Response/helper/middleware nên theo pattern hiện có trong `apps/backend/src/shared`.
- Không hardcode credential, token, API key.

### Shared packages

- UI/hooks dùng chung: `packages/ui`.
- Types dùng chung: `packages/types`.
- Helpers pure: `packages/utils`.
- Constants/enums/project IDs: `packages/constants`.

Không tạo package shared mới nếu bốn package hiện có đủ dùng.

## Checks trước PR

```bash
pnpm lint:all
pnpm typecheck:all
pnpm test
pnpm build:frontends
pnpm --filter lkvip-backend run build
```

Nếu chỉ sửa docs, không cần chạy full build; vẫn cần kiểm tra link/nội dung tài liệu đã đổi.

## Database schema

Khi đổi Prisma schema:

1. Sửa đúng schema trong `apps/backend/prisma/<project>/schema.prisma`.
2. Tạo migration bằng Prisma cho schema tương ứng.
3. Commit cả schema và migration.
4. Không dùng `prisma db push` cho staging/production.
5. Cập nhật docs nếu đổi env/API/luồng dữ liệu.

## Dependencies

- Không thêm dependency mới nếu dependency hiện có giải quyết được.
- Nếu thêm dependency, nêu rõ lý do trong PR.
- Ưu tiên dùng catalog trong `pnpm-workspace.yaml` cho version shared.
- Không xóa dependency chỉ dựa trên depcheck; xác minh import/build/runtime trước.

## Docs checklist

Cập nhật tài liệu cùng PR nếu thay đổi:

- App path/package/script: `README.md`, `docs/ONBOARDING.md`, `docs/SETUP.md`.
- Kiến trúc/backend/runtime config: `docs/ARCHITECTURE.md`.
- API route/response: `docs/API_ENDPOINTS.md`.
- Deploy/health/domain/PM2/Nginx: `docs/DEPLOYMENT.md`.
- Scan/tối ưu/shared packages: `docs/CODEBASE_SCAN.md`.

## Security checklist

- [ ] Không commit `.env`, private key, credential, token.
- [ ] Không paste secret thật vào docs/log/issue/chat.
- [ ] Không log PII hoặc secrets.
- [ ] Public endpoint không trả config secret.
- [ ] Production health/deploy không mở port nội bộ trực tiếp.

## Optimization checklist

Khi refactor giảm trùng lặp:

- [ ] Chạy scan theo `docs/CODEBASE_SCAN.md` nếu phạm vi lớn.
- [ ] Không đổi behavior UI/API ngoài phạm vi.
- [ ] Shared extraction chỉ làm khi có reuse thật.
- [ ] Build/typecheck app bị ảnh hưởng.

## Backup cron setup (DevOps)

Sau khi deploy lần đầu hoặc setup VPS mới, cài đặt cron backup tự động:

```bash
# Đăng nhập với user lkvip
sudo -u lkvip crontab -e

# Thêm dòng sau — chạy backup lúc 2:00 AM mỗi ngày
0 2 * * * bash /var/LKVIP/scripts/backup.sh >> /var/LKVIP/logs/backup.log 2>&1

# Chạy restore test hàng tuần (Chủ nhật 3:00 AM) để verify backup khả dụng
0 3 * * 0 bash /var/LKVIP/scripts/backup.sh --restore-test >> /var/LKVIP/logs/backup.log 2>&1
```

Đặt `TELEGRAM_BOT_TOKEN` và `TELEGRAM_ALERT_CHAT_ID` trong `apps/backend/.env` để nhận thông báo backup qua Telegram.

## Incident Response

Khi xảy ra sự cố production, làm theo `docs/INCIDENT_RESPONSE.md`.
Ghi lại mọi sự cố vào `docs/incidents/YYYY-MM-DD-<slug>.md` sau khi xử lý xong.
