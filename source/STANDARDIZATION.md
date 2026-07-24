# 📋 STANDARDIZATION.md — LKVIP GROUP

> Trạng thái: **Đã chuẩn hóa** · Cập nhật lần cuối: 2026-07-24
> Cấu trúc: Monorepo dựa trên `pnpm workspace` (thư mục gốc chứa `code/`, `config/`, `data/`).

---

## 1. Nguyên tắc cốt lõi
1. **Separation of Concerns**: Code (`code/`), Configuration (`config/`), và Runtime Data (`data/`) phải được tách biệt hoàn toàn.
2. **Zero Hardcoded Paths**: Tuyệt đối không hardcode đường dẫn tuyệt đối. Sử dụng biến môi trường.
3. **Automated Scripts**: Mọi thao tác vận hành phải thông qua Node.js CLI (trong `code/scripts/`) thay vì Shell script.

## 2. Cấu trúc thư mục chuẩn
```text
/website-admin/
├── code/               # Source code (Backend, Frontend, Shared)
├── config/             # Hạ tầng (Nginx, Database, Monitoring)
├── data/               # Runtime Data (Logs, Uploads)
├── .gitignore          # Chặn /data/, /node_modules/, .env
```

## 3. Quy chuẩn phát triển
- **Backend**: TypeScript + Prisma (Schema duy nhất).
- **Frontend**: React + TailwindCSS (cấu trúc SPA).
- **Communication**: Tất cả API gọi qua `api.group.com`.
- **Security**: Idempotency headers, AES-256-GCM encryption cho data nhạy cảm.
