# source/uploads — LKVIP GROUP Upload Storage

Thư mục chứa tất cả files được upload từ người dùng. **Không commit files thật** — chỉ commit `.gitkeep` để Git track cấu trúc thư mục.

---

## Cấu trúc thư mục

```
uploads/
├── avatars/    — Ảnh đại diện người dùng (jpeg/png/webp)
├── banners/    — Banner quảng cáo, ảnh nền (jpeg/png/webp/gif)
├── kyc/        — Tài liệu xác minh danh tính (jpeg/png/pdf) — RESTRICTED
├── media/      — Video/audio dating module (mp4/webm)
└── tmp/        — Files tạm trong quá trình xử lý (tự xóa sau 24h)
```

---

## Quy ước đặt tên file

Format: `{project}_{userId}_{timestamp}_{random}.{ext}`

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `project` | Module/project ID | `hub`, `game`, `dating` |
| `userId` | ID người dùng (số) | `1042` |
| `timestamp` | Unix timestamp (giây) | `1720000000` |
| `random` | 8 ký tự random alphanumeric | `K3MX5PQY` |
| `ext` | Extension lowercase | `jpg`, `png`, `webp` |

**Ví dụ:**
```
avatars/dating_1042_1720000000_K3MX5PQY.webp
banners/hub_0_1720001234_AB3DEFGH.png
kyc/hub_1042_1720002345_XY9KLMNO.jpg
media/dating_1042_1720003456_PQ7RSTUV.mp4
```

---

## Map Module → Thư mục

| Module | Thư mục upload | Loại file |
|--------|----------------|-----------|
| All projects | `avatars/` | jpeg, png, webp (max 5MB) |
| hub | `banners/` | jpeg, png, webp, gif (max 10MB) |
| admin | `banners/` | jpeg, png, webp, gif (max 10MB) |
| hub | `kyc/` | jpeg, png, pdf (max 10MB) |
| dating | `media/` | mp4, webm (max 100MB) |
| All projects | `tmp/` | Any (auto-deleted after 24h) |

---

## Cấu hình môi trường

```bash
# source/backend/.env
UPLOAD_DIR=uploads                              # Relative path từ backend/ dir
MAX_FILE_SIZE_MB=10                             # Giới hạn file (MB)
CDN_BASE_URL=https://api.yourdomain.com/uploads # Public URL prefix
```

**Lưu ý production:** Thư mục `uploads/` trên VPS nằm tại:
```
/var/www/lkvip/source/backend/uploads/
```
Backend mount static: `GET /uploads/:path` → serve từ thư mục này.

---

## Bảo mật

- **`kyc/`** — Files nhạy cảm. Nginx **không** serve trực tiếp. Chỉ backend mới có thể đọc
  và trả về qua authenticated endpoint `/api/hub/kyc/document/:id`.
- **`tmp/`** — Cron job `clean-temp-files` xóa files cũ hơn 24h (chạy lúc 03:30 hàng ngày).
- **Image resize** — Tất cả ảnh upload qua Sharp để resize về max 1920px và convert sang WebP.
- **MIME validation** — uploadService.js kiểm tra MIME type thực tế (không chỉ extension).

---

## Thêm thư mục mới

Khi cần thêm loại upload mới:
1. Tạo thư mục con: `mkdir source/uploads/newtype`
2. Thêm `.gitkeep`: `touch source/uploads/newtype/.gitkeep`
3. Cập nhật `.gitignore` tại thư mục này
4. Cập nhật `uploadService.js` — thêm `newtype` vào `ALLOWED_DIRS`
5. Cập nhật file README này
