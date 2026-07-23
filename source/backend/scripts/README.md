# backend/scripts

Thư mục chứa các helper scripts nội bộ của backend (TypeScript, chạy bằng `tsx`).

## prisma-run.ts

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
