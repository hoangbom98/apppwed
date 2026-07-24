# DEPLOY.md

## Quy trình Deploy (Non-Dockerized)

1. **Chuẩn bị server:**
   - Cài đặt Node.js (>= 20), pnpm, Nginx, Redis.
   - Tạo cấu trúc thư mục tại `/var/LKVIP/`.

2. **Clone code:**
   ```bash
   git clone <repo-url> /var/LKVIP/code
   ```

3. **Cấu hình:**
   - Copy `.env.example` thành `.env` tại root `/var/LKVIP/.env`.
   - Cấu hình các biến `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_SECRET`.

4. **Triển khai:**
   - Chạy script deploy: `sh /var/LKVIP/code/scripts/deploy.sh`

## Lưu ý
- Dữ liệu runtime (`/var/LKVIP/data/`) cần được backup định kỳ.
- Nginx cấu hình tại `/var/LKVIP/config/nginx/`.
