# Hướng dẫn Deploy — academy.tc-gaming.live

> **Áp dụng cho:** VPS Ubuntu 22.04 · Deploy path `/var/LKVIP` · Domain `tc-gaming.live`
> **App:** `@lkvip/academy` — Next.js 15 standalone, PM2 process `lkvip-academy`, port `:3013`

---

## 4.1 — Cấu hình DNS

### Thêm A Record

Truy cập DNS manager của nhà cung cấp domain (Namecheap, Cloudflare, GoDaddy…), thêm record:

| Loại | Tên (Host) | Giá trị (Value) | TTL |
|------|------------|-----------------|-----|
| A    | academy    | `104.248.146.203` | 300 (5 phút) — tăng lên 3600 sau khi xác nhận hoạt động |

> **Lưu ý Cloudflare:** Tắt proxy (màu cam → màu xám) trong lúc cấp SSL lần đầu. Bật lại sau khi cert đã được cấp thành công.

### Kiểm tra DNS propagation

```bash
# Kiểm tra A record đã trỏ đúng chưa
dig academy.tc-gaming.live +short

# Hoặc dùng nslookup
nslookup academy.tc-gaming.live

# Kiểm tra từ DNS resolver cụ thể (Google DNS)
dig @8.8.8.8 academy.tc-gaming.live +short
```

Kết quả mong đợi: `104.248.146.203`

> DNS propagation có thể mất từ vài phút đến 48 giờ tùy TTL cũ. Chờ đến khi `dig` trả về đúng IP VPS trước khi chạy certbot.

---

## 4.2 — Cấp SSL bằng Certbot

### Yêu cầu trước
- DNS `academy.tc-gaming.live` đã trỏ về IP VPS (xác nhận bằng `dig` ở bước trên)
- Nginx đang chạy và đã load config mới (block `academy.tc-gaming.live` đã có trong `tc-gaming.conf`)

### Cấp cert mới — thêm vào wildcard cert hiện có

Vì tất cả các subdomain `*.tc-gaming.live` hiện dùng **cùng một cert** tại `/etc/letsencrypt/live/tc-gaming.live/`, chỉ cần **expand** cert đó để thêm `academy.tc-gaming.live`:

```bash
# SSH vào VPS
ssh root@104.248.146.203

# Expand cert hiện có — thêm academy subdomain
certbot --nginx \
  --expand \
  -d tc-gaming.live \
  -d www.tc-gaming.live \
  -d api.tc-gaming.live \
  -d hub.tc-gaming.live \
  -d trade.tc-gaming.live \
  -d sports.tc-gaming.live \
  -d dating.tc-gaming.live \
  -d game.tc-gaming.live \
  -d admin.tc-gaming.live \
  -d banking.tc-gaming.live \
  -d lkvip.tc-gaming.live \
  -d invest.tc-gaming.live \
  -d store.tc-gaming.live \
  -d academy.tc-gaming.live
```

> **Quan trọng:** Phải liệt kê lại **toàn bộ** domain cũ khi dùng `--expand`, nếu thiếu domain nào sẽ bị xóa khỏi cert.

### Kiểm tra auto-renewal

```bash
# Kiểm tra timer certbot
systemctl status certbot.timer

# Test renew thử (dry-run, không thật)
certbot renew --dry-run
```

---

## 4.3 — Commands deploy tuần tự

### Bước 1 — Pull code mới trên VPS

```bash
cd /var/LKVIP
git pull origin main
```

### Bước 2 — Cài dependencies

```bash
# Cài toàn bộ workspace (bao gồm academy)
pnpm install --frozen-lockfile
```

### Bước 3 — Build shared packages trước

```bash
# Build packages/types, packages/ui, packages/utils trước khi build app
pnpm run build:packages
```

### Bước 4 — Build Academy app

```bash
# Build Next.js với output: standalone (đã cấu hình trong next.config.ts)
pnpm --filter @lkvip/academy run build
```

Sau khi build xong, thư mục `.next/standalone/` sẽ được tạo tại `apps/academy/.next/standalone/`.

### Bước 5 — Copy static assets vào standalone (bắt buộc với Next.js standalone)

```bash
# Copy public/ assets
cp -r apps/academy/public apps/academy/.next/standalone/apps/academy/public 2>/dev/null || true

# Copy static assets đã build
cp -r apps/academy/.next/static apps/academy/.next/standalone/apps/academy/.next/static
```

