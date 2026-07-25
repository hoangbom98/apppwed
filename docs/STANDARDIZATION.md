# LKVIP Standardization

Trạng thái: chuẩn hóa theo pnpm monorepo hiện tại.

## 1. Nguyên tắc cốt lõi

1. Runnable apps nằm trong `apps/`.
2. Shared libraries nằm trong `packages/`.
3. Infrastructure config nằm trong `config/`.
4. Runtime data/logs nằm trong `data/` và `logs/`.
5. Lệnh dev/build/check chạy từ root `/var/LKVIP` bằng pnpm workspace.
6. Không dùng Docker làm workflow chuẩn của dự án.
7. Không thêm dependency mới nếu dependency hiện có giải quyết được.
8. Khi đổi app/package/script/API/deploy, cập nhật docs canonical cùng PR.

## 2. Cấu trúc chuẩn

```text
/var/LKVIP/
├── apps/
│   ├── backend/              # lkvip-backend
│   ├── hub/                  # @lkvip/hub
│   ├── game/                 # @lkvip/game
│   ├── trading/              # @lkvip/trade
│   ├── dating/               # @lkvip/dating
│   ├── sports/               # @lkvip/sports
│   ├── admin-dashboard/      # @lkvip/admin
│   └── mobile/               # @lkvip/mobile
├── packages/
│   ├── ui/                   # @lkvip/ui
│   ├── types/                # @lkvip/types
│   ├── utils/                # @lkvip/utils
│   └── constants/            # @lkvip/constants
├── config/
├── docs/
├── scripts/
├── data/
└── logs/
```

## 3. Workspace rules

- Workspace source of truth: `pnpm-workspace.yaml`.
- Root scripts source of truth: `package.json`.
- App folder `apps/trading` maps to package `@lkvip/trade`.
- Backend package name is `lkvip-backend`.
- Lockfile `pnpm-lock.yaml` stays at repo root.

## 4. Shared code placement

| Loại | Vị trí chuẩn |
|------|--------------|
| UI component/hook React dùng chung | `packages/ui` |
| Pure helper/formatter/validator helper | `packages/utils` |
| Type/interface shared FE/BE | `packages/types` |
| Project IDs/enums/config keys/constants | `packages/constants` |

Chỉ đưa code vào shared khi có reuse thật. Ba đoạn giống nhau chưa đủ nếu behavior khác nhau.

## 5. Công nghệ chuẩn

- React + Vite + TypeScript cho frontend.
- Tailwind CSS + Ant Design.
- Lucide React ưu tiên cho icon mới; `@ant-design/icons` vẫn tồn tại trong app/admin.
- Yup cho frontend validation, Joi cho backend validation.
- Express + Prisma + MySQL + Redis + BullMQ + Socket.IO cho backend.

Không dùng Vant UI, Iconify, Zod cho phần mới.

## 6. Docs canonical

| Chủ đề | File chuẩn |
|--------|------------|
| Người mới | `docs/ONBOARDING.md` |
| Setup local | `docs/SETUP.md` |
| Kiến trúc | `docs/ARCHITECTURE.md` |
| API | `docs/API_ENDPOINTS.md` |
| Deploy | `docs/DEPLOYMENT.md` |
| Scan/tối ưu | `docs/CODEBASE_SCAN.md` |
| Ứng phó sự cố | `docs/INCIDENT_RESPONSE.md` |
| Đóng góp | `CONTRIBUTING.md` |

Tránh duy trì nhiều docs có cùng nội dung. Nếu cần giữ file cũ vì link ngoài, biến thành stub trỏ về file canonical.
