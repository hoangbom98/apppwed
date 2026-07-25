# 📋 STANDARDIZATION.md — LKVIP GROUP

> Trạng thái: **Đã chuẩn hóa** · Cập nhật lần cuối: 2026-07-24
> Cấu trúc: Monorepo dựa trên `pnpm workspace` — apps tại `apps/`, shared libraries tại `packages/`.

---

## 1. Nguyên tắc cốt lõi

1. **Separation of Concerns**: Runnable apps (`apps/`), shared libraries (`packages/`), infrastructure configs (`config/`), và runtime data (`data/`) phải được tách biệt hoàn toàn.
2. **Zero Hardcoded Paths**: Tuyệt đối không hardcode đường dẫn tuyệt đối. Sử dụng biến môi trường.
3. **Automated Scripts**: Mọi thao tác vận hành phải thông qua Node.js CLI (trong `scripts/`) thay vì Shell script tuỳ tiện.

## 2. Cấu trúc thư mục chuẩn

```text
/var/LKVIP/
├── apps/               # Tất cả runnable applications (pnpm workspace)
│   ├── backend/        # Express API — lkvip-backend
│   ├── hub/            # Hub Portal — @lkvip/hub
│   ├── game/           # Game Center — @lkvip/game
│   ├── dating/         # Dating App — @lkvip/dating
│   ├── trading/        # Trade Platform — @lkvip/trade
│   ├── sports/         # Sports Betting — @lkvip/sports
│   └── admin-dashboard/# Admin Portal — @lkvip/admin
├── packages/           # Shared libraries (pnpm workspace)
│   ├── constants/      # @lkvip/constants — enums, error codes, project IDs
│   ├── shared-types/   # @lkvip/types — TypeScript interfaces
│   ├── shared-ui/      # @lkvip/ui — React components, hooks, PWA utils
│   ├── shared-utils/   # @lkvip/utils — helper functions
│   └── mobile/         # @lkvip/mobile — Capacitor iOS/Android
├── config/             # Infrastructure (Nginx, Database init, Monitoring)
├── data/               # Runtime data (uploads, cache) — gitignored
├── logs/               # PM2 log output — gitignored
├── scripts/            # Root CLI scripts
├── docs/               # Documentation
└── .gitignore          # Chặn /data/, /logs/, /node_modules/, .env
```

## 3. Quy tắc workspace

- `pnpm-workspace.yaml` khai báo: `packages/*` và `apps/*` (trừ `_template`)
- Tất cả lệnh pnpm chạy **từ root** `/var/LKVIP` — không `cd` vào subdirectory trừ khi cần thiết
- Lock file (`pnpm-lock.yaml`) nằm **tại root** — commit vào git

## 4. Quy chuẩn phát triển

- **Backend**: TypeScript + Express + Prisma. Mỗi module có schema Prisma riêng tại `apps/backend/prisma/<module>/schema.prisma`.
- **Frontend**: React 19 + Vite + TailwindCSS. Cấu trúc SPA với `views/`, `components/`, `api/`, `store/`, `hooks/`.
- **Communication**: Tất cả API gọi qua `api.domain.com` (hoặc `localhost:5000` trong dev).
- **Security**: AES-256-CBC encryption cho data nhạy cảm (PII), JWT cho authentication.
- **Shared code**: Đặt trong `packages/` — không duplicate logic giữa các apps.