### Bước 6 — Cấu hình biến môi trường production (lần đầu)

```bash
# Tạo .env.production nếu chưa có
cat > apps/academy/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://api.tc-gaming.live
NEXT_PUBLIC_APP_URL=https://academy.tc-gaming.live
NODE_ENV=production
EOF
```

> Các lần deploy tiếp theo file này đã có sẵn, bỏ qua bước này.

### Bước 7 — Reload Nginx

```bash
# Kiểm tra syntax config trước khi reload
nginx -t

# Reload nginx (zero-downtime)
systemctl reload nginx
```

Kết quả mong đợi từ `nginx -t`:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Bước 8 — Start/Reload PM2 entry lkvip-academy

```bash
# Lần đầu tiên (process chưa tồn tại trong PM2)
pm2 start config/pm2/ecosystem.config.js --only lkvip-academy --env production

# Các lần deploy tiếp theo (reload zero-downtime)
pm2 reload config/pm2/ecosystem.config.js --only lkvip-academy --update-env

# Lưu danh sách process để auto-start sau khi reboot
pm2 save
```

### Bước 9 — Kiểm tra status và logs

```bash
# Xem trạng thái tất cả PM2 processes
pm2 status

# Xem logs realtime của academy
pm2 logs lkvip-academy --lines 50

# Xem logs lỗi riêng
tail -f /var/LKVIP/data/logs/lkvip-academy-err.log
```

Kết quả mong đợi trong `pm2 status`:

```
┌─────────────────┬────┬─────────┬──────┬────────┐
│ name            │ id │ status  │ cpu  │ memory │
├─────────────────┼────┼─────────┼──────┼────────┤
│ lkvip-academy   │ X  │ online  │ 0%   │ ~80MB  │
└─────────────────┴────┴─────────┴──────┴────────┘
```

### Bước 10 — Test endpoint cuối cùng

```bash
# Kiểm tra HTTPS trả về 200
curl -I https://academy.tc-gaming.live

# Kiểm tra redirect HTTP → HTTPS
curl -I http://academy.tc-gaming.live

# Kiểm tra cert SSL
echo | openssl s_client -connect academy.tc-gaming.live:443 2>/dev/null | openssl x509 -noout -dates
```

Kết quả mong đợi:
- `HTTP/2 200` từ HTTPS
- `HTTP/1.1 301 Moved Permanently` từ HTTP
- `notAfter` của cert ít nhất 60 ngày từ hôm nay

---

## 4.4 — Rollback nhanh

### Stop process Academy (giữ nguyên nginx)

```bash
# Dừng process mà không xóa khỏi danh sách
pm2 stop lkvip-academy

# Hoặc xóa hoàn toàn khỏi PM2
pm2 delete lkvip-academy
pm2 save
```

### Disable nginx block cho Academy

```bash
# Tạm thời trả về 503 thay vì xóa config
# Thêm dòng sau vào server block academy trong /etc/nginx/sites-available/ (nếu dùng sites-enabled)
# return 503 "Đang bảo trì";

# Hoặc comment toàn bộ block academy trong tc-gaming.conf rồi reload
nginx -t && systemctl reload nginx
```

### Rollback về commit trước

```bash
cd /var/LKVIP

# Xem lịch sử commit
git log --oneline -10

# Rollback về commit cụ thể
git checkout <commit-hash> -- apps/academy/

# Rebuild và reload
pnpm --filter @lkvip/academy run build
pm2 reload lkvip-academy --update-env
```

---

## Tóm tắt port và file

| Thành phần | Giá trị |
|---|---|
| Port nội bộ | `:3013` (chỉ bind `127.0.0.1`) |
| PM2 process name | `lkvip-academy` |
| PM2 script | `apps/academy/start-academy.sh` |
| Nginx upstream | `lkvip_academy` → `127.0.0.1:3013` |
| SSL cert | `/etc/letsencrypt/live/tc-gaming.live/` (cert chung) |
| Log out | `/var/LKVIP/data/logs/lkvip-academy-out.log` |
| Log err | `/var/LKVIP/data/logs/lkvip-academy-err.log` |
| Build output | `apps/academy/.next/standalone/` |
| Start script | `apps/academy/start-academy.sh` |
